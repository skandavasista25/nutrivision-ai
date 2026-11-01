import type { ReactNode } from "react";
import { BookOpen, CalendarDays, Leaf, ScanLine } from "lucide-react";
import { isFirebaseConfigured } from "../lib/firebase";
import "./AuthShell.css";

const FEATURES = [
  { icon: ScanLine, title: "Log meals fast", text: "Scan a photo or search, then confirm the portion." },
  { icon: BookOpen, title: "See the full picture", text: "Calories and macros against your own daily goals." },
  { icon: CalendarDays, title: "Plan your week", text: "Meal plans and a shopping list built around your targets." },
];

export default function AuthShell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="av-wrap">
      <aside className="av-hero">
        <span className="av-ring a" aria-hidden /><span className="av-ring b" aria-hidden /><span className="av-ring c" aria-hidden />
        <div className="av-brand"><span className="av-logo" aria-hidden><Leaf size={22} /></span> NutriVision</div>

        <div className="av-hero-main">
          <div>
            <h2 className="av-headline">Eat smarter. Know <span>every plate.</span></h2>
            <p className="av-lead">Track what you eat, hit your goals, and plan the week ahead, all in one place.</p>
          </div>
          <ul className="av-features">
            {FEATURES.map(({ icon: Icon, title: t, text }) => (
              <li key={t}><span className="av-feat-icon" aria-hidden><Icon size={18} /></span><div><b>{t}</b><span>{text}</span></div></li>
            ))}
          </ul>
        </div>

        {/* Decorative preview with made-up numbers, labelled as a sample. */}
        <div className="av-sample" aria-hidden>
          <svg width="76" height="76" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="8" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="#9be2b0" strokeWidth="8" strokeLinecap="round" strokeDasharray="213.6" strokeDashoffset="61.9" transform="rotate(-90 40 40)" />
          </svg>
          <div style={{ flex: 1 }}>
            <span className="av-tag">Sample day</span>
            <div className="num">1,420 <small style={{ display: "inline" }}>of 2,000 kcal</small></div>
            <div className="av-bars"><i style={{ "--w": "78%" } as React.CSSProperties} /><i style={{ "--w": "64%" } as React.CSSProperties} /><i style={{ "--w": "52%" } as React.CSSProperties} /></div>
          </div>
        </div>
      </aside>

      <main className="av-main">
        <div className="av-card">
          <h1>{title}</h1>
          <p className="muted">{sub}</p>
          {!isFirebaseConfigured && (
            <div className="alert error" role="alert">Firebase isn't configured. Copy <code>.env.example</code> to <code>.env</code> and fill in your project values.</div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}