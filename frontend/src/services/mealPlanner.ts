import type { Goals, Macros, MealType } from "../types";
import { RECIPES, formatIngredient, isAllowed, type Allergen, type DietFilter, type Recipe } from "./recipes";
import { addDays, dayKey, round1, startOfDay } from "./nutrition";

export const SERVING_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5];
/** Plans never aim below this. Lower targets should be set with a doctor or dietitian. */
export const MIN_CALORIES = 1200;

export interface PlanSlot { mealType: MealType; recipeId: string; servings: number; locked: boolean; eaten: boolean }
export interface DayPlan { date: string; slots: PlanSlot[] }
export interface Plan { createdAt: number; days: DayPlan[] }
export interface PlanSettings { goals: Goals; diet: DietFilter; avoid: Allergen[]; mealsPerDay: 3 | 4; maxMinutes: number } // maxMinutes 0 = any

const ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const WEIGHT: Record<MealType, number> = { breakfast: 0.3, lunch: 0.4, dinner: 0.3, snack: 0.1 };
const ZERO: Macros = { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
const BY_ID = new Map(RECIPES.map((r) => [r.id, r]));

export const recipeById = (id: string): Recipe | undefined => BY_ID.get(id);
export const slotMacros = (s: PlanSlot): Macros => { const r = BY_ID.get(s.recipeId); return r ? scale(r.perServing, s.servings) : ZERO; };
export const wantedMeals = (n: 3 | 4): MealType[] => (n === 4 ? ORDER : ORDER.slice(0, 3));
export const sortSlots = (slots: PlanSlot[]) => [...slots].sort((a, b) => ORDER.indexOf(a.mealType) - ORDER.indexOf(b.mealType));

function scale(m: Macros, k: number): Macros {
  return { calories: Math.round(m.calories * k), protein: round1(m.protein * k), carbohydrates: round1(m.carbohydrates * k), fat: round1(m.fat * k) };
}
const add = (a: Macros, b: Macros): Macros => ({ calories: a.calories + b.calories, protein: a.protein + b.protein, carbohydrates: a.carbohydrates + b.carbohydrates, fat: a.fat + b.fat });
export const dayTotals = (d: DayPlan): Macros => d.slots.reduce((t, s) => add(t, slotMacros(s)), ZERO);

export function targetsFrom(g: Goals): Macros {
  return { calories: Math.max(g.calorieTarget, MIN_CALORIES), protein: g.proteinTarget, carbohydrates: g.carbohydrateTarget, fat: g.fatTarget };
}

/** Small seeded random generator so each "regenerate" gives a different but reproducible plan. */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** How far totals are from a target. Calories matter most. Missing protein and extra fat cost more than the reverse. */
function loss(total: Macros, target: Macros): number {
  const rel = (x: number, t: number) => (t > 0 ? (x - t) / t : 0);
  const dp = rel(total.protein, target.protein), df = rel(total.fat, target.fat);
  return 4 * Math.abs(rel(total.calories, target.calories)) + (dp < 0 ? -3 * dp : 0.7 * dp)
    + (df > 0 ? 1.5 * df : -0.3 * df) + Math.abs(rel(total.carbohydrates, target.carbohydrates));
}
const nearestStep = (x: number) => SERVING_STEPS.reduce((b, s) => (Math.abs(s - x) < Math.abs(b - x) ? s : b), 1);
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function candidates(s: PlanSettings, type: MealType): Recipe[] {
  return RECIPES.filter((r) => r.meals.includes(type) && isAllowed(r, s.diet, s.avoid) && (s.maxMinutes === 0 || r.minutes <= s.maxMinutes));
}

function buildDay(date: string, s: PlanSettings, prev: DayPlan | undefined, use: Map<string, number>, rng: () => number, consumed?: Macros): DayPlan {
  const target = targetsFrom(s.goals);
  const kept = (prev?.slots ?? []).filter((x) => (x.locked || x.eaten) && BY_ID.has(x.recipeId));
  const keptTypes = new Set(kept.map((k) => k.mealType));
  const freeTypes = wantedMeals(s.mealsPerDay).filter((t) => !keptTypes.has(t));

  // Eaten slots are already inside `consumed` (the diary), so don't count them twice.
  let base = consumed ?? ZERO;
  for (const k of kept) if (!(consumed && k.eaten)) base = add(base, slotMacros(k));
  const rem: Macros = {
    calories: Math.max(0, target.calories - base.calories), protein: Math.max(0, target.protein - base.protein),
    carbohydrates: Math.max(0, target.carbohydrates - base.carbohydrates), fat: Math.max(0, target.fat - base.fat),
  };
  if (!freeTypes.length || rem.calories < 100) return { date, slots: sortSlots(kept) };

  const wsum = freeTypes.reduce((a, t) => a + WEIGHT[t], 0);
  const slotTarget = (t: MealType): Macros => ({
    calories: rem.calories * WEIGHT[t] / wsum, protein: rem.protein * WEIGHT[t] / wsum,
    carbohydrates: rem.carbohydrates * WEIGHT[t] / wsum, fat: rem.fat * WEIGHT[t] / wsum,
  });

  const dayUsed = new Set(kept.map((k) => k.recipeId));
  const chosen: PlanSlot[] = [];
  // Fill the most restricted meals first so they don't lose out to flexible ones.
  const order = [...freeTypes].sort((a, b) => candidates(s, a).length - candidates(s, b).length);
  for (const t of order) {
    const st = slotTarget(t);
    let best: { r: Recipe; k: number; l: number } | null = null;
    for (const r of candidates(s, t)) {
      const k = nearestStep(clamp(st.calories / r.perServing.calories, 0.5, 2.5));
      const l = loss(scale(r.perServing, k), st) + (use.get(r.id) ?? 0) * 1.2 + (dayUsed.has(r.id) ? 6 : 0) + rng() * 0.4;
      if (!best || l < best.l) best = { r, k, l };
    }
    if (!best) continue;
    chosen.push({ mealType: t, recipeId: best.r.id, servings: best.k, locked: false, eaten: false });
    dayUsed.add(best.r.id); use.set(best.r.id, (use.get(best.r.id) ?? 0) + 1);
  }

  // Fine-tune portion sizes so the free meals together land close to what's left.
  for (let pass = 0; pass < 3; pass++) {
    for (const slot of chosen) {
      let bestK = slot.servings, bestL = Infinity;
      for (const k of SERVING_STEPS) {
        const total = chosen.reduce((t, x) => add(t, slotMacros(x === slot ? { ...x, servings: k } : x)), ZERO);
        const l = loss(total, rem);
        if (l < bestL - 1e-9) { bestL = l; bestK = k; }
      }
      slot.servings = bestK;
    }
  }
  return { date, slots: sortSlots([...kept, ...chosen]) };
}

/** Build `days` days from `start`. Locked and eaten meals in `prev` are kept. Today's target is reduced by `consumedToday`. */
export function generatePlan(s: PlanSettings, start: Date, days: number, seed: number, prev?: Plan, consumedToday?: Macros): Plan {
  const rng = makeRng(seed);
  const use = new Map<string, number>();
  for (const d of prev?.days ?? []) for (const x of d.slots) if (x.locked || x.eaten) use.set(x.recipeId, (use.get(x.recipeId) ?? 0) + 1);
  const prevBy = new Map((prev?.days ?? []).map((d) => [d.date, d]));
  const todayKey = dayKey(new Date());
  const out: DayPlan[] = [];
  for (let i = 0; i < days; i++) {
    const date = dayKey(addDays(startOfDay(start), i));
    out.push(buildDay(date, s, prevBy.get(date), use, rng, date === todayKey ? consumedToday : undefined));
  }
  return { createdAt: Date.now(), days: out };
}

/** Replace one meal with a different recipe of similar calories. */
export function swapSlot(plan: Plan, dayIdx: number, slotIdx: number, s: PlanSettings, seed: number): Plan {
  const day = plan.days[dayIdx], slot = day?.slots[slotIdx];
  const cur = slot && BY_ID.get(slot.recipeId);
  if (!day || !slot || !cur || slot.eaten) return plan;
  const curM = slotMacros(slot), rng = makeRng(seed);
  const used = new Set(day.slots.map((x) => x.recipeId));
  const use = new Map<string, number>();
  for (const d of plan.days) for (const x of d.slots) use.set(x.recipeId, (use.get(x.recipeId) ?? 0) + 1);
  let best: { r: Recipe; k: number; l: number } | null = null;
  for (const r of candidates(s, slot.mealType)) {
    if (r.id === slot.recipeId) continue;
    const k = nearestStep(clamp(curM.calories / r.perServing.calories, 0.5, 2.5));
    const l = loss(scale(r.perServing, k), curM) + (use.get(r.id) ?? 0) * 1.2 + (used.has(r.id) ? 6 : 0) + rng() * 0.6;
    if (!best || l < best.l) best = { r, k, l };
  }
  if (!best) return plan;
  const slots = day.slots.map((x, i) => (i === slotIdx ? { ...x, recipeId: best!.r.id, servings: best!.k, locked: false } : x));
  return { ...plan, days: plan.days.map((d, i) => (i === dayIdx ? { ...d, slots } : d)) };
}

const GROUPS: { title: string; words: string[] }[] = [
  { title: "Vegetables and fruit", words: ["onion", "tomato", "spinach", "carrot", "peas", "garlic", "ginger", "chilli", "lemon", "lime", "banana", "cucumber", "coriander", "vegetables", "beans", "broccoli", "curry leaves", "spring onion"] },
  { title: "Protein and dairy", words: ["paneer", "eggs", "chicken", "salmon", "tofu", "yogurt", "sprouts"] },
];
const groupOf = (name: string) => GROUPS.find((g) => g.words.some((w) => name.toLowerCase().includes(w)))?.title ?? "Pantry and spices";

/** Combined shopping list for meals from `fromDate` on that haven't been eaten yet. */
export function shoppingList(plan: Plan, fromDate: string): { title: string; items: string[] }[] {
  const sums = new Map<string, { amount: number; unit: string; name: string }>();
  const taste = new Set<string>();
  for (const d of plan.days) {
    if (d.date < fromDate) continue;
    for (const slot of d.slots) {
      const r = BY_ID.get(slot.recipeId);
      if (!r || slot.eaten) continue;
      const f = slot.servings / r.baseServings;
      for (const i of r.ingredients) {
        if (i.amount <= 0) { taste.add(i.name); continue; }
        const key = `${i.unit}|${i.name}`;
        const cur = sums.get(key);
        sums.set(key, { amount: (cur?.amount ?? 0) + i.amount * f, unit: i.unit, name: i.name });
      }
    }
  }
  const groups = new Map<string, string[]>();
  const push = (title: string, line: string) => groups.set(title, [...(groups.get(title) ?? []), line]);
  for (const v of sums.values()) push(groupOf(v.name), formatIngredient({ amount: v.amount, unit: v.unit, name: v.name }, 1));
  for (const n of taste) push("Pantry and spices", `${n}`);
  return [...groups.entries()].map(([title, items]) => ({ title, items: items.sort() }))
    .sort((a, b) => a.title.localeCompare(b.title));
}