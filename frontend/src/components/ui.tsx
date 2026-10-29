import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function Spinner({ full }: { full?: boolean }) {
  return <div className={full ? "center-screen" : "center-box"} role="status" aria-label="Loading"><Loader2 className="spin" /></div>;
}
export function Skeleton({ h = 90 }: { h?: number }) { return <div className="skeleton" style={{ height: h }} aria-hidden />; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><h3>{title}</h3><p>{children}</p></div>;
}
export function ErrorBox({ children }: { children: ReactNode }) { return <div className="alert error" role="alert">{children}</div>; }
export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return <header className="page-head"><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>{right}</header>;
}
export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
      <div className={over ? "bar over" : "bar"} style={{ width: `${pct}%` }} />
    </div>
  );
}
export function FoodThumb({ name, src }: { name: string; src?: string }) {
  return src ? <img className="thumb" src={src} alt="" /> : <div className="thumb ph" aria-hidden>{name.trim().charAt(0).toUpperCase()}</div>;
}
