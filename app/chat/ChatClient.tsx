"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const STARTER_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content: "Hi! Share a task and I'll run it in the sandbox.",
  },
];

export default function ChatClient() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") ?? "";
  const [messages, setMessages] = useState<ChatMessage[]>(STARTER_MESSAGES);
  const [input, setInput] = useState(prompt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prompt) {
      setInput(prompt);
    }
  }, [prompt]);

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
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response
          .json()
          .catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Unexpected server response.");
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

          let payload: { type?: string; value?: string; message?: string };
          try {
            payload = JSON.parse(data) as {
              type?: string;
              value?: string;
              message?: string;
            };
          } catch {
            continue;
          }

          if (payload.type === "token" && payload.value) {
            reply += payload.value;
            updateAssistantMessage(reply);
          } else if (payload.type === "error") {
            throw new Error(payload.message || "Stream error.");
          } else if (payload.type === "done") {
            streamDone = true;
            break;
          }
        }
      }

      if (!reply.trim()) {
        updateAssistantMessage("(no output)");
      }
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
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="chat-page">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◼
          </span>
          <div>
            <p className="brand-name">Sandboxed Agent</p>
            <p className="brand-tagline">Node + Pyodide sandbox runner</p>
          </div>
        </div>
        <nav className="nav">
          <Link href="/#product">Product</Link>
          <Link href="/#security">Security</Link>
          <Link href="/#docs">Docs</Link>
        </nav>
        <Link className="button cta ghost" href="/">
          Back to overview
        </Link>
      </header>

      <section className="chat-shell">
        <div className="panel-header">
          <div>
            <p className="panel-title">Live agent console</p>
            <p className="panel-subtitle">
              Short runs with JSON stdout, stderr, and exit status
            </p>
          </div>
          <span className="status-pill">Live</span>
        </div>

        <section className="chat-container" aria-live="polite">
          <div className="message-list">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`message ${message.role}`}
              >
                <span className="message-role">
                  {message.role === "user" ? "You" : "Agent"}
                </span>
                <span className="message-content">{message.content}</span>
              </div>
            ))}
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Ask the agent to run a task"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isLoading}
              aria-label="Message"
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>

          {error ? <p className="notice">{error}</p> : null}
        </section>
      </section>
    </main>
  );
}
