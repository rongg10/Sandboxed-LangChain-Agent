"use client";

import Link from "next/link";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../components/LanguageProvider";

export default function ExamplesPage() {
  const { t } = useLanguage();
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
          <Link className="button cta ghost" href="/chat">
            {t("ctaOpenConsole")}
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <section className="chat-shell">
        <div className="panel-header">
          <div>
            <p className="panel-title">{t("exampleSessionTitle")}</p>
            <p className="panel-subtitle">{t("exampleSessionSubtitle")}</p>
          </div>
          <span className="status-pill">{t("exampleStatus")}</span>
        </div>

        <section className="chat-container" aria-live="polite">
          <div className="message-list">
            <div className="message user">
              <span className="message-role">YOU</span>
              <span className="message-content">
                {t("exampleUserPrompt")}
              </span>
            </div>
            <div className="message assistant">
              <span className="message-role">AGENT</span>
              <span className="message-content">
                {t("exampleAgentTranscript")}
              </span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
