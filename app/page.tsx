"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    const target = trimmed
      ? `/chat?prompt=${encodeURIComponent(trimmed)}`
      : "/chat";
    router.push(target);
  }

  function handleQuickStart() {
    router.push("/chat");
  }

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
        <Link className="button cta" href="/#demo">
          Request demo
        </Link>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Pyodide-backed execution</p>
          <h1>Run short Python tasks in a constrained sandbox.</h1>
          <p className="subhead">
            Execute code via Node + Pyodide with CPU, file, and time limits, then
            read structured JSON output for stdout, stderr, and exit status.
          </p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={handleQuickStart}>
              Start a session
            </button>
            <Link className="button ghost" href="/architecture">
              View architecture
            </Link>
          </div>
          <form className="session-form" onSubmit={handleStart}>
            <input
              type="text"
              placeholder="Ask the agent to run a task"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              aria-label="Agent request"
            />
            <button className="button primary" type="submit">
              Start session
            </button>
          </form>
          <div className="sample-prompts">
            <p className="sample-title">You can ask:</p>
            <ol>
              <li>
                <p className="sample-text">{`Generate all prime numbers below 1000.
Then:
compute how many there are,
calculate the average gap between consecutive primes, and
return the largest gap found.`}</p>
              </li>
              <li>
                <p className="sample-text">{`Using code only:
1. Create a list of 10,000 integers from 0 to 9,999.
2. Shuffle the list with a fixed random seed of 12345.
3. Remove all numbers divisible by 7.
4. Square the remaining numbers.
5. Compute and print:
   - the length of the final list
   - the first 5 elements
   - the last 5 elements.`}</p>
              </li>
            </ol>
          </div>
          <div className="metrics">
            <div className="metric">
              <span className="metric-value">6s</span>
              <span className="metric-label">Default timeout</span>
            </div>
            <div className="metric">
              <span className="metric-value">1MB</span>
              <span className="metric-label">File size cap</span>
            </div>
            <div className="metric">
              <span className="metric-value">32</span>
              <span className="metric-label">Open file limit</span>
            </div>
          </div>
          <div className="trust-row">
            <span>Best-effort resource limits</span>
            <span>Structured JSON output</span>
            <span>Local Pyodide assets</span>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Session preview</p>
              <p className="panel-subtitle">
                Quick checks before you ship
              </p>
            </div>
            <span className="status-pill">Sandbox</span>
          </div>
          <div className="preview-list">
            <div className="preview-item">
              <span className="preview-label">Request</span>
              <span className="preview-text">
                Generate primes below 1000 and summarize the gaps
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Agent</span>
              <span className="preview-text">
                Ran sandboxed Python and returned JSON output
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Audit</span>
              <span className="preview-text">
                Captured stdout, stderr, exit code, and timeout flag
              </span>
            </div>
          </div>
          <Link className="button ghost panel-cta" href="/chat">
            Open live console
          </Link>
        </div>
      </section>

      <section className="info-grid" id="product">
        <div className="info-card">
          <h2>Product</h2>
          <p>
            A lightweight agent that runs short Python snippets in Node + Pyodide
            and returns structured JSON results.
          </p>
        </div>
        <div className="info-card">
          <h2>Architecture</h2>
          <p>
            Two services: a Next.js UI and a FastAPI backend that executes
            sandboxed runs with Node + Pyodide.
          </p>
        </div>
        <div className="info-card">
          <h2>Contact</h2>
          <p>
            Reach out for access, pricing, or deployment guidance.
          </p>
        </div>
      </section>

      <section className="demo" id="demo">
        <div>
          <h2>Try the live console</h2>
          <p>
            Start a session and inspect the JSON output from each run.
          </p>
        </div>
        <Link className="button primary" href="/chat">
          Start a session
        </Link>
      </section>

      <footer className="page-footer">
        <p>Built for local demos and lightweight automation checks.</p>
      </footer>
    </main>
  );
}
