import type { Timestamp } from "firebase/firestore";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
export type Diet = "any" | "vegetarian";
export type Budget = "any" | "low" | "medium";

export interface Macros { calories: number; protein: number; carbohydrates: number; fat: number }

export interface Goals {
  calorieTarget: number; proteinTarget: number; carbohydrateTarget: number; fatTarget: number;
}
export const DEFAULT_GOALS: Goals = { calorieTarget: 2000, proteinTarget: 100, carbohydrateTarget: 250, fatTarget: 65 };

export interface Preferences { diet: Diet; budget: Budget }
export const DEFAULT_PREFS: Preferences = { diet: "any", budget: "any" };

export interface UserProfile {
  displayName: string; email: string; createdAt: Timestamp | null;
  preferences: Preferences; nutritionGoals: Goals;
}

export interface MealInput extends Macros { foodName: string; mealType: MealType; portionGrams: number; eatenAt: Date }
export interface Meal extends Macros {
  id: string; foodName: string; mealType: MealType; portionGrams: number;
  eatenAt: Date; createdAt: Date | null;
}

// Per-100 g values; cost 1 = low, 3 = high.
export interface Food extends Macros {
  id: string; name: string; category: "grain" | "protein" | "dairy" | "veg" | "fruit" | "snack" | "legume" | "drink";
  vegetarian: boolean; cost: 1 | 2 | 3;
}
