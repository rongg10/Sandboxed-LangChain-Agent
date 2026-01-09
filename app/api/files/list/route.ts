import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ images: [] });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id." },
      { status: 400 }
    );
  }

  const upstream = new URL(`${backendUrl.replace(/\/$/, "")}/files/list`);
  upstream.searchParams.set("session_id", sessionId);

  const response = await fetch(upstream.toString());
  if (!response.ok) {
    let payload: Record<string, unknown> = {};
    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch {
      payload = {};
    }
    return NextResponse.json(
      { error: payload.detail || "Upstream list error." },
      { status: response.status }
    );
  }

  const payload = (await response.json()) as { images?: string[] };
  return NextResponse.json({
    images: Array.isArray(payload.images) ? payload.images : [],
  });
}
