import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { friendlyAuthError, resetPassword } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState(""); const [err, setErr] = useState("");
  const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr("Enter a valid email address.");
    setBusy(true);
    try { await resetPassword(email.trim()); setSent(true); }
    catch (x) { const c = (x as { code?: string }).code; if (c === "auth/user-not-found") setSent(true); else setErr(friendlyAuthError(x)); }
    finally { setBusy(false); }
  };
  return (
    <AuthShell title="Reset your password" sub="We'll email you a reset link.">
      {sent ? <div className="alert ok" role="status">If an account exists for {email}, a reset link is on its way.</div> : (
        <form onSubmit={submit} noValidate>
          {err && <div className="alert error" role="alert">{err}</div>}
          <div className="field"><label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <button className="btn primary block" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
      <p className="muted center"><Link to="/login">Back to log in</Link></p>
    </AuthShell>
  );
}
