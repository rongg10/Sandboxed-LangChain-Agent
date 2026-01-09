"use client";

import Link from "next/link";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../components/LanguageProvider";

export default function ContactPage() {
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
          <p className="eyebrow">{t("contactEyebrow")}</p>
          <h1>{t("contactTitle")}</h1>
          <p className="subhead">{t("contactSubtitle")}</p>
        </div>
      </section>

      <section className="demo">
        <div>
          <h2>{t("contactEmailTitle")}</h2>
          <p>
            <a href="mailto:rongshi206@gmail.com">rongshi206@gmail.com</a>
          </p>
        </div>
        <Link className="button primary" href="/chat">
          {t("ctaStartSession")}
        </Link>
      </section>
    </main>
  );
}
