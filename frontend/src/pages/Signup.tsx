import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../contexts/AuthContext";
import { friendlyAuthError, signup } from "../services/authService";

export default function Signup() {
  const nav = useNavigate(); const { setRegistering } = useAuth();
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({}); const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email address.";
    if (pw.length < 8) e.pw = "Use at least 8 characters.";
    if (pw2 !== pw) e.pw2 = "Passwords don't match.";
    setErrs(e); return Object.keys(e).length === 0;
  };
  const submit = async (ev: FormEvent) => {
    ev.preventDefault(); setFormErr("");
    if (!validate()) return;
    setBusy(true); setRegistering(true);
    try { await signup(name.trim(), email.trim(), pw); setRegistering(false); nav("/", { replace: true }); }
    catch (x) { setRegistering(false); setFormErr(friendlyAuthError(x)); setBusy(false); }
  };
  return (
    <AuthShell title="Create your account" sub="Takes under a minute.">
      <form onSubmit={submit} noValidate>
        {formErr && <div className="alert error" role="alert">{formErr}</div>}
        <div className="field"><label htmlFor="name">Full name</label>
          <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errs.name} />
          {errs.name && <p className="field-err">{errs.name}</p>}</div>
        <div className="field"><label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errs.email} />
          {errs.email && <p className="field-err">{errs.email}</p>}</div>
        <PasswordField id="password" label="Password" value={pw} onChange={setPw} autoComplete="new-password" error={errs.pw} />
        <PasswordField id="confirm" label="Confirm password" value={pw2} onChange={setPw2} autoComplete="new-password" error={errs.pw2} />
        <button className="btn primary block" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="muted center">Already registered? <Link to="/login">Log in</Link></p>
    </AuthShell>
  );
}
