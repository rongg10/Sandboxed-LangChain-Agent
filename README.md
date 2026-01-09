# Sandboxed Agent

A lightweight agent that runs short Python snippets inside a Node + Pyodide
sandbox and returns structured JSON output. The UI is a Next.js app, while the
backend is a FastAPI service that executes the agent and streams results.

## Architecture

- Frontend: Next.js UI + API routes for streaming and file upload proxying.
- Backend: FastAPI service that runs the LangChain agent and sandbox tool.
- Sandbox A: Node + Pyodide runner with best-effort CPU/file/memory limits.
- Sandbox B: CPython subprocess for pandas/numpy/matplotlib/seaborn workloads.

## Features

- Server-side Python execution through Pyodide or CPython
- Streaming responses (SSE)
- Disk-backed per-session file uploads (mounted at `/data` during runs)
- Best-effort resource limits and timeouts

## Requirements

- Node.js 18+
- Python 3.11+

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
npm install
```

## Run locally

Start the backend:

```bash
export OPENAI_API_KEY=your_key
uvicorn backend.server:app --host 0.0.0.0 --port 10000
```

Start the frontend:

```bash
export BACKEND_URL=http://localhost:10000
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Frontend:

- `BACKEND_URL` (URL of the FastAPI service)

Backend:

- `OPENAI_API_KEY` (required)
- `SANDBOX_AS_MB` (address space cap in MB; set `0` to disable)
- `SANDBOX_TIMEOUT_S` (sandbox wall-clock timeout)
- `CPYTHON_BIN` (override CPython executable)
- `CPYTHON_TIMEOUT_S` (CPython wall-clock timeout)
- `CPYTHON_FSIZE_MB` (CPython file size cap)
- `CPYTHON_NOFILE` (CPython open file limit)
- `CPYTHON_AS_MB` (CPython address space cap; `0` disables)
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` (request throttling)
- `MAX_INPUT_CHARS` (input size cap)
- `SESSION_BASE_DIR` (default `/tmp/sandbox-sessions`)
- `SESSION_TTL_S` (default `600`, 10 minutes)
- `SESSION_MAX_BYTES` (default `5242880`, 5MB)

## Session files

Uploads are stored on disk per `session_id`, copied into the Pyodide filesystem
at `/data` for each run, and cleared when the user leaves the chat or when TTL
expires. The frontend keeps a session ID in `sessionStorage`.

## Notes

- This is a best-effort sandbox, not a hardened security boundary.
- Pyodide assets are loaded from the local `node_modules/pyodide` package.
- If you override `PYODIDE_INDEX_URL`, use a local filesystem path.
- Sandbox B uses the system Python environment, so install pandas/numpy/matplotlib/seaborn.
