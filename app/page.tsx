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

      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "Unexpected server response.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: payload.reply },
      ]);
    } catch (err) {
      // Surface a friendly error without leaking internals.
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <header>
        <h1>Sandboxed Agent</h1>
        <p>Server-only execution, no API keys in the browser.</p>
      </header>

      <section className="chat-container" aria-live="polite">
        <div className="message-list">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`message ${message.role}`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type your message"
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
    </main>
  );
}
