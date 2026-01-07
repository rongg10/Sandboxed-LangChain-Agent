"use client";

import { FormEvent, useState } from "react";

// Client-only UI; no secrets or agent execution live here.
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Seed the UI with a friendly assistant prompt.
const STARTER_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content: "Hi! Ask me anything and I'll run the agent on the server.",
  },
];

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>(STARTER_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Send the full conversation to the server-side agent.
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
      // Surface a friendly error without leaking internals.
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page">
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
          <a href="#">Product</a>
          <a href="#">Security</a>
          <a href="#">Solutions</a>
          <a href="#">Docs</a>
        </nav>
        <button className="cta" type="button">
          Request demo
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Enterprise-ready agent runtime</p>
          <h1>Automate with confidence in a secure, controlled sandbox.</h1>
          <p className="subhead">
            Run tasks on the server, keep credentials locked down, and ship
            reliable automations without compromising your stack.
          </p>
          <div className="hero-actions">
            <button className="primary" type="button">
              Start a session
            </button>
            <button className="ghost" type="button">
              View documentation
            </button>
          </div>
          <div className="metrics">
            <div className="metric">
              <span className="metric-value">99.99%</span>
              <span className="metric-label">Uptime SLA</span>
            </div>
            <div className="metric">
              <span className="metric-value">120ms</span>
              <span className="metric-label">Median response</span>
            </div>
            <div className="metric">
              <span className="metric-value">SOC 2</span>
              <span className="metric-label">Audit ready</span>
            </div>
          </div>
          <div className="trust-row">
            <span>Role-based access</span>
            <span>Audit trails</span>
            <span>Regional isolation</span>
          </div>
        </div>

        <div className="hero-panel">
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
        </div>
      </section>

      <footer className="page-footer">
        <p>Trusted by security-first teams shipping production agents.</p>
      </footer>
    </main>
  );
}
