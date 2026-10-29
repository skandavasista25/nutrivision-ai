import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import PasswordField from "../components/PasswordField";
import { friendlyAuthError, login } from "../services/authService";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!email.trim() || !pw) return setErr("Enter your email and password.");
    setBusy(true);
    try { await login(email.trim(), pw); nav("/", { replace: true }); }
    catch (x) { setErr(friendlyAuthError(x)); } finally { setBusy(false); }
  };
  return (
    <AuthShell title="Welcome back" sub="Log in to see today's meals.">
      <form onSubmit={submit} noValidate>
        {err && <div className="alert error" role="alert">{err}</div>}
        <div className="field"><label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <PasswordField id="password" label="Password" value={pw} onChange={setPw} autoComplete="current-password" />
        <div className="right"><Link to="/forgot-password">Forgot password?</Link></div>
        <button className="btn primary block" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="muted center">New here? <Link to="/signup">Create an account</Link></p>
    </AuthShell>
  );
}
