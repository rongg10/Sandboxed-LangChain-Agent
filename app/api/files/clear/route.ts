import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ status: "ok" });
  }

  let body: { session_id?: string } = {};
  try {
    body = (await request.json()) as { session_id?: string };
  } catch {
    body = {};
  }

  const sessionId = body.session_id;
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { error: "Missing session_id." },
      { status: 400 }
    );
  }

  const response = await fetch(`${backendUrl.replace(/\/$/, "")}/files/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    let payload: Record<string, unknown> = {};
    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch {
      payload = {};
    }
    return NextResponse.json(
      { error: payload.detail || "Upstream clear error." },
      { status: response.status }
    );
  }

  return NextResponse.json({ status: "ok" });
}
