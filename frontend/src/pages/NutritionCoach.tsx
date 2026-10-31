import { useEffect, useMemo, useState } from "react";
import {
  Beef, Brain, Clock, Copy, Droplets, Flame, Lightbulb, Minus, Plus, Search, Sparkles, UtensilsCrossed, Wheat,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useGoals, useMeals } from "../hooks/useData";
import { addMeal, getUserProfile } from "../services/firestoreService";
import { addDays, round1, startOfDay, sumMeals } from "../services/nutrition";
import {
  ALLERGENS, RECIPES, dietLabel, formatIngredient, isAllowed, searchRecipes,
  type Allergen, type DietFilter, type Recipe,
} from "../services/recipes";
import { MEAL_TYPES, type MealType } from "../types";
import { ErrorBox, PageHeader, ProgressBar, Skeleton } from "../components/ui";
import "./NutritionCoach.css";

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const defaultMealType = (): MealType => { const h = new Date().getHours(); return h < 11 ? "breakfast" : h < 16 ? "lunch" : h < 21 ? "dinner" : "snack"; };

/** State saved in this browser, per user. Used for diet and allergy choices. */
function usePersisted<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } }, [key, v]);
  return [v, setV] as const;
}

export default function NutritionCoach() {
  const { user } = useAuth();
  const toast = useToast();
  const { goals, loading: goalsLoading } = useGoals();
  const today = startOfDay(new Date());
  const { meals, loading: mealsLoading, error } = useMeals(today, addDays(today, 1));
  const uid = user?.uid ?? "anon";

  const [diet, setDiet] = usePersisted<DietFilter | null>(`nv-coach-${uid}-diet`, null);
  const [avoid, setAvoid] = usePersisted<Allergen[]>(`nv-coach-${uid}-avoid`, []);
  const [query, setQuery] = useState("");
  const [mealFilter, setMealFilter] = useState<MealType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [servings, setServings] = useState(1);
  const [eat, setEat] = useState(1);
  const [logType, setLogType] = useState<MealType>(defaultMealType());
  const [logging, setLogging] = useState(false);

  // First visit: start from the diet saved in the profile.
  useEffect(() => {
    if (!user || diet !== null) return;
    getUserProfile(user.uid).then((p) => { if (p?.preferences.diet === "vegetarian") setDiet("veg"); }).catch(() => undefined);
  }, [user, diet, setDiet]);
  const dietFilter: DietFilter = diet ?? "any";

  const totals = useMemo(() => sumMeals(meals), [meals]);
  const remaining = {
    calories: goals.calorieTarget - totals.calories, protein: goals.proteinTarget - totals.protein,
    carbohydrates: goals.carbohydrateTarget - totals.carbohydrates, fat: goals.fatTarget - totals.fat,
  };

  const pool = useMemo(() => RECIPES.filter((r) => isAllowed(r, dietFilter, avoid)), [dietFilter, avoid]);
  const results = useMemo(() => searchRecipes(query, pool, mealFilter), [query, pool, mealFilter]);
  const selected = pool.find((r) => r.id === selectedId) ?? null;

  const tips = useMemo(() => {
    const out: { text: string; kind: "info" | "ok" }[] = [];
    const hour = new Date().getHours();
    const sources = dietFilter === "veg" ? "dal, paneer, tofu, curd or sprouts"
      : dietFilter === "egg" ? "dal, paneer, eggs, curd or sprouts" : "dal, paneer, eggs, curd, chicken or fish";
    if (meals.length === 0) {
      out.push({ kind: "info", text: "Nothing is logged yet today. Add what you've eaten so the tips match your day." });
    } else {
      if (remaining.protein > goals.proteinTarget * 0.5 && hour >= 15)
        out.push({ kind: "info", text: `You still have about ${Math.round(remaining.protein)} g of protein to go. Good options: ${sources}.` });
      if (hour >= 16 && totals.calories < goals.calorieTarget * 0.4)
        out.push({ kind: "info", text: `You've logged ${totals.calories} of ${goals.calorieTarget} kcal. If you ate more, log it so the advice stays accurate.` });
      if (remaining.calories < 0)
        out.push({ kind: "info", text: `You're ${Math.round(-remaining.calories)} kcal over today's target. One day over isn't a problem, so keep the next meal light and don't skip meals to make up for it.` });
      if (remaining.fat < 0)
        out.push({ kind: "info", text: `Fat is ${Math.round(-remaining.fat)} g over target. Grilled, steamed or boiled dishes are lighter choices next.` });
      if (remaining.carbohydrates < 0)
        out.push({ kind: "info", text: `Carbs are ${Math.round(-remaining.carbohydrates)} g over target. Pair your next meal with protein and vegetables rather than extra rice or bread.` });
    }
    if (out.length === 0) out.push({ kind: "ok", text: "You're on track against your targets so far. Keep logging for better suggestions." });
    return out;
  }, [meals.length, totals, remaining.protein, remaining.calories, remaining.fat, remaining.carbohydrates, goals, dietFilter]);

  // Recipes that fit what is left today: they must fit the calories, then prefer filling the protein gap.
  const fits = useMemo(() => {
    if (remaining.calories < 120) return [];
    const mt = defaultMealType();
    return pool.filter((r) => r.perServing.calories <= remaining.calories * 1.05)
      .map((r) => {
        const p = r.perServing, gap = Math.max(remaining.protein, 0);
        const score = Math.min(p.protein, gap) * 3 - Math.max(0, p.fat - Math.max(remaining.fat, 0)) * 2
          - Math.max(0, p.carbohydrates - Math.max(remaining.carbohydrates, 0)) * 0.5 + (r.meals.includes(mt) ? 8 : 0);
        return { r, score, why: `${p.protein} g protein for ${p.calories} kcal${gap > 0 ? `, toward your ${Math.round(gap)} g protein gap` : ""}` };
      }).sort((a, b) => b.score - a.score).slice(0, 3);
  }, [pool, remaining.calories, remaining.protein, remaining.fat, remaining.carbohydrates]);

  const open = (r: Recipe) => {
    setSelectedId(r.id); setServings(r.baseServings); setEat(1); setLogType(r.meals.includes(defaultMealType()) ? defaultMealType() : r.meals[0]);
    setTimeout(() => document.getElementById("recipe-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const logRecipe = async () => {
    if (!user || !selected) return;
    const p = selected.perServing;
    setLogging(true);
    try {
      await addMeal(user.uid, {
        foodName: `${selected.title} (${eat} serving${eat === 1 ? "" : "s"})`.slice(0, 120), mealType: logType,
        portionGrams: Math.round(selected.servingGrams * eat), eatenAt: new Date(),
        calories: Math.round(p.calories * eat), protein: round1(p.protein * eat), carbohydrates: round1(p.carbohydrates * eat), fat: round1(p.fat * eat),
      });
      toast("Added to your diary");
    } catch { toast("Couldn't add this to your diary. Try again.", "error"); } finally { setLogging(false); }
  };

  const copyList = async () => {
    if (!selected) return;
    const f = servings / selected.baseServings;
    const text = `${selected.title} (${servings} serving${servings === 1 ? "" : "s"})\n` + selected.ingredients.map((i) => `- ${formatIngredient(i, f)}`).join("\n");
    try { await navigator.clipboard.writeText(text); toast("Ingredient list copied"); } catch { toast("Couldn't copy. Select the text instead.", "error"); }
  };

  if (!user) return <p>Please sign in to use your Nutrition Coach.</p>;

  const stats = [
    { label: "Calories", value: totals.calories, target: goals.calorieTarget, icon: Flame, unit: "kcal" },
    { label: "Protein", value: totals.protein, target: goals.proteinTarget, icon: Beef, unit: "g" },
    { label: "Carbs", value: totals.carbohydrates, target: goals.carbohydrateTarget, icon: Wheat, unit: "g" },
    { label: "Fat", value: totals.fat, target: goals.fatTarget, icon: Droplets, unit: "g" },
  ];
  const loading = mealsLoading || goalsLoading;

  return (
    <>
      <PageHeader title="AI Nutrition Coach" sub="Insights from today's diary, plus recipes that fit what's left of your day." />
      {error && <ErrorBox>{error}</ErrorBox>}

      {loading ? <Skeleton h={140} /> : (
        <>
          <div className="grid4">
            {stats.map(({ label, value, target, icon: Icon, unit }) => (
              <section className="card stat" key={label}>
                <h2 className="small muted tight-h"><Icon size={16} aria-hidden /> {label}</h2>
                <p className="big">{value}<span className="unit"> {unit}</span></p>
                <ProgressBar value={value} max={target} label={`${label} progress`} />
                <p className="small muted">
                  {target - value >= 0 ? `${Math.round((target - value) * 10) / 10} ${unit} left of ${target}` : `${Math.round((value - target) * 10) / 10} ${unit} over ${target}`}
                </p>
              </section>
            ))}
          </div>

          <section className="card coach-section">
            <h2 className="tight-h"><Lightbulb size={20} aria-hidden /> Coach tips</h2>
            {tips.map((t, i) => <div className={`alert ${t.kind}`} key={i}>{t.text}</div>)}
          </section>

          <section className="card coach-section">
            <h2 className="tight-h"><Sparkles size={20} aria-hidden /> Fits what's left today</h2>
            {fits.length === 0 ? (
              <p className="muted small">
                {remaining.calories < 120 ? "You're at or near your calorie target, so no more meals are suggested." : "No recipe matches your current diet and allergy filters."}
              </p>
            ) : fits.map(({ r, why }) => (
              <button type="button" className="recipe-item" key={r.id} onClick={() => open(r)}>
                <b>{r.title}</b>
                <div className="fit-why">{why}</div>
                <div className="recipe-meta"><span><Clock size={14} aria-hidden /> {r.minutes} min</span><span>{dietLabel(r.diet)}</span></div>
              </button>
            ))}
          </section>
        </>
      )}

      <section className="card coach-section">
        <h2 className="tight-h"><UtensilsCrossed size={20} aria-hidden /> Find a recipe</h2>
        <div className="coach-controls">
          <div className="coach-search">
            <Search size={18} aria-hidden />
            <input aria-label="Search recipes" placeholder="Try: paneer, high protein, eggs spinach, dal…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select aria-label="Diet" value={dietFilter} onChange={(e) => setDiet(e.target.value as DietFilter)} style={{ width: "auto" }}>
            <option value="any">Any diet</option><option value="egg">Vegetarian (eggs OK)</option><option value="veg">Vegetarian (no eggs)</option>
          </select>
        </div>
        <div className="chip-row" role="group" aria-label="Meal type">
          {(["all", ...MEAL_TYPES] as const).map((m) => (
            <button type="button" key={m} className={`coach-chip ${mealFilter === m ? "on" : ""}`} aria-pressed={mealFilter === m} onClick={() => setMealFilter(m)}>{m === "all" ? "All meals" : cap(m)}</button>
          ))}
        </div>
        <p className="coach-label">Avoid (hides recipes that contain these)</p>
        <div className="chip-row" role="group" aria-label="Allergies and foods to avoid">
          {ALLERGENS.map((a) => {
            const on = avoid.includes(a.id);
            return <button type="button" key={a.id} className={`coach-chip avoid ${on ? "on" : ""}`} aria-pressed={on}
              onClick={() => setAvoid(on ? avoid.filter((x) => x !== a.id) : [...avoid, a.id])}>{a.label}</button>;
          })}
        </div>
        <p className="small muted" style={{ marginTop: ".5rem" }}>Filters are a convenience, not a guarantee. Always check labels and ingredients if you have an allergy.</p>

        <div className="coach-grid">
          <div>
            <p className="small muted">{results.length} of {RECIPES.length} recipes{query ? ` match "${query}"` : ""}</p>
            {results.length === 0 ? (
              <div className="empty"><h3>No recipe found</h3>
                <p>Try a single ingredient (paneer, chickpeas) or a goal word (quick, high protein). The library is small and curated, so some dishes aren't in it yet.</p></div>
            ) : results.map((r) => (
              <button type="button" key={r.id} className={`recipe-item ${selectedId === r.id ? "sel" : ""}`} onClick={() => open(r)}>
                <b>{r.title}</b>
                <div className="recipe-meta">
                  <span><Clock size={14} aria-hidden /> {r.minutes} min</span><span>{r.perServing.calories} kcal</span><span>{r.perServing.protein} g protein</span><span>{dietLabel(r.diet)}</span>
                </div>
              </button>
            ))}
          </div>

          <div id="recipe-detail" className="card" style={{ scrollMarginTop: "1rem" }}>
            {!selected ? (
              <div className="empty" style={{ border: 0 }}><h3>Pick a recipe</h3><p>You'll see ingredients, steps and nutrition here, and can add it to your diary.</p></div>
            ) : (
              <>
                <h2>{selected.title}</h2>
                <div className="recipe-meta" style={{ marginBottom: ".5rem" }}>
                  <span><Clock size={14} aria-hidden /> {selected.minutes} min</span>
                  <span className="badge">{dietLabel(selected.diet)}</span>
                  {selected.allergens.length > 0 && <span className="badge warn">Contains: {selected.allergens.join(", ")}</span>}
                </div>
                <div className="macro-row" aria-label="Estimated nutrition per serving">
                  <div><b>{selected.perServing.calories}</b><span>kcal</span></div><div><b>{selected.perServing.protein}</b><span>protein g</span></div>
                  <div><b>{selected.perServing.carbohydrates}</b><span>carbs g</span></div><div><b>{selected.perServing.fat}</b><span>fat g</span></div>
                </div>
                <p className="small muted">Per serving, approximate. Real values depend on the exact ingredients and amounts you use.</p>

                <div className="between" style={{ margin: "1rem 0 .25rem" }}>
                  <h3>Ingredients</h3>
                  <div className="scaler" role="group" aria-label="Servings to cook">
                    <button type="button" onClick={() => setServings(Math.max(1, servings - 1))} disabled={servings <= 1} aria-label="Fewer servings"><Minus size={16} /></button>
                    <span aria-live="polite">{servings} serving{servings === 1 ? "" : "s"}</span>
                    <button type="button" onClick={() => setServings(Math.min(12, servings + 1))} disabled={servings >= 12} aria-label="More servings"><Plus size={16} /></button>
                  </div>
                </div>
                <ul className="ing-list">{selected.ingredients.map((i, k) => <li key={k}>{formatIngredient(i, servings / selected.baseServings)}</li>)}</ul>
                <button type="button" className="btn ghost sm" onClick={copyList}><Copy size={14} aria-hidden /> Copy ingredient list</button>

                <h3 style={{ marginTop: "1rem" }}>How to make it</h3>
                <ol className="step-list">{selected.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
                <div className="note-box"><b>Tip:</b> {selected.tip}</div>
                {selected.note && <div className="note-box"><b>Safety:</b> {selected.note}</div>}

                <div className="log-row">
                  <div className="field"><label htmlFor="eat">I'll eat</label>
                    <select id="eat" value={eat} onChange={(e) => setEat(Number(e.target.value))}>{[0.5, 1, 1.5, 2].map((n) => <option key={n} value={n}>{n} serving{n === 1 ? "" : "s"}</option>)}</select></div>
                  <div className="field"><label htmlFor="lt">Meal</label>
                    <select id="lt" value={logType} onChange={(e) => setLogType(e.target.value as MealType)}>{MEAL_TYPES.map((m) => <option key={m} value={m}>{cap(m)}</option>)}</select></div>
                  <button type="button" className="btn primary" onClick={logRecipe} disabled={logging}>{logging ? "Adding…" : "Add to diary"}</button>
                </div>
                <p className="small muted" style={{ marginTop: ".75rem" }}>General nutrition information, not medical advice. If you have a condition such as diabetes or kidney disease, or are pregnant, ask your doctor or dietitian before changing your diet.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="card coach-section">
        <h2>Today's food diary</h2>
        {meals.length === 0 ? (
          <p className="muted">No meals recorded today. Add one from the Scanner, the Diary, or a recipe above.</p>
        ) : meals.map((m) => (
          <div className="meal" key={m.id}>
            <div className="grow"><b>{m.foodName}</b><div className="muted small">{cap(m.mealType)} · {m.portionGrams} g</div></div>
            <b>{m.calories} kcal</b>
          </div>
        ))}
      </section>
    </>
  );
}