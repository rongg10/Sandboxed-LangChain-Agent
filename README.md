# Sandboxed LangChain Agent

A small LangChain-based agent that can execute Python code in a constrained Node + Pyodide "sandbox" and return stdout/stderr to the model.

## Setup

```bash
node --version  # requires Node 18+
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
```

## Run

```bash
export OPENAI_API_KEY=your_key
python main.py "Calculate the 10th Fibonacci number using code"
```

If you run without a prompt, the script starts an interactive loop.

## Notes on the sandbox

This is a best-effort sandbox meant to reduce risk, not a hardened security boundary. It:

- Runs code via Node + Pyodide (WASM) in a temp directory.
- Applies CPU, file size, and open file limits (best-effort per OS).
- Enforces a short wall-clock timeout in the parent process.

Pyodide in Node is safer than a raw Python subprocess, but it is still not a
hardened sandbox. Python can access the JS bridge, and Node can access the OS
and network unless you add extra containment.

By default, the runner loads Pyodide assets from the local `node_modules/pyodide`
package. If you override `PYODIDE_INDEX_URL`, it should be a local filesystem
path to the Pyodide assets (not a CDN URL).

The sandbox tool returns JSON (status/stdout/stderr/exit_code/timed_out). Set
`SANDBOX_ECHO_CODE=1` to include the executed code in the tool output.

If you need stronger isolation, swap the tool implementation to use Docker, gVisor, or a VM.
