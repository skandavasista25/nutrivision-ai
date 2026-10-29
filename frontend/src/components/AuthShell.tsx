import type { ReactNode } from "react";
import { isFirebaseConfigured } from "../lib/firebase";

export default function AuthShell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="auth-wrap">
      <section className="auth-side" aria-hidden>
        <div className="brand light">NutriVision</div>
        <p className="auth-pitch">Know what's on your plate, log it in seconds, and see how the week adds up.</p>
      </section>
      <section className="auth-main">
        <div className="auth-card">
          <h1>{title}</h1><p className="muted">{sub}</p>
          {!isFirebaseConfigured && (
            <div className="alert error" role="alert">Firebase isn't configured. Copy <code>.env.example</code> to <code>.env</code> and fill in your project values.</div>
          )}
          {children}
        </div>
      </section>
    </div>
  );
}
