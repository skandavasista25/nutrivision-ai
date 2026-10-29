import { useEffect, useState, type FormEvent } from "react";
import { updateProfile } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getUserProfile, updateProfileSettings } from "../services/firestoreService";
import { DEFAULT_PREFS, type Budget, type Diet } from "../types";
import { PageHeader } from "../components/ui";

export default function Profile() {
  const { user } = useAuth(); const toast = useToast();
  const [name, setName] = useState(user?.displayName ?? ""); const [diet, setDiet] = useState<Diet>(DEFAULT_PREFS.diet);
  const [budget, setBudget] = useState<Budget>(DEFAULT_PREFS.budget); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  useEffect(() => { if (user) getUserProfile(user.uid).then((p) => { if (p) { setName(p.displayName); setDiet(p.preferences.diet); setBudget(p.preferences.budget); } }).catch(() => setErr("Couldn't load your profile.")); }, [user]);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (name.trim().length < 2) return setErr("Enter your full name.");
    if (!user) return; setBusy(true);
    try { await updateProfile(user, { displayName: name.trim() }); await updateProfileSettings(user.uid, name.trim(), { diet, budget }); toast("Profile saved"); }
    catch { setErr("Couldn't save your profile. Try again."); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Profile and settings" />
      <section className="card narrow"><form onSubmit={submit} noValidate>
        {err && <div className="alert error" role="alert">{err}</div>}
        <div className="field"><label htmlFor="n">Full name</label><input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label htmlFor="e">Email</label><input id="e" value={user?.email ?? ""} disabled /></div>
        <div className="field"><label htmlFor="d">Diet for suggestions</label><select id="d" value={diet} onChange={(e) => setDiet(e.target.value as Diet)}><option value="any">Vegetarian and non-vegetarian</option><option value="vegetarian">Vegetarian only</option></select></div>
        <div className="field"><label htmlFor="b">Budget for suggestions</label><select id="b" value={budget} onChange={(e) => setBudget(e.target.value as Budget)}><option value="any">Any</option><option value="medium">Low to medium</option><option value="low">Low only</option></select></div>
        <button className="btn primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </form></section>
    </>
  );
}
