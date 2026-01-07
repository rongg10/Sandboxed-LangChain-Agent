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
    content: "Hi! Ask me anything and I'll run the agent on the server.",
  },
];

export default function ChatPage() {
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const payload = (await response.json()) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok || typeof payload.reply !== "string") {
        throw new Error(payload.error || "Unexpected server response.");
      }

      const reply = payload.reply;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
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
            <p className="brand-tagline">Secure execution for modern teams</p>
          </div>
        </div>
        <nav className="nav">
          <Link href="/">Overview</Link>
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
              Server-only execution with structured logs
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
