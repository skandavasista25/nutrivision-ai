import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useGoals, useMeals } from "../hooks/useData";
import { saveGoals } from "../services/firestoreService";
import { addDays, startOfDay, sumMeals } from "../services/nutrition";
import type { Goals as G } from "../types";
import { PageHeader, ProgressBar } from "../components/ui";

const FIELDS: { k: keyof G; label: string; unit: string; max: number; t: "calories" | "protein" | "carbohydrates" | "fat" }[] = [
  { k: "calorieTarget", label: "Calories", unit: "kcal", max: 10000, t: "calories" },
  { k: "proteinTarget", label: "Protein", unit: "g", max: 600, t: "protein" },
  { k: "carbohydrateTarget", label: "Carbohydrates", unit: "g", max: 1500, t: "carbohydrates" },
  { k: "fatTarget", label: "Fat", unit: "g", max: 500, t: "fat" },
];

export default function Goals() {
  const { user } = useAuth(); const toast = useToast();
  const { goals } = useGoals();
  const today = startOfDay(new Date());
  const { meals } = useMeals(today, addDays(today, 1));
  const t = sumMeals(meals);
  const [form, setForm] = useState<Record<keyof G, string>>({ calorieTarget: "", proteinTarget: "", carbohydrateTarget: "", fatTarget: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => setForm({ calorieTarget: String(goals.calorieTarget), proteinTarget: String(goals.proteinTarget), carbohydrateTarget: String(goals.carbohydrateTarget), fatTarget: String(goals.fatTarget) }), [goals]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    const next = {} as G;
    for (const f of FIELDS) {
      const n = Number(form[f.k]);
      if (!Number.isFinite(n) || n <= 0 || n > f.max) return setErr(`${f.label} must be between 1 and ${f.max} ${f.unit}.`);
      next[f.k] = Math.round(n);
    }
    if (!user) return;
    setBusy(true);
    try { await saveGoals(user.uid, next); toast("Goals saved"); } catch { setErr("Couldn't save your goals. Try again."); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Nutrition goals" sub="Daily targets you can change any time." />
      <div className="grid2">
        <section className="card"><h2>Today</h2>
          {FIELDS.map((f) => { const v = t[f.t]; const g = goals[f.k]; return (
            <div className="goal" key={f.k}><div className="between"><b>{f.label}</b><span className="small muted">{v} / {g} {f.unit}</span></div>
              <ProgressBar value={v} max={g} label={`${f.label} progress`} />
              <span className="small muted">{g >= v ? `${Math.round((g - v) * 10) / 10} ${f.unit} remaining` : `${Math.round((v - g) * 10) / 10} ${f.unit} over target`}</span></div>); })}
        </section>
        <section className="card"><h2>Edit targets</h2>
          <form onSubmit={submit} noValidate>
            {err && <div className="alert error" role="alert">{err}</div>}
            {FIELDS.map((f) => (<div className="field" key={f.k}><label htmlFor={f.k}>{f.label} ({f.unit})</label>
              <input id={f.k} type="number" min="1" value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} /></div>))}
            <p className="small muted">Targets are adjustable estimates, not medical advice. For personal guidance, talk to a doctor or registered dietitian.</p>
            <button className="btn primary" disabled={busy}>{busy ? "Saving…" : "Save goals"}</button>
          </form></section>
      </div>
    </>
  );
}
