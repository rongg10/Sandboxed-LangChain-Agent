import { Suspense } from "react";
import ChatClient from "./ChatClient";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="chat-page">
          <section className="chat-shell">
            <div className="panel-header">
              <p className="panel-title">Loading console</p>
              <span className="status-pill">Loading</span>
            </div>
          </section>
        </main>
      }
    >
      <ChatClient />
    </Suspense>
  );
}
