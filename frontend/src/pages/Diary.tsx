import { useState } from "react";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useMeals } from "../hooks/useData";
import { addDays, dayKey, fromDayKey, rescaleMeal, startOfDay, sumMeals, calcNutrition, FOODS } from "../services/nutrition";
import { addMeal, deleteMeal, updateMeal } from "../services/firestoreService";
import { MEAL_TYPES, type Meal, type MealType } from "../types";
import { Empty, ErrorBox, FoodThumb, PageHeader, Skeleton } from "../components/ui";

export default function Diary() {
  const { user } = useAuth(); const toast = useToast();
  const [key, setKey] = useState(dayKey(new Date()));
  const day = fromDayKey(key);
  const { meals, loading, error } = useMeals(startOfDay(day), addDays(startOfDay(day), 1));
  const [editing, setEditing] = useState<Meal | null>(null); const [ePortion, setEPortion] = useState(""); const [eType, setEType] = useState<MealType>("breakfast");
  const [adding, setAdding] = useState<MealType | null>(null); const [aFood, setAFood] = useState(FOODS[0].id); const [aGrams, setAGrams] = useState("100");
  const total = sumMeals(meals);

  const shift = (n: number) => setKey(dayKey(addDays(day, n)));
  const startEdit = (m: Meal) => { setEditing(m); setEPortion(String(m.portionGrams)); setEType(m.mealType); };
  const saveEdit = async () => {
    const p = Number(ePortion);
    if (!user || !editing || !(p > 0 && p <= 5000)) return toast("Portion must be between 1 and 5000 g.", "error");
    try { await updateMeal(user.uid, editing.id, { portionGrams: p, mealType: eType, ...rescaleMeal(editing, p) }); toast("Meal updated"); setEditing(null); }
    catch { toast("Couldn't update this meal.", "error"); }
  };
  const remove = async (m: Meal) => {
    if (!user || !confirm(`Delete ${m.foodName}?`)) return;
    try { await deleteMeal(user.uid, m.id); toast("Meal deleted"); } catch { toast("Couldn't delete this meal.", "error"); }
  };
  const quickAdd = async () => {
    const g = Number(aGrams); const f = FOODS.find((x) => x.id === aFood)!;
    if (!user || !adding || !(g > 0 && g <= 5000)) return toast("Portion must be between 1 and 5000 g.", "error");
    const at = new Date(day); const now = new Date(); at.setHours(now.getHours(), now.getMinutes(), 0, 0);
    try { await addMeal(user.uid, { foodName: f.name, mealType: adding, portionGrams: g, eatenAt: at, ...calcNutrition(f, g) }); toast("Meal added"); setAdding(null); }
    catch { toast("Couldn't add this meal.", "error"); }
  };

  return (
    <>
      <PageHeader title="Food diary" sub={`${total.calories} kcal · ${total.protein} g protein · ${total.carbohydrates} g carbs · ${total.fat} g fat`}
        right={<div className="datenav"><button className="icon-btn" onClick={() => shift(-1)} aria-label="Previous day"><ChevronLeft /></button>
          <input type="date" aria-label="Diary date" value={key} max={dayKey(new Date())} onChange={(e) => e.target.value && setKey(e.target.value)} />
          <button className="icon-btn" onClick={() => shift(1)} aria-label="Next day" disabled={key >= dayKey(new Date())}><ChevronRight /></button></div>} />
      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? <Skeleton h={200} /> : MEAL_TYPES.map((t) => {
        const list = meals.filter((m) => m.mealType === t); const s = sumMeals(list);
        return (
          <section className="card meal-group" key={t}>
            <div className="group-head"><h2>{t[0].toUpperCase() + t.slice(1)}</h2><span className="muted small">{s.calories} kcal</span>
              <button className="btn ghost sm" onClick={() => setAdding(adding === t ? null : t)}>{adding === t ? "Cancel" : "Add food"}</button></div>
            {adding === t && (
              <div className="inline-form">
                <div className="field"><label htmlFor="af">Food</label><select id="af" value={aFood} onChange={(e) => setAFood(e.target.value)}>{FOODS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
                <div className="field"><label htmlFor="ag">Grams</label><input id="ag" type="number" min="1" value={aGrams} onChange={(e) => setAGrams(e.target.value)} /></div>
                <button className="btn primary" onClick={quickAdd}>Save</button>
              </div>)}
            {list.length === 0 ? <p className="muted small">Nothing logged for {t}.</p> : list.map((m) => (
              <div className="meal" key={m.id}>
                <FoodThumb name={m.foodName} />
                {editing?.id === m.id ? (
                  <div className="inline-form grow">
                    <div className="field"><label htmlFor="ep">Grams</label><input id="ep" type="number" min="1" value={ePortion} onChange={(e) => setEPortion(e.target.value)} /></div>
                    <div className="field"><label htmlFor="et">Meal</label><select id="et" value={eType} onChange={(e) => setEType(e.target.value as MealType)}>{MEAL_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
                    <button className="btn primary" onClick={saveEdit}>Save</button><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                ) : (<>
                  <div className="grow"><b>{m.foodName}</b><div className="muted small">{m.portionGrams} g · {m.calories} kcal · P {m.protein} · C {m.carbohydrates} · F {m.fat}</div></div>
                  <button className="icon-btn" onClick={() => startEdit(m)} aria-label={`Edit ${m.foodName}`}><Pencil size={17} /></button>
                  <button className="icon-btn danger" onClick={() => remove(m)} aria-label={`Delete ${m.foodName}`}><Trash2 size={17} /></button>
                </>)}
              </div>))}
          </section>);
      })}
      {!loading && meals.length === 0 && <Empty title="No meals on this day">Use "Add food" above or the Scanner to log one.</Empty>}
    </>
  );
}
