import os
import time
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel

from main import build_agent

app = FastAPI()
agent = build_agent()

RATE_LIMIT_WINDOW_MS = int(os.getenv("RATE_LIMIT_WINDOW_MS", "60000"))
RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX", "20"))
MAX_INPUT_CHARS = int(os.getenv("MAX_INPUT_CHARS", "4000"))

_ip_buckets: dict[str, dict[str, float]] = {}


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatBody(BaseModel):
    messages: list[Message]


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
        reply = agent(_format_messages(messages))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while running the agent.",
        ) from exc

    return {"reply": reply}
