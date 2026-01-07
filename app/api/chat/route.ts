import { NextResponse } from "next/server";

import { runAgent } from "@/lib/agent";

// Server-only API route that calls the Python agent.
type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatBody = {
  messages?: ClientMessage[];
};

export const runtime = "nodejs";

// Simple per-IP rate limit to protect your free-tier budget.
const RATE_LIMIT_WINDOW_MS = Number(
  process.env.RATE_LIMIT_WINDOW_MS || "60000"
);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || "20");
// Rough input cap to keep token usage predictable.
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS || "4000");

// In-memory buckets reset with process restarts (fine for a minimal MVP).
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = ipBuckets.get(ip);
  if (!entry || entry.resetAt <= now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, retryAfterMs: 0 };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

function normalizeMessages(messages: ClientMessage[]): ClientMessage[] {
  return messages
    // Only allow expected roles and string content from the client.
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string"
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0);
}

export async function POST(request: Request) {
  // All agent execution stays on the server.
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const messages = normalizeMessages(body.messages || []);
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Please provide at least one message." },
      { status: 400 }
    );
  }

  const inputChars = messages.reduce(
    (total, message) => total + message.content.length,
    0
  );
  if (inputChars > MAX_INPUT_CHARS) {
    return NextResponse.json(
      {
        error:
          "Message too long. Please shorten your request and try again.",
      },
      { status: 400 }
    );
  }

  try {
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl) {
      const response = await fetch(`${backendUrl.replace(/\\/$/, "")}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const payload = (await response.json()) as {
        reply?: string;
        detail?: string;
      };
      if (!response.ok || !payload.reply) {
        return NextResponse.json(
          { error: payload.detail || "Upstream agent error." },
          { status: response.status }
        );
      }
      return NextResponse.json({ reply: payload.reply });
    }

    const reply = await runAgent(messages);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: "Something went wrong while running the agent." },
      { status: 500 }
    );
  }
}
