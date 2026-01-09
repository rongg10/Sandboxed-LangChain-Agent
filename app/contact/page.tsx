import Link from "next/link";

export default function ContactPage() {
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
          <p className="eyebrow">Contact</p>
          <h1>Let&apos;s talk about your deployment.</h1>
          <p className="subhead">
            For access, partnerships, or support, reach out directly and we will
            respond quickly.
          </p>
        </div>
      </section>

      <section className="demo">
        <div>
          <h2>Email</h2>
          <p>
            <a href="mailto:rongshi206@gmail.com">rongshi206@gmail.com</a>
          </p>
        </div>
        <Link className="button primary" href="/chat">
          Start a session
        </Link>
      </section>
    </main>
  );
}
