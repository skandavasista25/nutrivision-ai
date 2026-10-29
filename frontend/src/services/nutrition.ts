import type { Food, Macros, Meal } from "../types";

// Sample dataset: approximate values per 100 g. Estimates only, not lab-verified.
const f = (id: string, name: string, category: Food["category"], calories: number, protein: number,
  carbohydrates: number, fat: number, vegetarian: boolean, cost: 1 | 2 | 3): Food =>
  ({ id, name, category, calories, protein, carbohydrates, fat, vegetarian, cost });

export const FOODS: Food[] = [
  f("white-rice", "White rice, cooked", "grain", 130, 2.7, 28, 0.3, true, 1),
  f("brown-rice", "Brown rice, cooked", "grain", 112, 2.3, 24, 0.8, true, 1),
  f("quinoa", "Quinoa, cooked", "grain", 120, 4.4, 21, 1.9, true, 3),
  f("white-bread", "White bread", "grain", 265, 9, 49, 3.2, true, 1),
  f("wholewheat-bread", "Whole wheat bread", "grain", 247, 13, 41, 3.4, true, 1),
  f("chapati", "Chapati / roti", "grain", 297, 9.8, 51, 7.5, true, 1),
  f("pasta", "Pasta, cooked", "grain", 158, 5.8, 31, 0.9, true, 1),
  f("oats", "Oatmeal, cooked", "grain", 71, 2.5, 12, 1.5, true, 1),
  f("chicken-fried", "Fried chicken", "protein", 280, 24, 10, 16, false, 2),
  f("chicken-breast", "Chicken breast, grilled", "protein", 165, 31, 0, 3.6, false, 2),
  f("egg", "Egg, boiled", "protein", 155, 13, 1.1, 11, true, 1),
  f("salmon", "Salmon, baked", "protein", 206, 22, 0, 12, false, 3),
  f("tofu", "Tofu, firm", "protein", 144, 17, 3, 9, true, 2),
  f("paneer", "Paneer", "protein", 265, 18, 1.2, 21, true, 2),
  f("lentils", "Lentils (dal), cooked", "legume", 116, 9, 20, 0.4, true, 1),
  f("chickpeas", "Chickpeas, cooked", "legume", 164, 8.9, 27, 2.6, true, 1),
  f("whole-milk", "Whole milk", "dairy", 61, 3.2, 4.8, 3.3, true, 1),
  f("skim-milk", "Skim milk", "dairy", 34, 3.4, 5, 0.1, true, 1),
  f("greek-yogurt", "Greek yogurt, plain", "dairy", 97, 9, 4, 5, true, 2),
  f("curd", "Curd / plain yogurt", "dairy", 61, 3.5, 4.7, 3.3, true, 1),
  f("broccoli", "Broccoli, steamed", "veg", 35, 2.4, 7, 0.4, true, 1),
  f("potato-boiled", "Potato, boiled", "veg", 87, 1.9, 20, 0.1, true, 1),
  f("banana", "Banana", "fruit", 89, 1.1, 23, 0.3, true, 1),
  f("apple", "Apple", "fruit", 52, 0.3, 14, 0.2, true, 1),
  f("potato-fries", "French fries", "snack", 312, 3.4, 41, 15, true, 1),
  f("chips", "Potato chips", "snack", 536, 7, 53, 35, true, 1),
  f("almonds", "Almonds", "snack", 579, 21, 22, 50, true, 3),
  f("roasted-chana", "Roasted chana", "snack", 364, 19, 61, 6, true, 1),
  f("popcorn", "Popcorn, air-popped", "snack", 387, 13, 78, 4.5, true, 1),
  f("cola", "Cola", "drink", 42, 0, 10.6, 0, true, 1),
  f("buttermilk", "Buttermilk", "drink", 40, 3.3, 4.8, 0.9, true, 1),
];

export const round1 = (n: number) => Math.round(n * 10) / 10;

/** Scale per-100 g values to a portion size. */
export function calcNutrition(per100g: Macros, portionGrams: number): Macros {
  const k = portionGrams / 100;
  return {
    calories: Math.round(per100g.calories * k),
    protein: round1(per100g.protein * k),
    carbohydrates: round1(per100g.carbohydrates * k),
    fat: round1(per100g.fat * k),
  };
}

/** Rescale stored meal values when the portion changes. */
export function rescaleMeal(m: Macros & { portionGrams: number }, newPortion: number): Macros {
  const k = m.portionGrams > 0 ? newPortion / m.portionGrams : 0;
  return {
    calories: Math.round(m.calories * k), protein: round1(m.protein * k),
    carbohydrates: round1(m.carbohydrates * k), fat: round1(m.fat * k),
  };
}

export function sumMeals(meals: Macros[]): Macros {
  const t = meals.reduce((a, m) => ({
    calories: a.calories + m.calories, protein: a.protein + m.protein,
    carbohydrates: a.carbohydrates + m.carbohydrates, fat: a.fat + m.fat,
  }), { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
  return { calories: Math.round(t.calories), protein: round1(t.protein),
    carbohydrates: round1(t.carbohydrates), fat: round1(t.fat) };
}

// Local-timezone day helpers: day boundaries follow the user's device clock.
export const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromDayKey = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
