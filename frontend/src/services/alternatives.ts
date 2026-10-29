import type { Budget, Diet, Food } from "../types";
import { FOODS } from "./nutrition";

export interface Alternative { food: Food; reasons: string[]; score: number }

/**
 * Transparent rule-based suggestions. A candidate must be in the same category,
 * match the diet and budget, and improve on the original by at least one rule:
 *  - 15% or fewer calories per 100 g (+2)
 *  - 20% more protein per 100 kcal (+2)
 *  - 25% less fat per 100 g (+1)
 * Cheaper candidates get +1.
 */
export function suggestAlternatives(origin: Food, diet: Diet, budget: Budget): Alternative[] {
  const maxCost = budget === "low" ? 1 : budget === "medium" ? 2 : 3;
  const ppk = (x: Food) => (x.calories > 0 ? (x.protein / x.calories) * 100 : 0);
  const out: Alternative[] = [];
  for (const c of FOODS) {
    if (c.id === origin.id || c.category !== origin.category) continue;
    if (diet === "vegetarian" && !c.vegetarian) continue;
    if (c.cost > maxCost) continue;
    const reasons: string[] = []; let score = 0;
    if (c.calories <= origin.calories * 0.85) {
      reasons.push(`${Math.round((1 - c.calories / origin.calories) * 100)}% fewer calories per 100 g`); score += 2;
    }
    if (ppk(c) >= ppk(origin) * 1.2 && c.protein >= 2) {
      reasons.push(`More protein for the calories (${ppk(c).toFixed(1)} g vs ${ppk(origin).toFixed(1)} g per 100 kcal)`); score += 2;
    }
    if (origin.fat > 2 && c.fat <= origin.fat * 0.75) {
      reasons.push(`${Math.round((1 - c.fat / origin.fat) * 100)}% less fat`); score += 1;
    }
    if (reasons.length) {
      if (c.cost < origin.cost) { reasons.push("Usually cheaper"); score += 1; }
      out.push({ food: c, reasons, score });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 4);
}
