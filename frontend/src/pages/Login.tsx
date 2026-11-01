import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { browserLocalPersistence, browserSessionPersistence, setPersistence } from "firebase/auth";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { auth } from "../lib/firebase";
import { friendlyAuthError, login } from "../services/authService";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [caps, setCaps] = useState(false);
  const [errs, setErrs] = useState<{ email?: string; pw?: string }>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    const next: { email?: string; pw?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!pw) next.pw = "Enter your password.";
    setErrs(next);
    if (next.email || next.pw) return;

    setBusy(true);
    try {
      // "Remember me" keeps the session after the browser closes. Otherwise it ends with the tab.
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await login(email.trim(), pw);
      nav("/", { replace: true });
    } catch (x) {
      setErr(friendlyAuthError(x));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" sub="Log in to see today's meals.">
      <form onSubmit={submit} noValidate>
        {err && <div className="alert error" role="alert">{err}</div>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <div className={`av-input ${errs.email ? "bad" : ""}`}>
            <Mail size={18} aria-hidden />
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errs.email} aria-describedby={errs.email ? "email-err" : undefined} />
          </div>
          {errs.email && <p className="field-err" id="email-err">{errs.email}</p>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <div className={`av-input ${errs.pw ? "bad" : ""}`}>
            <Lock size={18} aria-hidden />
            <input id="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Your password" value={pw}
              onChange={(e) => setPw(e.target.value)} onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))} onBlur={() => setCaps(false)}
              aria-invalid={!!errs.pw} aria-describedby={errs.pw ? "pw-err" : undefined} />
            <button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errs.pw && <p className="field-err" id="pw-err">{errs.pw}</p>}
          {caps && <p className="av-hint" role="status">Caps Lock is on.</p>}
        </div>

        <div className="av-row">
          <label className="av-check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="btn primary block" disabled={busy}>
          {busy ? <><Loader2 className="av-spin" size={18} aria-hidden /> Logging in…</> : "Log in"}
        </button>
      </form>
      <p className="muted center">New here? <Link to="/signup">Create an account</Link></p>
    </AuthShell>
  );
}