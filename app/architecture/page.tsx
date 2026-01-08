import Link from "next/link";

export default function ArchitecturePage() {
  return (
    <main className="page">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◼
          </span>
          <div>
            <p className="brand-name">Sandboxed Agent</p>
            <p className="brand-tagline">Node + Pyodide sandbox runner</p>
          </div>
        </div>
        <nav className="nav">
          <Link href="/#product">Product</Link>
          <Link href="/architecture">Architecture</Link>
          <Link href="/examples">Examples</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <Link className="button cta ghost" href="/chat">
          Open console
        </Link>
      </header>

      <section className="examples-hero">
        <div>
          <p className="eyebrow">Architecture</p>
          <h1>Split frontend, backend, and sandboxed execution.</h1>
          <p className="subhead">
            The product is built as a lightweight UI that forwards requests to a
            FastAPI service, which then runs Python inside a Node + Pyodide
            sandbox and returns structured JSON output.
          </p>
        </div>
      </section>

      <section className="info-grid">
        <div className="info-card">
          <h2>Frontend</h2>
          <p>
            Next.js renders the landing pages and chat UI, streams tokens, and
            proxies file uploads to the backend service.
          </p>
        </div>
        <div className="info-card">
          <h2>Backend</h2>
          <p>
            FastAPI receives chat messages, enforces rate limits, and runs the
            LangChain agent with the sandboxed Python tool.
          </p>
        </div>
        <div className="info-card">
          <h2>Sandbox</h2>
          <p>
            Node + Pyodide executes code with best-effort CPU, file, and memory
            caps, returning stdout/stderr/exit metadata.
          </p>
        </div>
        <div className="info-card">
          <h2>Session storage</h2>
          <p>
            Uploads are stored on disk per session, copied into /data for each
            run, and cleared on exit or TTL expiry.
          </p>
        </div>
      </section>

      <section className="info-card">
        <h2>How it was developed</h2>
        <p>
          The project started as a minimal agent loop, then evolved into a
          two-service deployment for reliability. The UI was built first to
          validate workflows, followed by the sandbox runner, resource limits,
          streaming, and file session support.
        </p>
      </section>
    </main>
  );
}
