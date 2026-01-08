import json
import os
import subprocess
import tempfile

try:
    import resource
except ImportError:  # Windows
    resource = None

from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool


class SandboxedPythonInput(BaseModel):
    code: str = Field(..., description="Python code to execute")
    timeout_s: int = Field(2, ge=1, le=10, description="Wall-clock timeout in seconds")


class SandboxedPythonTool(BaseTool):
    name: str = "sandboxed_python"
    description: str = (
        "Execute short Python code in a constrained Node+Pyodide subprocess and return stdout/stderr. "
        "Use for quick calculations or verification."
    )
    args_schema: type[BaseModel] = SandboxedPythonInput

    def _truncate_head(self, text: str, limit: int) -> tuple[str, bool]:
        if len(text) <= limit:
            return text, False
        return text[:limit] + "\n...<truncated>...", True

    def _truncate_tail(self, text: str, limit: int) -> tuple[str, bool]:
        if len(text) <= limit:
            return text, False
        return "...<truncated>...\n" + text[-limit:], True

    def _run(self, code: str, timeout_s: int = 2) -> str:
        with tempfile.TemporaryDirectory(prefix="sandbox-") as tmpdir:
            script_path = os.path.join(tmpdir, "snippet.py")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            echo_code = os.environ.get("SANDBOX_ECHO_CODE", "").lower() in {
                "1",
                "true",
                "yes",
            }
            env = {"PATH": os.environ.get("PATH", "")}
            index_url = os.environ.get("PYODIDE_INDEX_URL")
            if index_url:
                env["PYODIDE_INDEX_URL"] = index_url

            def _limit_resources() -> None:
                if resource is None:
                    return
                # CPU seconds
                resource.setrlimit(resource.RLIMIT_CPU, (timeout_s, timeout_s))
                # Limit file size to 1MB
                resource.setrlimit(resource.RLIMIT_FSIZE, (1 * 1024 * 1024, 1 * 1024 * 1024))
                # Limit number of open files
                resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
                # Address space limit (best-effort; may be ignored on some OSes)
                try:
                    as_mb = int(os.environ.get("SANDBOX_AS_MB", "384"))
                    as_bytes = max(64, as_mb) * 1024 * 1024
                    resource.setrlimit(resource.RLIMIT_AS, (as_bytes, as_bytes))
                except Exception:
                    pass

            runner_path = os.path.join(os.path.dirname(__file__), "pyodide_runner.mjs")
            node_bin = os.environ.get("NODE_BIN", "node")
            if not os.path.exists(runner_path):
                return f"Pyodide runner not found at {runner_path}."
            cmd = [node_bin, runner_path, script_path]
            try:
                completed = subprocess.run(
                    cmd,
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
                    "stderr": "Node runtime not found. Install Node 18+ or set NODE_BIN.",
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

    async def _arun(self, code: str, timeout_s: int = 2) -> str:
        raise NotImplementedError("SandboxedPythonTool does not support async")
