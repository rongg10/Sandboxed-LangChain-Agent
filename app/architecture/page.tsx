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
            <p className="brand-tagline">Dual-sandbox agent runtime</p>
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
          <h1>Two sandboxes, one unified interface.</h1>
          <p className="subhead">
            A lightweight UI forwards requests to a FastAPI service that routes
            each task to Pyodide (fast) or CPython (full data science stack),
            then returns JSON plus images and downloads.
          </p>
        </div>
      </section>

      <section className="info-grid">
        <div className="info-card">
          <h2>Frontend</h2>
          <p>
            Next.js renders the UI, streams responses, and displays images with
            download links.
          </p>
        </div>
        <div className="info-card">
          <h2>Backend router</h2>
          <p>
            FastAPI receives requests, enforces limits, and selects Pyodide or
            CPython based on libraries and workload.
          </p>
        </div>
        <div className="info-card">
          <h2>Sandbox A (Pyodide)</h2>
          <p>
            Node + Pyodide for fast checks, strict limits, and quick validation
            tasks.
          </p>
        </div>
        <div className="info-card">
          <h2>Sandbox B (CPython)</h2>
          <p>
            Full data science stack with pandas, numpy, matplotlib, and seaborn
            for analysis and plotting.
          </p>
        </div>
      </section>

      <section className="info-card">
        <h2>How it was developed</h2>
        <p>
          The project started as a minimal Pyodide agent and evolved into a
          dual-sandbox system. The team added routing logic, image handling, and
          session storage to support data science workflows without losing the
          safety of lightweight execution.
        </p>
      </section>
    </main>
  );
}
