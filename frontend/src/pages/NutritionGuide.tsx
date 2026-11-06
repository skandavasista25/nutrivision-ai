import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, Search, ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { saveGoals } from "../services/firestoreService";
import {
  ACTIVITY, LAST_REVIEWED, SECTIONS, SOURCES, estimateNeeds, searchCards,
  type Activity, type Card, type FlatCard,
} from "../services/nutritionGuide";
import { PageHeader } from "../components/ui";
import "./NutritionGuide.css";

function CardView({ c, section }: { c: Card; section?: string }) {
  return (
    <article className="card ng-card">
      <div className="ng-badges">
        {section && <span className="ng-badge sec">{section}</span>}
        {c.source.map((s) => <span key={s} className={`ng-badge ${s === "General guidance" ? "gen" : ""}`}>{s}</span>)}
      </div>
      <h3>{c.title}</h3>
      <p className="summary">{c.summary}</p>
      {c.points.length > 0 && <ul>{c.points.map((p, i) => <li key={i}>{p}</li>)}</ul>}
      {c.limit && <div className="ng-box limit"><b>Limit or avoid</b><ul>{c.limit.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
      {c.ask && <div className="ng-box ask"><b>Talk to a doctor or dietitian</b>{c.ask}</div>}
    </article>
  );
}

function Calculator_() {
  const { user } = useAuth();
  const toast = useToast();
  const [age, setAge] = useState("30"); const [sex, setSex] = useState<"male" | "female">("male");
  const [weight, setWeight] = useState("65"); const [height, setHeight] = useState("168");
  const [activity, setActivity] = useState<Activity>("light");
  const [cereal, setCereal] = useState(false); const [special, setSpecial] = useState(false);
  const [busy, setBusy] = useState(false);

  const needs = useMemo(() => estimateNeeds({ age: Number(age), sex, weightKg: Number(weight), heightCm: Number(height), activity, cerealHeavy: cereal }),
    [age, sex, weight, height, activity, cereal]);
  const minor = Number(age) > 0 && Number(age) < 18;

  const apply = async () => {
    if (!user || !needs) return;
    if (!confirm("Replace your current daily targets on the Goals page with these estimates?")) return;
    setBusy(true);
    try {
      await saveGoals(user.uid, { calorieTarget: needs.calories, proteinTarget: needs.protein, carbohydrateTarget: needs.carbGoal, fatTarget: needs.fatGoal });
      toast("Daily targets updated");
    } catch { toast("Couldn't save your targets. Try again.", "error"); } finally { setBusy(false); }
  };

  return (
    <div className="ng-calc">
      <section className="card">
        <h2>About you</h2>
        <div className="row2">
          <div className="field"><label htmlFor="age">Age (years)</label><input id="age" type="number" min="18" max="100" value={age} onChange={(e) => setAge(e.target.value)} /></div>
          <div className="field"><label htmlFor="sex">Sex</label><select id="sex" value={sex} onChange={(e) => setSex(e.target.value as "male" | "female")}><option value="male">Male</option><option value="female">Female</option></select></div>
        </div>
        <div className="row2">
          <div className="field"><label htmlFor="wt">Weight (kg)</label><input id="wt" type="number" min="30" max="250" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
          <div className="field"><label htmlFor="ht">Height (cm)</label><input id="ht" type="number" min="120" max="230" value={height} onChange={(e) => setHeight(e.target.value)} /></div>
        </div>
        <div className="field"><label htmlFor="act">Activity level</label>
          <select id="act" value={activity} onChange={(e) => setActivity(e.target.value as Activity)}>
            {(Object.keys(ACTIVITY) as Activity[]).map((a) => <option key={a} value={a}>{ACTIVITY[a].label}</option>)}</select></div>
        <label className="check"><input type="checkbox" checked={cereal} onChange={(e) => setCereal(e.target.checked)} /> My meals are mostly rice or roti with little dal, milk, egg or meat</label>
        <label className="check"><input type="checkbox" checked={special} onChange={(e) => setSpecial(e.target.checked)} /> I'm pregnant, breastfeeding, or follow a doctor-prescribed diet</label>
      </section>

      <section className="card">
        <h2>Your estimated daily needs</h2>
        {special ? <div className="alert info">Your needs are different, and a general estimate could mislead you. Please follow your doctor's or dietitian's plan. The "By age and life stage" tab has general information.</div>
          : minor ? <div className="alert info">This estimate is for adults 18 and over. Children and teens have different needs. See the "By age and life stage" tab, and ask a paediatrician or dietitian.</div>
          : !needs ? <p className="muted">Enter valid values (age 18 to 100, weight 30 to 250 kg, height 120 to 230 cm).</p> : (
            <>
              <div className="ng-result" aria-live="polite">
                <div><b>{needs.calories}</b><span>kcal a day to maintain weight (rough estimate)</span></div>
                <div><b>{needs.protein} g</b><span>protein a day{cereal ? " (1 g per kg)" : " (0.83 g per kg)"}</span></div>
                <div><b>under {needs.sugarMax} g</b><span>added sugar (under 5% of energy)</span></div>
                <div><b>under {needs.fatMax} g</b><span>total fat (under 30% of energy)</span></div>
                <div><b>under {needs.satFatMax} g</b><span>saturated fat (under 10% of energy)</span></div>
                <div><b>5 g</b><span>salt at most, and 400 g or more of vegetables and fruit</span></div>
              </div>
              <p className="small muted">Energy uses the Mifflin-St Jeor equation, a common estimate that can be off by a few hundred calories for any one person. Protein follows ICMR-NIN 2020. Limits follow ICMR-NIN 2024 and WHO. To lose or gain weight, or if you have a health condition, get personal advice first.</p>
              <button type="button" className="btn primary" onClick={apply} disabled={busy}>{busy ? "Saving…" : "Use as my daily targets"}</button>
              <p className="small muted" style={{ marginTop: ".5rem" }}>This sets calories {needs.calories}, protein {needs.protein} g, carbs {needs.carbGoal} g and fat {needs.fatGoal} g on your <Link to="/goals">Goals</Link> page. You can edit them there.</p>
            </>
          )}
      </section>
    </div>
  );
}

export default function NutritionGuide() {
  const [tab, setTab] = useState<string>(SECTIONS[0].id);
  const [query, setQuery] = useState("");
  const results: FlatCard[] = useMemo(() => searchCards(query), [query]);
  const searching = query.trim().length >= 2;
  const section = SECTIONS.find((s) => s.id === tab);

  return (
    <>
      <PageHeader title="Nutrition guide" sub="What nutrients do, how much people need at different ages, and which foods to eat or limit." />
      <div className="ng-note" role="note">
        <ShieldAlert size={18} aria-hidden />
        <span>General education based on ICMR-NIN and WHO guidance. It is not medical advice. If you are pregnant, have a health condition, or are feeding a child with health problems, follow your doctor's or dietitian's plan.</span>
      </div>

      <div className="ng-search">
        <Search size={18} aria-hidden />
        <input aria-label="Search the guide" placeholder="Search: protein, salt, diabetes, pregnancy, ragi…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {searching ? (
        <>
          <p className="small muted">{results.length} result{results.length === 1 ? "" : "s"} for "{query.trim()}"</p>
          {results.length === 0 ? <div className="empty"><h3>Nothing found</h3><p>Try a simpler word, such as "salt", "protein" or "iron".</p></div>
            : <div className="ng-grid">{results.map((c) => <CardView key={c.id} c={c} section={c.sectionLabel} />)}</div>}
        </>
      ) : (
        <>
          <div className="ng-tabs" role="tablist" aria-label="Guide sections">
            {SECTIONS.map((s) => <button type="button" role="tab" aria-selected={tab === s.id} key={s.id} className={`ng-tab ${tab === s.id ? "on" : ""}`} onClick={() => setTab(s.id)}>{s.label}</button>)}
            <button type="button" role="tab" aria-selected={tab === "calc"} className={`ng-tab ${tab === "calc" ? "on" : ""}`} onClick={() => setTab("calc")}><Calculator size={14} aria-hidden style={{ verticalAlign: "-2px" }} /> Your daily needs</button>
          </div>
          {tab === "calc" ? <Calculator_ /> : section && (
            <>
              <p className="ng-intro">{section.intro}</p>
              <div className="ng-grid">{section.cards.map((c) => <CardView key={c.id} c={c} />)}</div>
              {section.id === "limit" && <p style={{ marginTop: "1rem" }}>Looking for lighter options? Try the <Link to="/alternatives">Healthier alternatives</Link> page.</p>}
            </>
          )}
        </>
      )}

      <section className="ng-sources">
        <h3>Sources (reviewed {LAST_REVIEWED})</h3>
        <ul>{SOURCES.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></li>)}</ul>
        <p>Guidelines are updated from time to time. Check the sources for the latest version.</p>
      </section>
    </>
  );
}