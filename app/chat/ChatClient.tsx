"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../components/LanguageProvider";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatClient() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") ?? "";
  const { t, tf, lang } = useLanguage();
  const starterMessage = t("chatStarter");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "assistant", content: starterMessage },
  ]);
  const [input, setInput] = useState(prompt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const clearedRef = useRef(false);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [{ role: "assistant", content: starterMessage }];
      }
      return prev;
    });
  }, [starterMessage, lang]);

  useEffect(() => {
    if (prompt) {
      setInput(prompt);
    }
  }, [prompt]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const existing = window.sessionStorage.getItem("sandbox_session_id");
    if (existing) {
      setSessionId(existing);
      return;
    }
    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    window.sessionStorage.setItem("sandbox_session_id", created);
    setSessionId(created);
  }, []);

  useEffect(() => {
    if (sessionId) {
      refreshImages();
    }
  }, [sessionId]);

  const clearSession = useCallback(() => {
    if (clearedRef.current || !sessionId) {
      return;
    }
    clearedRef.current = true;
    const payload = JSON.stringify({ session_id: sessionId });
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/files/clear", blob);
    } else {
      fetch("/api/files/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("sandbox_session_id");
    }
  }, [sessionId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      clearSession();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      clearSession();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [clearSession]);

  function updateAssistantMessage(content: string) {
    setMessages((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") {
        next[next.length - 1] = { ...last, content };
      }
      return next;
    });
  }

  async function streamReply(nextMessages: ChatMessage[]) {
    let reply = "";
    let inserted = false;

    try {
      const response = await fetch("/api/chat?stream=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          messages: nextMessages,
          session_id: sessionId || undefined,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response
          .json()
          .catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || t("chatErrorUnexpected"));
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);
      inserted = true;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.trim()) {
            continue;
          }
          const lines = event.split("\n");
          let data = "";
          for (const line of lines) {
            if (line.startsWith("data:")) {
              data += line.slice(5).trim();
            }
          }
          if (!data) {
            continue;
          }

          let payload: { type?: string; value?: string[] | string; message?: string };
          try {
            payload = JSON.parse(data) as {
              type?: string;
              value?: string[] | string;
              message?: string;
            };
          } catch {
            continue;
          }

          if (payload.type === "token" && typeof payload.value === "string") {
            reply += payload.value;
            updateAssistantMessage(reply);
          } else if (payload.type === "images") {
            if (Array.isArray(payload.value)) {
              setImages(payload.value);
            }
          } else if (payload.type === "error") {
            throw new Error(payload.message || t("chatErrorStream"));
          } else if (payload.type === "done") {
            streamDone = true;
            break;
          }
        }
      }

      if (!reply.trim()) {
        updateAssistantMessage(t("chatNoOutput"));
      }
      await refreshImages();
    } catch (err) {
      if (inserted && reply.length === 0) {
        setMessages((prev) => {
          if (prev.length === 0) {
            return prev;
          }
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            next.pop();
          }
          return next;
        });
      }
      throw err;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      await streamReply(nextMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chatRequestFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload() {
    if (!sessionId || pendingFiles.length === 0 || uploading) {
      return;
    }
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("session_id", sessionId);
    pendingFiles.forEach((file) => form.append("files", file, file.name));

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        files?: Array<{ name?: string }>;
      };
      if (!response.ok) {
        throw new Error(payload.error || t("uploadFailed"));
      }
      const names =
        payload.files?.map((entry) => entry.name).filter(Boolean) ||
        pendingFiles.map((file) => file.name);
      setUploadedFiles((prev) => {
        const next = new Set(prev);
        names.forEach((name) => next.add(String(name)));
        return Array.from(next);
      });
      setPendingFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function refreshImages() {
    if (!sessionId) {
      return;
    }
    try {
      const response = await fetch(
        `/api/files/list?session_id=${encodeURIComponent(sessionId)}`
      );
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { images?: string[] };
      if (Array.isArray(payload.images)) {
        setImages(payload.images);
      }
    } catch {
      // ignore refresh failures
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const inputEl = event.currentTarget;
    const files = Array.from(inputEl.files || []);
    setPendingFiles((prev) => {
      const next = [...prev];
      for (const file of files) {
        const exists = next.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified
        );
        if (!exists) {
          next.push(file);
        }
      }
      return next;
    });
    setUploadError(null);
    inputEl.value = "";
  }

  function handleRemovePending(index: number) {
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function imageUrl(path: string, download?: boolean) {
    if (!sessionId) {
      return "";
    }
    const params = new URLSearchParams({
      session_id: sessionId,
      path,
    });
    if (download) {
      params.set("download", "1");
    }
    return `/api/files/download?${params.toString()}`;
  }

  return (
    <main className="chat-page">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◼
          </span>
          <div>
            <p className="brand-name">{t("brandName")}</p>
            <p className="brand-tagline">{t("brandTagline")}</p>
          </div>
        </div>
        <nav className="nav">
          <Link href="/#product">{t("navProduct")}</Link>
          <Link href="/architecture">{t("navArchitecture")}</Link>
          <Link href="/examples">{t("navExamples")}</Link>
          <Link href="/contact">{t("navContact")}</Link>
        </nav>
        <div className="top-bar-actions">
          <Link className="button cta ghost" href="/">
            {t("ctaBackOverview")}
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <section className="chat-shell">
        <div className="panel-header">
          <div>
            <p className="panel-title">{t("chatTitle")}</p>
            <p className="panel-subtitle">{t("chatSubtitle")}</p>
          </div>
          <span className="status-pill">{t("chatStatus")}</span>
        </div>

        <div className="chat-main">
          <div className="chat-side">
            {images.length > 0 ? (
              <section className="image-panel">
                <div>
                  <p className="upload-title">{t("imagePanelTitle")}</p>
                  <p className="upload-subtitle">{t("imagePanelSubtitle")}</p>
                </div>
                <div className="image-grid">
                  {images.map((path) => (
                    <div className="image-card" key={path}>
                      <button
                        type="button"
                        className="image-preview"
                        onClick={() => setActiveImage(path)}
                        aria-label={tf("openImageAria", {
                          name: path.split("/").pop() || "",
                        })}
                      >
                        <img src={imageUrl(path)} alt={path} />
                      </button>
                      <div className="image-meta">
                        <span>{path.split("/").pop()}</span>
                        <a href={imageUrl(path, true)} download>
                          {t("imageDownload")}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="upload-panel">
              <div>
                <p className="upload-title">{t("sessionFilesTitle")}</p>
                <p className="upload-subtitle">
                  {t("sessionFilesSubtitlePrefix")}
                  <span>/data</span>
                  {t("sessionFilesSubtitleSuffix")}
                </p>
              </div>
              <div className="upload-actions">
                <label className="button ghost upload-button">
                  {t("chooseFiles")}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelection}
                  />
                </label>
                <button
                  type="button"
                  className="button primary"
                  onClick={handleUpload}
                  disabled={!pendingFiles.length || uploading || !sessionId}
                >
                  {uploading ? t("uploading") : t("upload")}
                </button>
              </div>
              <div className="upload-meta">
                {pendingFiles.length > 0 ? (
                  <div className="upload-file-list">
                    {pendingFiles.map((file, index) => (
                      <div className="upload-file" key={`${file.name}-${index}`}>
                        <span>{file.name}</span>
                        <button
                          type="button"
                          className="upload-remove"
                          onClick={() => handleRemovePending(index)}
                          aria-label={tf("removeFileAria", { name: file.name })}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{t("noFilesSelected")}</p>
                )}
                {uploadedFiles.length > 0 ? (
                  <p>
                    {t("uploadedLabel")} {uploadedFiles.join(", ")}
                  </p>
                ) : null}
                {uploadError ? <p className="notice">{uploadError}</p> : null}
              </div>
            </section>
          </div>

          <section className="chat-container" aria-live="polite">
            <div className="message-list">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`message ${message.role}`}
                >
                  <span className="message-role">
                    {message.role === "user" ? t("youLabel") : t("agentLabel")}
                  </span>
                  <span className="message-content">{message.content}</span>
                </div>
              ))}
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder={t("chatInputPlaceholder")}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isLoading}
                aria-label={t("chatInputAria")}
              />
              <button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? t("sending") : t("send")}
              </button>
            </form>

            {error ? <p className="notice">{error}</p> : null}
          </section>
        </div>
      </section>
      {activeImage ? (
        <div
          className="image-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="image-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="image-modal-close"
              onClick={() => setActiveImage(null)}
              aria-label={t("closeImageAria")}
            >
              ×
            </button>
            <img src={imageUrl(activeImage)} alt={activeImage} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
