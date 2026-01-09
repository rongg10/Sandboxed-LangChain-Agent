import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { error: "File downloads require BACKEND_URL to be set." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const path = searchParams.get("path");
  const wantsDownload = searchParams.get("download") === "1";
  if (!sessionId || !path) {
    return NextResponse.json(
      { error: "Missing session_id or path." },
      { status: 400 }
    );
  }

  const upstream = new URL(`${backendUrl.replace(/\/$/, "")}/files/download`);
  upstream.searchParams.set("session_id", sessionId);
  upstream.searchParams.set("path", path);

  const response = await fetch(upstream.toString());
  if (!response.ok || !response.body) {
    let payload: Record<string, unknown> = {};
    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch {
      payload = {};
    }
    return NextResponse.json(
      { error: payload.detail || "Upstream download error." },
      { status: response.status }
    );
  }

  const filename = path.split("/").pop() || "file";
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": wantsDownload
        ? `attachment; filename="${filename}"`
        : "inline",
      "Cache-Control": "no-store",
    },
  });
}
