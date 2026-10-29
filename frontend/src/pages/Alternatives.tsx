import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserProfile } from "../services/firestoreService";
import { suggestAlternatives } from "../services/alternatives";
import { FOODS } from "../services/nutrition";
import { DEFAULT_PREFS, type Budget, type Diet, type Food } from "../types";
import { Empty, FoodThumb, PageHeader } from "../components/ui";

const row = (f: Food) => `${f.calories} kcal · P ${f.protein} · C ${f.carbohydrates} · F ${f.fat}`;

export default function Alternatives() {
  const { user } = useAuth();
  const [foodId, setFoodId] = useState("chips");
  const [diet, setDiet] = useState<Diet>(DEFAULT_PREFS.diet); const [budget, setBudget] = useState<Budget>(DEFAULT_PREFS.budget);
  useEffect(() => { if (user) getUserProfile(user.uid).then((p) => { if (p) { setDiet(p.preferences.diet); setBudget(p.preferences.budget); } }).catch(() => undefined); }, [user]);
  const origin = FOODS.find((f) => f.id === foodId)!;
  const alts = suggestAlternatives(origin, diet, budget);
  return (
    <>
      <PageHeader title="Healthier alternatives" sub="Rule-based swaps from the sample dataset, compared per 100 g." />
      <section className="card">
        <div className="row3">
          <div className="field"><label htmlFor="f">Food to replace</label><select id="f" value={foodId} onChange={(e) => setFoodId(e.target.value)}>{FOODS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
          <div className="field"><label htmlFor="d">Diet</label><select id="d" value={diet} onChange={(e) => setDiet(e.target.value as Diet)}><option value="any">Vegetarian and non-vegetarian</option><option value="vegetarian">Vegetarian only</option></select></div>
          <div className="field"><label htmlFor="b">Budget</label><select id="b" value={budget} onChange={(e) => setBudget(e.target.value as Budget)}><option value="any">Any</option><option value="medium">Low to medium</option><option value="low">Low only</option></select></div>
        </div>
        <div className="meal"><FoodThumb name={origin.name} /><div className="grow"><b>{origin.name}</b><div className="muted small">{row(origin)}</div></div></div>
      </section>
      {alts.length === 0 ? <Empty title="No better match found">Try a different food, or relax the diet or budget filter.</Empty> : (
        <div className="grid2">{alts.map(({ food, reasons }) => (
          <section className="card" key={food.id}>
            <div className="meal"><FoodThumb name={food.name} /><div className="grow"><b>{food.name}</b><div className="muted small">{row(food)}</div></div>
              <span className="tag">{food.vegetarian ? "Vegetarian" : "Non-veg"}</span></div>
            <ul className="reasons">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </section>))}</div>)}
    </>
  );
}
