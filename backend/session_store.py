import json
import os
import re
import shutil
import time
from typing import Optional

SESSION_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{6,80}$")

SESSION_BASE_DIR = os.getenv("SESSION_BASE_DIR", "/tmp/sandbox-sessions")
SESSION_TTL_S = int(os.getenv("SESSION_TTL_S", "1800"))
SESSION_MAX_BYTES = int(os.getenv("SESSION_MAX_BYTES", str(50 * 1024 * 1024)))
SESSION_META_FILENAME = "session.json"

_last_cleanup_ts = 0.0
_cleanup_interval_s = 60.0


def validate_session_id(session_id: str) -> str:
    cleaned = session_id.strip()
    if not cleaned or not SESSION_ID_RE.match(cleaned):
        raise ValueError("Invalid session_id.")
    return cleaned


def get_session_root(session_id: str) -> str:
    return os.path.join(SESSION_BASE_DIR, session_id)


def get_session_files_dir(session_id: str) -> str:
    return os.path.join(get_session_root(session_id), "files")


def _meta_path(session_root: str) -> str:
    return os.path.join(session_root, SESSION_META_FILENAME)


def _read_meta(session_root: str) -> Optional[dict]:
    meta_path = _meta_path(session_root)
    if not os.path.exists(meta_path):
        return None
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
        if isinstance(payload, dict):
            return payload
    except Exception:
        return None
    return None


def _write_meta(session_root: str, total_bytes: int, last_access: float) -> None:
    meta_path = _meta_path(session_root)
    payload = {"total_bytes": int(total_bytes), "last_access": float(last_access)}
    os.makedirs(session_root, exist_ok=True)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(payload, f)


def _calculate_dir_size(root: str) -> int:
    total = 0
    for base, _, files in os.walk(root):
        for name in files:
            try:
                total += os.path.getsize(os.path.join(base, name))
            except OSError:
                continue
    return total


def ensure_session(session_id: str) -> dict:
    session_root = get_session_root(session_id)
    files_dir = get_session_files_dir(session_id)
    os.makedirs(files_dir, exist_ok=True)
    meta = _read_meta(session_root)
    now = time.time()
    if meta is None:
        total_bytes = _calculate_dir_size(files_dir)
        _write_meta(session_root, total_bytes, now)
        return {"total_bytes": total_bytes, "last_access": now}
    _write_meta(
        session_root,
        int(meta.get("total_bytes", 0)),
        now,
    )
    return {"total_bytes": int(meta.get("total_bytes", 0)), "last_access": now}


def update_session_access(session_id: str) -> None:
    session_root = get_session_root(session_id)
    meta = _read_meta(session_root)
    now = time.time()
    if meta is None:
        total_bytes = _calculate_dir_size(get_session_files_dir(session_id))
        _write_meta(session_root, total_bytes, now)
        return
    _write_meta(session_root, int(meta.get("total_bytes", 0)), now)


def maybe_cleanup_sessions() -> None:
    global _last_cleanup_ts
    now = time.time()
    if now - _last_cleanup_ts < _cleanup_interval_s:
        return
    _last_cleanup_ts = now
    if not os.path.isdir(SESSION_BASE_DIR):
        return
    for entry in os.listdir(SESSION_BASE_DIR):
        session_root = os.path.join(SESSION_BASE_DIR, entry)
        if not os.path.isdir(session_root):
            continue
        meta = _read_meta(session_root)
        last_access = None
        if meta:
            last_access = meta.get("last_access")
        if last_access is None:
            try:
                last_access = os.path.getmtime(session_root)
            except OSError:
                last_access = now
        if now - float(last_access) > SESSION_TTL_S:
            shutil.rmtree(session_root, ignore_errors=True)


def safe_filename(filename: str) -> str:
    base = os.path.basename(filename).strip()
    if not base:
        raise ValueError("Invalid filename.")
    return base


def reserve_space(session_id: str, file_size: int, existing_size: int = 0) -> int:
    session_root = get_session_root(session_id)
    meta = _read_meta(session_root)
    total_bytes = int(meta.get("total_bytes", 0)) if meta else 0
    new_total = total_bytes - existing_size + file_size
    if new_total > SESSION_MAX_BYTES:
        raise ValueError("Session storage limit exceeded.")
    _write_meta(session_root, new_total, time.time())
    return new_total
