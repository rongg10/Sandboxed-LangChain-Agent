"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LanguageToggle from "./components/LanguageToggle";
import { useLanguage } from "./components/LanguageProvider";

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
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
            <p className="brand-name">{t("brandName")}</p>
            <p className="brand-tagline">{t("brandTagline")}</p>
          </div>
        </div>
        <nav className="nav">
          <Link href="/#product">{t("navProduct")}</Link>
          <Link href="/architecture">{t("navArchitecture")}</Link>
          <Link href="/examples">{t("navExamples")}</Link>
          <Link href="/contact">{t("navContact")}</Link>
        </nav>
        <div className="top-bar-actions">
          <Link className="button cta" href="/#demo">
            {t("ctaRequestDemo")}
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t("heroEyebrow")}</p>
          <h1>{t("heroTitle")}</h1>
          <p className="subhead">{t("heroSubhead")}</p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={handleQuickStart}>
              {t("ctaStartSession")}
            </button>
            <Link className="button ghost" href="/architecture">
              {t("ctaExploreArchitecture")}
            </Link>
          </div>
          <form className="session-form" onSubmit={handleStart}>
            <input
              type="text"
              placeholder={t("inputPlaceholder")}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              aria-label={t("inputAria")}
            />
            <button className="button primary" type="submit">
              {t("sessionFormButton")}
            </button>
          </form>
          <div className="sample-prompts">
            <p className="sample-title">{t("sampleTitle")}</p>
            <ol>
              <li>
                <p className="sample-text">{t("samplePrompt1")}</p>
              </li>
              <li>
                <p className="sample-text">{t("samplePrompt2")}</p>
              </li>
            </ol>
          </div>
          <div className="metrics">
            <div className="metric">
              <span className="metric-value">6s</span>
              <span className="metric-label">{t("metricTimeout")}</span>
            </div>
            <div className="metric">
              <span className="metric-value">10MB</span>
              <span className="metric-label">{t("metricFileSize")}</span>
            </div>
            <div className="metric">
              <span className="metric-value">32</span>
              <span className="metric-label">{t("metricOpenFiles")}</span>
            </div>
          </div>
          <div className="trust-row">
            <span>{t("trustRowOne")}</span>
            <span>{t("trustRowTwo")}</span>
            <span>{t("trustRowThree")}</span>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">{t("panelTitle")}</p>
              <p className="panel-subtitle">{t("panelSubtitle")}</p>
            </div>
            <span className="status-pill">{t("panelStatus")}</span>
          </div>
          <div className="preview-list">
            <div className="preview-item">
              <span className="preview-label">{t("previewRequestLabel")}</span>
              <span className="preview-text">{t("previewRequestText")}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">{t("previewAgentLabel")}</span>
              <span className="preview-text">{t("previewAgentText")}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">{t("previewAuditLabel")}</span>
              <span className="preview-text">{t("previewAuditText")}</span>
            </div>
          </div>
          <Link className="button ghost panel-cta" href="/chat">
            {t("ctaOpenLiveConsole")}
          </Link>
        </div>
      </section>

      <section className="info-grid" id="product">
        <div className="info-card">
          <h2>{t("infoProductTitle")}</h2>
          <p>{t("infoProductText")}</p>
        </div>
        <div className="info-card">
          <h2>{t("infoArchitectureTitle")}</h2>
          <p>{t("infoArchitectureText")}</p>
        </div>
        <div className="info-card">
          <h2>{t("infoContactTitle")}</h2>
          <p>{t("infoContactText")}</p>
        </div>
      </section>

      <section className="demo" id="demo">
        <div>
          <h2>{t("demoTitle")}</h2>
          <p>{t("demoSubtitle")}</p>
        </div>
        <Link className="button primary" href="/chat">
          {t("ctaStartSession")}
        </Link>
      </section>

      <footer className="page-footer">
        <p>{t("footerText")}</p>
      </footer>
    </main>
  );
}
