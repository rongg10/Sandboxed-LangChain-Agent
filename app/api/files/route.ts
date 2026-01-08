import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { error: "File uploads require BACKEND_URL to be set." },
      { status: 400 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const sessionId = form.get("session_id");
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { error: "Missing session_id." },
      { status: 400 }
    );
  }

  const files = form.getAll("files");
  if (files.length === 0) {
    return NextResponse.json(
      { error: "No files provided." },
      { status: 400 }
    );
  }

  const upstreamForm = new FormData();
  upstreamForm.append("session_id", sessionId);
  for (const file of files) {
    if (file instanceof File) {
      upstreamForm.append("files", file, file.name);
    }
  }

  const response = await fetch(`${backendUrl.replace(/\/$/, "")}/files/upload`, {
    method: "POST",
    body: upstreamForm,
  });

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const error =
      (payload.detail as string) ||
      (payload.error as string) ||
      "Upstream upload error.";
    return NextResponse.json({ error }, { status: response.status });
  }

  return NextResponse.json(payload);
}
