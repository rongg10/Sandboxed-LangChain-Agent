# Sandboxed Agent

Dual-sandbox agent runtime with a Next.js UI and a FastAPI backend. Lightweight
tasks run in Pyodide, heavier data science work runs in CPython. Responses are
structured JSON, with images previewable and downloadable from the UI.

## Highlights

- Two sandboxes: Pyodide for fast checks, CPython for pandas/numpy/matplotlib/seaborn.
- Streaming replies (SSE) with stdout, stderr, exit code, and timing info.
- Disk-backed per-session uploads mounted at `/data` for each run.
- Images saved under `/data/outputs` are surfaced in the UI.
- Language toggle (EN/ZH) in the top-right of the UI.

## Architecture

- Frontend: Next.js UI + API routes proxying chat and file endpoints.
- Backend: FastAPI service with routing logic and session storage.
- Sandbox A (Pyodide): Node + Pyodide with tight CPU/memory/file limits.
- Sandbox B (CPython): Subprocess runner with full Python ecosystem.

## Local setup

Requirements:

- Node.js 18+
- Python 3.11+

Install:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
npm install
```

## Run locally

Backend:

```bash
export OPENAI_API_KEY=your_key
uvicorn backend.server:app --host 0.0.0.0 --port 10000
```

Frontend:

```bash
export BACKEND_URL=http://localhost:10000
npm run dev
```

Open `http://localhost:3000`.

## Session files and images

- Each request carries a `session_id` (stored in `sessionStorage`).
- Uploaded files are stored on disk per session and copied into `/data` for each run.
- If the agent creates images, save them to `/data/outputs/*.png` (or jpg/webp/gif).
- After execution, `/data` is copied back to the session directory so outputs persist.
- Sessions are cleaned up on chat exit and by TTL.

## Environment variables

Frontend:

- `BACKEND_URL` - URL of the FastAPI service.

Backend:

- `OPENAI_API_KEY` - required for the agent.
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` - request throttling.
- `MAX_INPUT_CHARS` - input size cap.
- `SESSION_BASE_DIR` - session root (default `/tmp/sandbox-sessions`).
- `SESSION_TTL_S` - session TTL in seconds (default `600`).
- `SESSION_MAX_BYTES` - max bytes per session (default `5242880`, 5MB).

Pyodide sandbox:

- `SANDBOX_TIMEOUT_S` - wall-clock timeout (default `6`).
- `SANDBOX_AS_MB` - address space cap in MB (default `768`, set `0` to disable).
- `PYODIDE_INDEX_URL` - override Pyodide assets location.
- `SANDBOX_ECHO_CODE` - include executed code in JSON output (`1`/`true`).

CPython sandbox:

- `CPYTHON_BIN` - override Python executable (falls back to `PYTHON_BIN` or `python`).
- `CPYTHON_TIMEOUT_S` - wall-clock timeout (default `15`).
- `CPYTHON_FSIZE_MB` - file size cap (default `50`).
- `CPYTHON_NOFILE` - open file limit (default `64`).
- `CPYTHON_AS_MB` - address space cap (default `0`, disabled).
- `CPYTHON_DATA_ROOT` - working data dir (default `/data`).
- `SANDBOX_ECHO_CODE` - include executed code in JSON output (`1`/`true`).

## Notes

- This is a best-effort sandbox, not a hardened security boundary.
- Pyodide assets load from the local `node_modules/pyodide` package by default.
- CPython sandbox uses the system Python environment, so install pandas/numpy/matplotlib/seaborn there.
