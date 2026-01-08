import contextvars
from typing import Optional

_session_files_dir: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "sandbox_session_files_dir", default=None
)


def set_session_files_dir(path: Optional[str]) -> contextvars.Token:
    return _session_files_dir.set(path)


def reset_session_files_dir(token: contextvars.Token) -> None:
    _session_files_dir.reset(token)


def get_session_files_dir() -> Optional[str]:
    return _session_files_dir.get()
