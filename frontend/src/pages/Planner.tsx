import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Copy, Lock, RefreshCw, ShoppingBasket, Shuffle, Unlock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useGoals, useMeals } from "../hooks/useData";
import { usePersisted } from "../hooks/usePersisted";
import { addMeal, getUserProfile } from "../services/firestoreService";
import { addDays, dayKey, fromDayKey, round1, startOfDay, sumMeals } from "../services/nutrition";
import {
  MIN_CALORIES, SERVING_STEPS, dayTotals, generatePlan, recipeById, shoppingList, slotMacros, swapSlot, targetsFrom, wantedMeals,
  type Plan, type PlanSettings, type PlanSlot,
} from "../services/mealPlanner";
import { ALLERGENS, RECIPES, formatIngredient, type Allergen, type DietFilter } from "../services/recipes";
import { PageHeader, ProgressBar, Skeleton } from "../components/ui";
import "./Planner.css";

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const seed = () => Date.now() % 2147483647;

export default function Planner() {
  const { user } = useAuth();
  const toast = useToast();
  const uid = user?.uid ?? "anon";
  const { goals, loading: goalsLoading } = useGoals();
  const today = startOfDay(new Date());
  const todayKey = dayKey(today);
  const { meals, loading: mealsLoading } = useMeals(today, addDays(today, 1));
  const consumed = useMemo(() => sumMeals(meals), [meals]);

  // Diet and allergy choices are shared with the AI Coach page (same storage keys).
  const [diet, setDiet] = usePersisted<DietFilter | null>(`nv-coach-${uid}-diet`, null);
  const [avoid, setAvoid] = usePersisted<Allergen[]>(`nv-coach-${uid}-avoid`, []);
  const [mealsPerDay, setMealsPerDay] = usePersisted<3 | 4>(`nv-plan-${uid}-meals`, 4);
  const [maxMinutes, setMaxMinutes] = usePersisted<number>(`nv-plan-${uid}-maxmin`, 0);
  const [plan, setPlan] = usePersisted<Plan | null>(`nv-plan-${uid}`, null);
  const [sel, setSel] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!user || diet !== null) return;
    getUserProfile(user.uid).then((p) => { if (p?.preferences.diet === "vegetarian") setDiet("veg"); }).catch(() => undefined);
  }, [user, diet, setDiet]);

  const settings: PlanSettings = useMemo(
    () => ({ goals, diet: diet ?? "any", avoid, mealsPerDay, maxMinutes }), [goals, diet, avoid, mealsPerDay, maxMinutes]);
  const target = targetsFrom(goals);

  const activeDate = plan?.days.find((d) => d.date === sel)?.date ?? (plan?.days.find((d) => d.date >= todayKey) ?? plan?.days[0])?.date;
  const dayIdx = plan ? plan.days.findIndex((d) => d.date === activeDate) : -1;
  const day = plan && dayIdx >= 0 ? plan.days[dayIdx] : null;
  const isToday = activeDate === todayKey;
  const isFuture = !!activeDate && activeDate > todayKey;

  const build = (keepLocks: boolean) => {
    setPlan(generatePlan(settings, today, 7, seed(), keepLocks ? plan ?? undefined : undefined, consumed));
    setSel(null);
    toast(keepLocks && plan ? "Plan regenerated" : "7-day plan ready");
  };
  const replanToday = () => {
    if (!plan) return;
    const fresh = generatePlan(settings, today, 7, seed(), plan, consumed);
    setPlan({ ...plan, days: plan.days.map((d) => (d.date === todayKey ? fresh.days.find((x) => x.date === todayKey) ?? d : d)) });
    toast("Today's plan updated for what you've eaten");
  };
  const patchSlot = (idx: number, patch: Partial<PlanSlot>) => {
    if (!plan || dayIdx < 0) return;
    setPlan({ ...plan, days: plan.days.map((d, i) => (i === dayIdx ? { ...d, slots: d.slots.map((s, k) => (k === idx ? { ...s, ...patch } : s)) } : d)) });
  };
  const swap = (idx: number) => { if (plan) setPlan(swapSlot(plan, dayIdx, idx, settings, seed())); };

  const eat = async (idx: number) => {
    if (!user || !day) return;
    const slot = day.slots[idx], r = recipeById(slot.recipeId);
    if (!r) return;
    const m = slotMacros(slot);
    const [y, mo, d] = day.date.split("-").map(Number);
    setBusy(idx);
    try {
      await addMeal(user.uid, {
        foodName: `${r.title} (${slot.servings} serving${slot.servings === 1 ? "" : "s"})`.slice(0, 120), mealType: slot.mealType,
        portionGrams: Math.max(1, Math.round(r.servingGrams * slot.servings)), eatenAt: isToday ? new Date() : new Date(y, mo - 1, d, 12),
        calories: m.calories, protein: round1(m.protein), carbohydrates: round1(m.carbohydrates), fat: round1(m.fat),
      });
      patchSlot(idx, { eaten: true, locked: true });
      toast("Logged to your diary");
    } catch { toast("Couldn't log this meal. Try again.", "error"); } finally { setBusy(null); }
  };

  const list = useMemo(() => (plan ? shoppingList(plan, todayKey) : []), [plan, todayKey]);
  const copyList = async () => {
    const text = list.map((g) => `${g.title}\n${g.items.map((i) => `- ${i}`).join("\n")}`).join("\n\n");
    try { await navigator.clipboard.writeText(text); toast("Shopping list copied"); } catch { toast("Couldn't copy the list.", "error"); }
  };

  if (!user) return <p>Please sign in to use the Meal Planner.</p>;

  // Today's day total = what's already in the diary + planned meals not yet eaten.
  const counted = day ? day.slots.filter((s) => !(isToday && s.eaten)) : [];
  const planned = day ? counted.reduce((t, s) => { const m = slotMacros(s); return { calories: t.calories + m.calories, protein: t.protein + m.protein, carbohydrates: t.carbohydrates + m.carbohydrates, fat: t.fat + m.fat }; }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }) : null;
  const total = planned && day ? (isToday ? { calories: planned.calories + consumed.calories, protein: planned.protein + consumed.protein, carbohydrates: planned.carbohydrates + consumed.carbohydrates, fat: planned.fat + consumed.fat } : dayTotals(day)) : null;
  const dev = total ? Math.round(((total.calories - target.calories) / target.calories) * 100) : 0;
  const missing = day ? wantedMeals(mealsPerDay).length - day.slots.length : 0;
  const planStale = plan && plan.days[plan.days.length - 1].date < todayKey;

  return (
    <>
      <PageHeader title="Meal planner" sub="A week of meals built around your calorie and macro targets, with a shopping list." />

      {goals.calorieTarget < MIN_CALORIES && (
        <div className="alert error" role="alert">Your calorie target is below {MIN_CALORIES.toLocaleString()} kcal. Plans use {MIN_CALORIES.toLocaleString()} kcal as a floor. Please set lower targets only with a doctor or dietitian.</div>
      )}

      <section className="card plan-section">
        <h2 className="tight-h" style={{ display: "flex", gap: ".5rem", alignItems: "center" }}><CalendarDays size={20} aria-hidden /> Plan settings</h2>
        <p className="muted small">Targets from your Goals page: {target.calories} kcal · {target.protein} g protein · {target.carbohydrates} g carbs · {target.fat} g fat</p>
        <div className="plan-settings">
          <div className="field"><label htmlFor="pd">Diet</label>
            <select id="pd" value={diet ?? "any"} onChange={(e) => setDiet(e.target.value as DietFilter)}>
              <option value="any">Any diet</option><option value="egg">Vegetarian (eggs OK)</option><option value="veg">Vegetarian (no eggs)</option></select></div>
          <div className="field"><label htmlFor="pm">Meals per day</label>
            <select id="pm" value={mealsPerDay} onChange={(e) => setMealsPerDay(Number(e.target.value) as 3 | 4)}>
              <option value={3}>3 (breakfast, lunch, dinner)</option><option value={4}>4 (adds a snack)</option></select></div>
          <div className="field"><label htmlFor="pt">Cooking time per meal</label>
            <select id="pt" value={maxMinutes} onChange={(e) => setMaxMinutes(Number(e.target.value))}>
              <option value={0}>Any</option><option value={20}>20 minutes or less</option><option value={30}>30 minutes or less</option><option value={45}>45 minutes or less</option></select></div>
        </div>
        <p className="coach-label" style={{ fontSize: ".85rem", opacity: .7, marginTop: ".75rem" }}>Avoid</p>
        <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }} role="group" aria-label="Allergies and foods to avoid">
          {ALLERGENS.map((a) => { const on = avoid.includes(a.id); return (
            <button type="button" key={a.id} className={`plan-tab ${on ? "on" : ""}`} aria-pressed={on} style={on ? { background: "#b3382c", borderColor: "#b3382c" } : undefined}
              onClick={() => setAvoid(on ? avoid.filter((x) => x !== a.id) : [...avoid, a.id])}>{a.label}</button>); })}
        </div>
        <div className="plan-actions">
          <button type="button" className="btn primary" onClick={() => build(false)} disabled={goalsLoading || mealsLoading}>{plan ? "Build a fresh plan" : "Build my 7-day plan"}</button>
          {plan && <button type="button" className="btn ghost" onClick={() => build(true)}><RefreshCw size={16} aria-hidden /> Regenerate (keep locked meals)</button>}
        </div>
        <p className="small muted" style={{ marginTop: ".75rem" }}>
          Plans are built from {RECIPES.length} curated recipes, so meals repeat and some filters leave few options. Nutrition is approximate. This is general guidance, not medical advice. If you have a condition such as diabetes or kidney disease, or are pregnant, ask your doctor or dietitian first.
        </p>
      </section>

      {goalsLoading || mealsLoading ? <Skeleton h={160} /> : !plan ? (
        <div className="empty plan-section"><h3>No plan yet</h3><p>Choose your settings and build your first plan.</p></div>
      ) : (
        <>
          {planStale && <div className="alert info">This plan is from an earlier week. Build a fresh plan to start from today.</div>}
          <section className="card plan-section">
            <div className="plan-tabs" role="tablist" aria-label="Plan days">
              {plan.days.map((d) => { const dt = fromDayKey(d.date); return (
                <button type="button" role="tab" aria-selected={d.date === activeDate} key={d.date} className={`plan-tab ${d.date === activeDate ? "on" : ""}`} onClick={() => setSel(d.date)}>
                  {dt.toLocaleDateString(undefined, { weekday: "short" })}<small>{d.date === todayKey ? "Today" : dt.getDate()}</small></button>); })}
            </div>

            {day && total && (
              <>
                <div className="plan-day-sum">
                  <span><b>{total.calories}</b> / {target.calories} kcal ({dev > 0 ? "+" : ""}{dev}%)</span>
                  <span>Protein <b>{Math.round(total.protein)}</b> / {target.protein} g</span>
                  <span>Carbs <b>{Math.round(total.carbohydrates)}</b> / {target.carbohydrates} g</span>
                  <span>Fat <b>{Math.round(total.fat)}</b> / {target.fat} g</span>
                </div>
                <ProgressBar value={total.calories} max={target.calories} label="Day calories vs target" />
                {isToday && <p className="small muted">Today's total = {consumed.calories} kcal already in your diary + {Math.round(planned?.calories ?? 0)} kcal planned.</p>}
                {Math.abs(dev) > 10 && <div className="alert info" style={{ marginTop: ".5rem" }}>This day is about {Math.abs(dev)}% {dev < 0 ? "under" : "over"} your calorie target. {dev < 0 ? "Add a side such as roti or rice, use 4 meals a day, or relax the filters." : "Reduce a portion or swap a meal."}</div>}
                {missing > 0 && <div className="alert info" style={{ marginTop: ".5rem" }}>Only {day.slots.length} of {wantedMeals(mealsPerDay).length} meals could be filled with your current filters. Relax the diet, avoid list or cooking time to get more options.</div>}
                {isToday && <button type="button" className="btn ghost sm" onClick={replanToday} style={{ marginTop: ".5rem" }}><RefreshCw size={14} aria-hidden /> Re-plan today from what I've eaten</button>}

                {day.slots.length === 0 && <p className="muted" style={{ marginTop: ".75rem" }}>No meals planned for this day.</p>}
                {day.slots.map((s, i) => {
                  const r = recipeById(s.recipeId); if (!r) return null; const m = slotMacros(s);
                  return (
                    <div className={`plan-slot ${s.eaten ? "eaten" : ""}`} key={`${s.mealType}-${s.recipeId}`}>
                      <div className="grow">
                        <div className="small muted">{cap(s.mealType)}</div>
                        <b>{r.title}</b>
                        <div className="muted small">{m.calories} kcal · P {Math.round(m.protein)} · C {Math.round(m.carbohydrates)} · F {Math.round(m.fat)} · {r.minutes} min</div>
                        <details>
                          <summary>Ingredients and steps</summary>
                          <ul>{r.ingredients.map((ing, k) => <li key={k}>{formatIngredient(ing, s.servings / r.baseServings)}</li>)}</ul>
                          <ol>{r.steps.map((st, k) => <li key={k}>{st}</li>)}</ol>
                          {r.note && <p className="small"><b>Safety:</b> {r.note}</p>}
                        </details>
                      </div>
                      <div className="slot-actions">
                        <select aria-label={`Servings for ${r.title}`} value={s.servings} disabled={s.eaten} onChange={(e) => patchSlot(i, { servings: Number(e.target.value) })}>
                          {SERVING_STEPS.map((n) => <option key={n} value={n}>{n} serving{n === 1 ? "" : "s"}</option>)}</select>
                        <button type="button" className="icon-btn" aria-pressed={s.locked} aria-label={s.locked ? "Unlock meal" : "Lock meal"} title={s.locked ? "Locked: kept when regenerating" : "Lock to keep when regenerating"} disabled={s.eaten} onClick={() => patchSlot(i, { locked: !s.locked })}>{s.locked ? <Lock size={17} /> : <Unlock size={17} />}</button>
                        <button type="button" className="icon-btn" aria-label={`Swap ${r.title}`} title="Swap for another recipe" disabled={s.eaten} onClick={() => swap(i)}><Shuffle size={17} /></button>
                        {s.eaten ? <span className="badge"><Check size={12} aria-hidden /> Logged</span>
                          : <button type="button" className="btn ghost sm" disabled={isFuture || busy === i} title={isFuture ? "You can log this on the day" : undefined} onClick={() => eat(i)}>{busy === i ? "Logging…" : "Ate this"}</button>}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </section>

          <section className="card plan-section">
            <div className="between">
              <h2 style={{ margin: 0, display: "flex", gap: ".5rem", alignItems: "center" }}><ShoppingBasket size={20} aria-hidden /> Shopping list</h2>
              <button type="button" className="btn ghost sm" onClick={() => setShowList(!showList)} aria-expanded={showList}>{showList ? "Hide" : "Show"}</button>
            </div>
            {showList && (list.length === 0 ? <p className="muted">Nothing to buy. All planned meals are eaten.</p> : (
              <>
                <p className="small muted">Combined for meals from today that you haven't eaten yet. Amounts are the sum of each recipe's scaled ingredients.</p>
                {list.map((g) => <div className="shop-group" key={g.title}><h3>{g.title}</h3><ul>{g.items.map((it) => <li key={it}>{it}</li>)}</ul></div>)}
                <button type="button" className="btn ghost sm" style={{ marginTop: ".75rem" }} onClick={copyList}><Copy size={14} aria-hidden /> Copy list</button>
              </>
            ))}
          </section>
        </>
      )}
    </>
  );
}