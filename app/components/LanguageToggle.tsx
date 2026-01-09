"use client";

import { useLanguage } from "./LanguageProvider";

export default function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();
  return (
    <button
      type="button"
      className="button ghost lang-toggle"
      onClick={toggleLang}
      aria-label={lang === "en" ? "Switch to Chinese" : "切换为英文"}
    >
      {lang === "en" ? "中文" : "EN"}
    </button>
  );
}
