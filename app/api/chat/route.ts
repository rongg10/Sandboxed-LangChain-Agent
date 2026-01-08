import { NextResponse } from "next/server";

import { runAgent } from "@/lib/agent";

// Server-only API route that calls the Python agent.
type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatBody = {
  messages?: ClientMessage[];
  session_id?: string;
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
  const sessionId =
    typeof body.session_id === "string" ? body.session_id.trim() : "";
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
    const wantsStream =
      new URL(request.url).searchParams.get("stream") === "1" ||
      request.headers.get("accept")?.includes("text/event-stream");
    const backendUrl = process.env.BACKEND_URL;
    if (wantsStream) {
      if (backendUrl) {
        const response = await fetch(
          `${backendUrl.replace(/\/$/, "")}/chat/stream`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: JSON.stringify({
              messages,
              session_id: sessionId || undefined,
            }),
          }
        );

        if (!response.ok || !response.body) {
          let detail = "Upstream agent error.";
          try {
            const payload = (await response.json()) as { detail?: string };
            detail = payload.detail || detail;
          } catch {
            // ignore JSON parse errors
          }
          return NextResponse.json({ error: detail }, { status: response.status });
        }

        return new Response(response.body, {
          status: response.status,
          headers: {
            "Content-Type":
              response.headers.get("content-type") || "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      const reply = await runAgent(messages);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "token", value: reply })}\n\n`
            )
          );
          controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    if (backendUrl) {
      const response = await fetch(`${backendUrl.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          session_id: sessionId || undefined,
        }),
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
