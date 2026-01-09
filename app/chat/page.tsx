"use client";

import { Suspense } from "react";
import ChatClient from "./ChatClient";
import { useLanguage } from "../components/LanguageProvider";

export default function ChatPage() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <main className="chat-page">
          <section className="chat-shell">
            <div className="panel-header">
              <p className="panel-title">{t("loadingConsole")}</p>
              <span className="status-pill">{t("loadingStatus")}</span>
            </div>
          </section>
        </main>
      }
    >
      <ChatClient />
    </Suspense>
  );
}
