"use client";

import Link from "next/link";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../components/LanguageProvider";

export default function ArchitecturePage() {
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

      <section className="examples-hero">
        <div>
          <p className="eyebrow">{t("architectureEyebrow")}</p>
          <h1>{t("architectureTitle")}</h1>
          <p className="subhead">{t("architectureSubtitle")}</p>
        </div>
      </section>

      <section className="info-grid">
        <div className="info-card">
          <h2>{t("frontendTitle")}</h2>
          <p>{t("frontendText")}</p>
        </div>
        <div className="info-card">
          <h2>{t("backendRouterTitle")}</h2>
          <p>{t("backendRouterText")}</p>
        </div>
        <div className="info-card">
          <h2>{t("sandboxATitle")}</h2>
          <p>{t("sandboxAText")}</p>
        </div>
        <div className="info-card">
          <h2>{t("sandboxBTitle")}</h2>
          <p>{t("sandboxBText")}</p>
        </div>
      </section>

      <section className="info-card">
        <h2>{t("developedTitle")}</h2>
        <p>{t("developedText")}</p>
      </section>
    </main>
  );
}
