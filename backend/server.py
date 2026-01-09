import json
import os
import time
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from main import build_agent, build_agent_streamer
from sandbox_session import reset_session_files_dir, set_session_files_dir
from backend.session_store import (
    SESSION_MAX_BYTES,
    clear_session,
    ensure_session,
    get_session_files_dir,
    maybe_cleanup_sessions,
    reserve_space,
    safe_filename,
    update_session_access,
    validate_session_id,
)

app = FastAPI()
agent = build_agent()
agent_streamer = build_agent_streamer()

RATE_LIMIT_WINDOW_MS = int(os.getenv("RATE_LIMIT_WINDOW_MS", "60000"))
RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX", "20"))
MAX_INPUT_CHARS = int(os.getenv("MAX_INPUT_CHARS", "4000"))

_ip_buckets: dict[str, dict[str, float]] = {}


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatBody(BaseModel):
    messages: list[Message]
    session_id: str | None = None


class SessionRequest(BaseModel):
    session_id: str


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _check_rate_limit(ip: str) -> None:
    now = time.time() * 1000
    entry = _ip_buckets.get(ip)
    if not entry or entry["reset_at"] <= now:
        _ip_buckets[ip] = {"count": 1, "reset_at": now + RATE_LIMIT_WINDOW_MS}
        return
    if entry["count"] >= RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait and try again.",
        )
    entry["count"] += 1


def _format_messages(messages: list[Message]) -> str:
    labels = {"user": "User", "assistant": "Assistant"}
    parts = []
    for message in messages:
        content = message.content.strip()
        if content:
            parts.append(f"{labels[message.role]}: {content}")
    return "\n\n".join(parts)


def _list_session_files(session_dir: str) -> tuple[list[str], bool]:
    items: list[str] = []
    try:
        for root, _, files in os.walk(session_dir):
            for name in files:
                rel = os.path.relpath(os.path.join(root, name), session_dir)
                items.append(rel)
                if len(items) >= 200:
                    return sorted(items), True
    except Exception:
        return [], False
    return sorted(items), False


def _list_session_images(session_dir: str) -> list[str]:
    files, _ = _list_session_files(session_dir)
    image_exts = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
    images = []
    for name in files:
        _, ext = os.path.splitext(name)
        if ext.lower() in image_exts:
            images.append(name)
    return images


def _resolve_session_file(session_id: str, rel_path: str) -> str:
    files_dir = get_session_files_dir(session_id)
    cleaned = os.path.normpath(rel_path).lstrip(os.sep).lstrip("/")
    if not cleaned or cleaned.startswith(".."):
        raise HTTPException(status_code=400, detail="Invalid file path.")
    abs_path = os.path.abspath(os.path.join(files_dir, cleaned))
    base = os.path.abspath(files_dir)
    if not abs_path.startswith(base + os.sep) and abs_path != base:
        raise HTTPException(status_code=400, detail="Invalid file path.")
    return abs_path


def _append_session_context(prompt: str, session_files: list[str], truncated: bool) -> str:
    if not session_files:
        return prompt
    listing = "\n".join(f"- {name}" for name in session_files)
    suffix = (
        "Session files available in /data:\n"
        f"{listing}\n"
        "Use absolute paths under /data when opening files."
    )
    if truncated:
        suffix += "\n(Additional files omitted from this list.)"
    return f"{prompt}\n\n{suffix}"


def _resolve_session_dir(session_id: str | None) -> str | None:
    if not session_id:
        return None
    maybe_cleanup_sessions()
    try:
        cleaned = validate_session_id(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    ensure_session(cleaned)
    update_session_access(cleaned)
    return get_session_files_dir(cleaned)


@app.post("/files/upload")
async def upload_files(
    session_id: str = Form(...), files: list[UploadFile] = File(...)
) -> dict[str, object]:
    try:
        cleaned = validate_session_id(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    maybe_cleanup_sessions()
    meta = ensure_session(cleaned)
    files_dir = get_session_files_dir(cleaned)
    session_total = int(meta.get("total_bytes", 0))
    saved: list[dict[str, object]] = []

    for upload in files:
        try:
            filename = safe_filename(upload.filename or "")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        target_path = os.path.join(files_dir, filename)
        existing_size = os.path.getsize(target_path) if os.path.exists(target_path) else 0
        temp_path = f"{target_path}.uploading"

        size = 0
        try:
            with open(temp_path, "wb") as f:
                while True:
                    chunk = await upload.read(1024 * 1024)
                    if not chunk:
                        break
                    size += len(chunk)
                    new_total = session_total - existing_size + size
                    if new_total > SESSION_MAX_BYTES:
                        raise HTTPException(
                            status_code=413,
                            detail="Session storage limit exceeded.",
                        )
                    f.write(chunk)
        except HTTPException:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise
        finally:
            await upload.close()

        try:
            reserve_space(cleaned, size, existing_size=existing_size)
        except ValueError as exc:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(status_code=413, detail=str(exc)) from exc

        os.replace(temp_path, target_path)
        saved.append({"name": filename, "size": size})
        session_total = session_total - existing_size + size

    update_session_access(cleaned)
    return {"status": "ok", "files": saved}


@app.post("/files/clear")
def clear_files(payload: SessionRequest) -> dict[str, str]:
    try:
        cleaned = validate_session_id(payload.session_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    clear_session(cleaned)
    return {"status": "ok"}


@app.get("/files/download")
def download_file(session_id: str, path: str):
    try:
        cleaned = validate_session_id(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    file_path = _resolve_session_file(cleaned, path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
    update_session_access(cleaned)
    return FileResponse(file_path)


@app.get("/files/list")
def list_files(session_id: str):
    try:
        cleaned = validate_session_id(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    session_dir = get_session_files_dir(cleaned)
    images = _list_session_images(session_dir) if os.path.isdir(session_dir) else []
    update_session_access(cleaned)
    return {"images": images}


@app.post("/chat")
def chat(body: ChatBody, request: Request) -> dict[str, str]:
    _check_rate_limit(_get_client_ip(request))

    messages = [message for message in body.messages if message.content.strip()]
    if not messages:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one message.",
        )

    input_chars = sum(len(message.content) for message in messages)
    if input_chars > MAX_INPUT_CHARS:
        raise HTTPException(
            status_code=400,
            detail="Message too long. Please shorten your request and try again.",
        )

    try:
        session_dir = _resolve_session_dir(body.session_id)
        session_files = []
        truncated = False
        if session_dir:
            session_files, truncated = _list_session_files(session_dir)
        token = set_session_files_dir(session_dir)
        try:
            prompt = _append_session_context(
                _format_messages(messages), session_files, truncated
            )
            reply = agent(prompt)
        finally:
            reset_session_files_dir(token)
        session_images = _list_session_images(session_dir) if session_dir else []
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while running the agent.",
        ) from exc

    return {"reply": reply, "images": session_images}


@app.post("/chat/stream")
async def chat_stream(body: ChatBody, request: Request):
    _check_rate_limit(_get_client_ip(request))

    messages = [message for message in body.messages if message.content.strip()]
    if not messages:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one message.",
        )

    input_chars = sum(len(message.content) for message in messages)
    if input_chars > MAX_INPUT_CHARS:
        raise HTTPException(
            status_code=400,
            detail="Message too long. Please shorten your request and try again.",
        )

    session_dir = _resolve_session_dir(body.session_id)
    session_files = []
    truncated = False
    if session_dir:
        session_files, truncated = _list_session_files(session_dir)
    prompt = _append_session_context(
        _format_messages(messages), session_files, truncated
    )

    async def event_stream():
        try:
            token_ctx = set_session_files_dir(session_dir)
            try:
                async for token in agent_streamer(prompt):
                    payload = json.dumps(
                        {"type": "token", "value": token}, ensure_ascii=True
                    )
                    yield f"data: {payload}\n\n"
                session_images = _list_session_images(session_dir) if session_dir else []
                images_payload = json.dumps(
                    {"type": "images", "value": session_images}, ensure_ascii=True
                )
                yield f"data: {images_payload}\n\n"
                yield 'data: {"type":"done"}\n\n'
            finally:
                reset_session_files_dir(token_ctx)
        except Exception:
            payload = json.dumps(
                {"type": "error", "message": "Something went wrong while running the agent."},
                ensure_ascii=True,
            )
            yield f"data: {payload}\n\n"
            yield 'data: {"type":"done"}\n\n'

    headers = {"Cache-Control": "no-cache", "Connection": "keep-alive"}
    return StreamingResponse(event_stream(), media_type="text/event-stream", headers=headers)
