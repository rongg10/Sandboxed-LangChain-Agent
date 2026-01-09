import json
import os
import shutil
import subprocess
import tempfile
import threading

try:
    import resource
except ImportError:  # Windows
    resource = None

from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool

from sandbox_session import get_session_files_dir

_CPYTHON_LOCK = threading.Lock()


class CpythonSandboxInput(BaseModel):
    code: str = Field(..., description="Python code to execute")
    timeout_s: int = Field(15, ge=1, le=60, description="Wall-clock timeout in seconds")


class CpythonSandboxTool(BaseTool):
    name: str = "cpython_python"
    description: str = (
        "Execute Python code in a CPython subprocess with full ecosystem "
        "(pandas/numpy/matplotlib/seaborn). Use for data science or plotting tasks."
    )
    args_schema: type[BaseModel] = CpythonSandboxInput

    def _truncate_head(self, text: str, limit: int) -> tuple[str, bool]:
        if len(text) <= limit:
            return text, False
        return text[:limit] + "\n...<truncated>...", True

    def _truncate_tail(self, text: str, limit: int) -> tuple[str, bool]:
        if len(text) <= limit:
            return text, False
        return "...<truncated>...\n" + text[-limit:], True

    def _run(self, code: str, timeout_s: int = 15) -> str:
        timeout_s = int(os.environ.get("CPYTHON_TIMEOUT_S", str(timeout_s)))
        python_bin = os.environ.get("CPYTHON_BIN", os.environ.get("PYTHON_BIN", "python"))
        session_dir = get_session_files_dir()

        with tempfile.TemporaryDirectory(prefix="cpython-sandbox-") as tmpdir:
            script_path = os.path.join(tmpdir, "snippet.py")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            echo_code = os.environ.get("SANDBOX_ECHO_CODE", "").lower() in {
                "1",
                "true",
                "yes",
            }

            env = os.environ.copy()
            env["PYTHONUNBUFFERED"] = "1"

            def _limit_resources() -> None:
                if resource is None:
                    return
                # CPU seconds
                resource.setrlimit(resource.RLIMIT_CPU, (timeout_s, timeout_s))
                # Limit file size
                try:
                    fsize_mb = int(os.environ.get("CPYTHON_FSIZE_MB", "50"))
                    if fsize_mb > 0:
                        fsize = fsize_mb * 1024 * 1024
                        resource.setrlimit(resource.RLIMIT_FSIZE, (fsize, fsize))
                except Exception:
                    pass
                # Limit number of open files
                try:
                    nofile = int(os.environ.get("CPYTHON_NOFILE", "64"))
                    resource.setrlimit(resource.RLIMIT_NOFILE, (nofile, nofile))
                except Exception:
                    pass
                # Address space limit (best-effort)
                try:
                    as_mb = int(os.environ.get("CPYTHON_AS_MB", "0"))
                    if as_mb > 0:
                        as_bytes = max(256, as_mb) * 1024 * 1024
                        resource.setrlimit(resource.RLIMIT_AS, (as_bytes, as_bytes))
                except Exception:
                    pass

            copied_paths: list[str] = []
            data_root = "/data"

            with _CPYTHON_LOCK:
                try:
                    os.makedirs(data_root, exist_ok=True)
                    if session_dir and os.path.isdir(session_dir):
                        for root, _, files in os.walk(session_dir):
                            for name in files:
                                src = os.path.join(root, name)
                                rel = os.path.relpath(src, session_dir)
                                dest = os.path.join(data_root, rel)
                                os.makedirs(os.path.dirname(dest), exist_ok=True)
                                shutil.copy2(src, dest)
                                copied_paths.append(dest)

                    completed = subprocess.run(
                        [python_bin, script_path],
                        cwd=tmpdir,
                        env=env,
                        text=True,
                        capture_output=True,
                        timeout=timeout_s,
                        check=False,
                        preexec_fn=_limit_resources if resource is not None else None,
                    )
                except FileNotFoundError:
                    payload = {
                        "status": "error",
                        "exit_code": None,
                        "timed_out": False,
                        "stdout": "",
                        "stderr": "Python runtime not found. Install Python or set CPYTHON_BIN.",
                        "stdout_truncated": False,
                        "stderr_truncated": False,
                    }
                    if echo_code:
                        payload["code"] = code
                    return json.dumps(payload, ensure_ascii=True)
                except subprocess.TimeoutExpired:
                    payload = {
                        "status": "timeout",
                        "exit_code": None,
                        "timed_out": True,
                        "stdout": "",
                        "stderr": "Timed out while executing code.",
                        "stdout_truncated": False,
                        "stderr_truncated": False,
                    }
                    if echo_code:
                        payload["code"] = code
                    return json.dumps(payload, ensure_ascii=True)
                finally:
                    for path in copied_paths:
                        try:
                            os.remove(path)
                        except OSError:
                            pass

            stdout = completed.stdout.strip()
            stderr = completed.stderr.strip()
            stdout, stdout_truncated = self._truncate_head(stdout, 4000)
            stderr, stderr_truncated = self._truncate_tail(stderr, 4000)
            status = "ok"
            if completed.returncode != 0:
                status = "error"
            elif stderr:
                status = "warning"

            payload = {
                "status": status,
                "exit_code": completed.returncode,
                "timed_out": False,
                "stdout": stdout,
                "stderr": stderr,
                "stdout_truncated": stdout_truncated,
                "stderr_truncated": stderr_truncated,
            }
            if echo_code:
                payload["code"] = code
            if not stdout and not stderr and completed.returncode == 0:
                payload["stdout"] = "(no output)"
            return json.dumps(payload, ensure_ascii=True)

    async def _arun(self, code: str, timeout_s: int = 15) -> str:
        raise NotImplementedError("CpythonSandboxTool does not support async")
