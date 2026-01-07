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
            <p className="brand-tagline">Secure execution for modern teams</p>
          </div>
        </div>
        <nav className="nav">
          <Link href="/#product">Product</Link>
          <Link href="/#security">Security</Link>
          <Link href="/#solutions">Solutions</Link>
          <Link href="/#docs">Docs</Link>
        </nav>
        <Link className="button cta" href="/#demo">
          Request demo
        </Link>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Enterprise-ready agent runtime</p>
          <h1>Automate with confidence in a secure, controlled sandbox.</h1>
          <p className="subhead">
            Run tasks on the server, keep credentials locked down, and ship
            reliable automations without compromising your stack.
          </p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={handleQuickStart}>
              Start a session
            </button>
            <Link className="button ghost" href="/#docs">
              View documentation
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
          <div className="metrics">
            <div className="metric">
              <span className="metric-value">99.99%</span>
              <span className="metric-label">Uptime SLA</span>
            </div>
            <div className="metric">
              <span className="metric-value">120ms</span>
              <span className="metric-label">Median response</span>
            </div>
            <div className="metric">
              <span className="metric-value">SOC 2</span>
              <span className="metric-label">Audit ready</span>
            </div>
          </div>
          <div className="trust-row">
            <span>Role-based access</span>
            <span>Audit trails</span>
            <span>Regional isolation</span>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Session preview</p>
              <p className="panel-subtitle">
                What teams run before they go to production
              </p>
            </div>
            <span className="status-pill">Preview</span>
          </div>
          <div className="preview-list">
            <div className="preview-item">
              <span className="preview-label">Request</span>
              <span className="preview-text">
                Summarize last week&apos;s support tickets
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Agent</span>
              <span className="preview-text">
                Classified 128 issues and flagged 12 escalations
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Audit</span>
              <span className="preview-text">
                Logged actions, access checks, and output validation
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
            Coordinate automation, keep secrets server-side, and deliver results
            your operators can trust.
          </p>
        </div>
        <div className="info-card" id="security">
          <h2>Security</h2>
          <p>
            Enforced policies, scoped execution, and step-level telemetry for
            audits and compliance.
          </p>
        </div>
        <div className="info-card" id="solutions">
          <h2>Solutions</h2>
          <p>
            Route agents into support, QA, and ops workflows without exposing
            credentials.
          </p>
        </div>
        <div className="info-card" id="docs">
          <h2>Docs</h2>
          <p>
            Build on a clear API, deploy in minutes, and monitor every run with
            structured logs.
          </p>
        </div>
      </section>

      <section className="demo" id="demo">
        <div>
          <h2>Request a demo</h2>
          <p>
            Tell us about your workflow and we will tailor an agent sandbox for
            your team.
          </p>
        </div>
        <Link className="button primary" href="/chat">
          Start live session
        </Link>
      </section>

      <footer className="page-footer">
        <p>Trusted by security-first teams shipping production agents.</p>
      </footer>
    </main>
  );
}
