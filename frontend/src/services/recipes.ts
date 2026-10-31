import type { Macros, MealType } from "../types";

export type RecipeDiet = "veg" | "egg" | "nonveg";
/** Diet filter: any = no limit, egg = vegetarian incl. eggs, veg = vegetarian without eggs. */
export type DietFilter = "any" | "egg" | "veg";
export type Allergen = "egg" | "dairy" | "nuts" | "soy" | "gluten" | "fish";
export const ALLERGENS: { id: Allergen; label: string }[] = [
  { id: "egg", label: "Egg" }, { id: "dairy", label: "Dairy" }, { id: "nuts", label: "Nuts & peanuts" },
  { id: "soy", label: "Soy" }, { id: "gluten", label: "Gluten" }, { id: "fish", label: "Fish" },
];

export interface Ingredient { amount: number; unit: string; name: string } // amount 0 = "to taste"
export interface Recipe {
  id: string; title: string; diet: RecipeDiet; allergens: Allergen[]; meals: MealType[];
  minutes: number; baseServings: number; servingGrams: number;
  perServing: Macros; // approximate, typical ingredients
  ingredients: Ingredient[]; steps: string[]; tip: string; note?: string; tags: string[];
}

const I = (amount: number, unit: string, name: string): Ingredient => ({ amount, unit, name });

// Curated library. Nutrition per serving is an approximate estimate from typical ingredient values.
export const RECIPES: Recipe[] = [
  {
    id: "moong-dal-tadka", title: "Moong dal tadka", diet: "veg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 30, baseServings: 2, servingGrams: 300, perServing: { calories: 295, protein: 18, carbohydrates: 49, fat: 4 },
    tags: ["dal", "lentil", "indian", "high fibre"],
    ingredients: [I(150, "g", "split yellow moong dal"), I(450, "ml", "water"), I(0.5, "tsp", "turmeric"), I(100, "g", "tomato, chopped"),
      I(1, "tsp", "oil"), I(1, "tsp", "cumin seeds"), I(3, "", "garlic cloves, sliced"), I(1, "", "dried red chilli"), I(0, "", "salt, to taste"), I(0, "", "coriander and lemon juice, to finish")],
    steps: ["Rinse the dal until the water runs mostly clear.", "Cook the dal with water, turmeric, tomato and salt until soft (about 3 pressure-cooker whistles, or 25 minutes simmering). Mash lightly.",
      "Heat the oil in a small pan. Add cumin until it sputters, then the garlic and chilli until golden.", "Pour the tempering over the dal and stir.", "Finish with coriander and lemon. Serve with rice or roti."],
    tip: "Ghee instead of oil tastes richer but adds calories, so measure it with a teaspoon.",
  },
  {
    id: "egg-bhurji-spinach", title: "Spinach egg bhurji", diet: "egg", allergens: ["egg"], meals: ["breakfast", "dinner"],
    minutes: 15, baseServings: 2, servingGrams: 200, perServing: { calories: 190, protein: 14, carbohydrates: 5, fat: 12 },
    tags: ["eggs", "scrambled", "quick", "indian"],
    ingredients: [I(4, "", "eggs"), I(100, "g", "spinach, chopped"), I(100, "g", "onion, chopped"), I(100, "g", "tomato, chopped"), I(1, "tsp", "oil"), I(0.5, "tsp", "turmeric"), I(0.5, "tsp", "chilli powder"), I(0, "", "salt, to taste")],
    steps: ["Heat the oil and cook the onion until soft, about 3 minutes.", "Add tomato and spices and cook 2 minutes.", "Add the spinach and stir until wilted.", "Pour in the beaten eggs and stir gently on medium-low heat until fully set.", "Serve hot with toast or roti."],
    tip: "Add a handful of extra vegetables to make the portion bigger without many more calories.",
    note: "Cook the eggs until firm, with no liquid egg left.",
  },
  {
    id: "paneer-bhurji", title: "Paneer bhurji", diet: "veg", allergens: ["dairy"], meals: ["breakfast", "lunch", "dinner"],
    minutes: 15, baseServings: 2, servingGrams: 150, perServing: { calories: 307, protein: 19, carbohydrates: 8, fat: 23 },
    tags: ["paneer", "high protein", "indian", "quick"],
    ingredients: [I(200, "g", "paneer, crumbled"), I(100, "g", "onion, chopped"), I(100, "g", "tomato, chopped"), I(1, "", "green chilli, chopped"), I(1, "tsp", "oil"),
      I(0.5, "tsp", "cumin seeds"), I(0.5, "tsp", "turmeric"), I(0.5, "tsp", "garam masala"), I(0, "", "salt and coriander")],
    steps: ["Heat the oil, add cumin, then the onion and chilli. Cook until soft.", "Add tomato, turmeric and salt. Cook until the tomato breaks down.", "Add the crumbled paneer and garam masala. Stir for 2 to 3 minutes.", "Garnish with coriander and serve with roti."],
    tip: "Low-fat paneer, or half paneer and half tofu, lowers the fat noticeably.",
  },
  {
    id: "chana-masala", title: "Chana masala", diet: "veg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 35, baseServings: 3, servingGrams: 300, perServing: { calories: 330, protein: 14, carbohydrates: 50, fat: 9 },
    tags: ["chickpeas", "chole", "indian", "high fibre"],
    ingredients: [I(450, "g", "cooked chickpeas (about 170 g dry, soaked and boiled)"), I(200, "g", "onion, chopped"), I(200, "g", "tomato, chopped"), I(1, "tbsp", "oil"),
      I(1, "tsp", "ginger-garlic paste"), I(1, "tsp", "cumin seeds"), I(1, "tsp", "coriander powder"), I(0.5, "tsp", "turmeric"), I(1, "tsp", "garam or chana masala"), I(150, "ml", "water"), I(0, "", "salt and lemon juice")],
    steps: ["Heat the oil, add cumin, then the onion. Cook until golden.", "Add ginger-garlic paste and cook 1 minute.", "Add tomato and the spices. Cook until the oil separates.", "Add chickpeas, water and salt. Simmer 15 minutes, mashing a few chickpeas to thicken.", "Finish with lemon juice and coriander."],
    tip: "Serve with salad and one roti instead of rice to keep carbs in check.",
  },
  {
    id: "veg-oats-upma", title: "Vegetable oats upma", diet: "veg", allergens: ["gluten"], meals: ["breakfast"],
    minutes: 15, baseServings: 2, servingGrams: 250, perServing: { calories: 280, protein: 9, carbohydrates: 46, fat: 7 },
    tags: ["oats", "breakfast", "quick", "fibre"],
    ingredients: [I(120, "g", "rolled oats"), I(1, "tsp", "oil"), I(1, "tsp", "mustard seeds"), I(100, "g", "onion, chopped"), I(100, "g", "carrot, grated"), I(50, "g", "green peas"),
      I(1, "", "green chilli, chopped"), I(8, "", "curry leaves"), I(300, "ml", "water"), I(0, "", "salt and lemon juice")],
    steps: ["Dry-roast the oats for 2 minutes and set aside.", "Heat the oil, add mustard seeds and curry leaves, then onion, chilli, carrot and peas. Cook 4 minutes.", "Add water and salt and bring to a boil.", "Stir in the oats and cook 2 to 3 minutes until thick.", "Finish with lemon juice."],
    tip: "Stir in a spoon of curd or serve with a boiled egg to raise the protein.",
    note: "Oats can be cross-contaminated with gluten. Check the label if you avoid it.",
  },
  {
    id: "grilled-chicken-veg", title: "Grilled chicken with vegetables", diet: "nonveg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 30, baseServings: 2, servingGrams: 300, perServing: { calories: 235, protein: 36, carbohydrates: 7, fat: 7 },
    tags: ["chicken", "high protein", "low carb", "grilled"],
    ingredients: [I(300, "g", "boneless chicken breast"), I(1, "tbsp", "lemon juice"), I(1, "tsp", "ginger-garlic paste"), I(0.5, "tsp", "chilli powder or paprika"), I(0.5, "tsp", "black pepper"),
      I(1, "tsp", "oil"), I(200, "g", "mixed vegetables (capsicum, broccoli, zucchini)"), I(0, "", "salt, to taste")],
    steps: ["Mix chicken with lemon juice, ginger-garlic paste, spices and salt. Marinate at least 15 minutes.", "Heat a grill pan with half the oil. Cook the chicken 5 to 6 minutes per side.", "Rest the chicken 3 minutes, then slice.", "Saute the vegetables in the remaining oil for 4 to 5 minutes.", "Serve together."],
    tip: "Slice thick breasts in half horizontally so they cook evenly and stay juicy.",
    note: "Cook chicken until there is no pink inside and the thickest part reaches 75 °C.",
  },
  {
    id: "tofu-stir-fry", title: "Tofu vegetable stir-fry", diet: "veg", allergens: ["soy", "gluten"], meals: ["lunch", "dinner"],
    minutes: 15, baseServings: 2, servingGrams: 250, perServing: { calories: 205, protein: 18, carbohydrates: 11, fat: 12 },
    tags: ["tofu", "vegan", "high protein", "quick"],
    ingredients: [I(200, "g", "firm tofu, cubed"), I(1, "tsp", "oil"), I(200, "g", "mixed vegetables, sliced"), I(1, "tbsp", "soy sauce"), I(1, "tsp", "ginger-garlic paste"), I(1, "tsp", "lime juice or vinegar"), I(0.5, "tsp", "black pepper"), I(0, "", "spring onion, to garnish")],
    steps: ["Pat the tofu dry and pan-sear it in the oil until golden on most sides. Set aside.", "In the same pan, cook ginger-garlic paste 30 seconds, then add the vegetables. Stir-fry 3 to 4 minutes on high heat.", "Return the tofu, add soy sauce, pepper and lime juice. Toss 1 minute.", "Garnish with spring onion."],
    tip: "Soy sauce is salty, so taste before adding extra salt.",
    note: "Soy sauce usually contains gluten. Use tamari if you avoid it.",
  },
  {
    id: "veg-khichdi", title: "Vegetable khichdi", diet: "veg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 30, baseServings: 2, servingGrams: 350, perServing: { calories: 345, protein: 13, carbohydrates: 65, fat: 4 },
    tags: ["rice", "dal", "comfort", "indian", "one pot"],
    ingredients: [I(80, "g", "rice"), I(80, "g", "split moong dal"), I(100, "g", "carrot, diced"), I(50, "g", "green peas"), I(1, "tsp", "oil"), I(0.5, "tsp", "cumin seeds"), I(0.5, "tsp", "turmeric"), I(1, "tsp", "grated ginger"), I(600, "ml", "water"), I(0, "", "salt, to taste")],
    steps: ["Rinse the rice and dal together.", "Heat the oil, add cumin and ginger, then the vegetables. Cook 2 minutes.", "Add rice, dal, turmeric, salt and water.", "Cook until everything is soft and porridge-like, about 20 minutes (3 to 4 whistles in a cooker).", "Serve with curd or a salad."],
    tip: "Use brown rice for more fibre, and cook it a little longer.",
  },
  {
    id: "besan-chilla", title: "Besan chilla", diet: "veg", allergens: [], meals: ["breakfast", "snack"],
    minutes: 20, baseServings: 2, servingGrams: 200, perServing: { calories: 265, protein: 12, carbohydrates: 34, fat: 9 },
    tags: ["besan", "gram flour", "breakfast", "indian", "pancake"],
    ingredients: [I(100, "g", "besan (gram flour)"), I(150, "ml", "water, approximately"), I(100, "g", "onion, chopped"), I(100, "g", "tomato, chopped"), I(1, "", "green chilli, chopped"), I(0.5, "tsp", "cumin seeds"), I(0.5, "tsp", "turmeric"), I(2, "tsp", "oil, for cooking"), I(0, "", "salt and coriander")],
    steps: ["Whisk besan with water, spices and salt into a smooth, pourable batter.", "Stir in onion, tomato, chilli and coriander.", "Heat a non-stick pan with a little oil. Pour a ladle of batter and spread thin.", "Cook 2 to 3 minutes per side until golden.", "Serve with mint chutney or curd."],
    tip: "A non-stick pan lets you use less oil without sticking.",
  },
  {
    id: "baked-salmon", title: "Lemon herb baked salmon", diet: "nonveg", allergens: ["fish"], meals: ["dinner", "lunch"],
    minutes: 25, baseServings: 2, servingGrams: 250, perServing: { calories: 365, protein: 32, carbohydrates: 7, fat: 21 },
    tags: ["fish", "salmon", "omega 3", "high protein", "baked"],
    ingredients: [I(300, "g", "salmon fillets (two pieces)"), I(1, "", "lemon, sliced"), I(2, "", "garlic cloves, minced"), I(1, "tsp", "oil"), I(1, "tsp", "dried mixed herbs"), I(0.5, "tsp", "black pepper"), I(200, "g", "green beans or broccoli"), I(0, "", "salt, to taste")],
    steps: ["Heat the oven to 200 °C.", "Place the salmon and vegetables on a lined tray. Rub with oil, garlic, herbs, pepper and salt, and top with lemon slices.", "Bake 12 to 15 minutes until the salmon flakes easily.", "Serve with the vegetables."],
    tip: "Any firm fish works if salmon is too expensive. Calories will usually be lower.",
    note: "Fish is cooked when the centre is opaque and flakes with a fork.",
  },
  {
    id: "rajma", title: "Rajma (kidney bean curry)", diet: "veg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 40, baseServings: 3, servingGrams: 300, perServing: { calories: 275, protein: 13, carbohydrates: 43, fat: 6 },
    tags: ["rajma", "kidney beans", "indian", "high fibre"],
    ingredients: [I(450, "g", "cooked kidney beans (about 170 g dry, soaked and boiled)"), I(200, "g", "onion, chopped"), I(200, "g", "tomato, chopped"), I(1, "tbsp", "oil"), I(1, "tsp", "ginger-garlic paste"), I(1, "tsp", "cumin seeds"), I(1, "tsp", "coriander powder"), I(0.5, "tsp", "turmeric"), I(1, "tsp", "garam masala"), I(200, "ml", "water"), I(0, "", "salt, to taste")],
    steps: ["Heat the oil, add cumin and onion. Cook until golden.", "Add ginger-garlic paste, then tomato and spices. Cook until soft and oily at the edges.", "Add beans, water and salt. Simmer 20 minutes, mashing a few beans to thicken.", "Serve with rice or roti."],
    tip: "Boil dried beans fully until very soft. Undercooked kidney beans can upset your stomach.",
  },
  {
    id: "yogurt-fruit-bowl", title: "Greek yogurt fruit and almond bowl", diet: "veg", allergens: ["dairy", "nuts"], meals: ["breakfast", "snack"],
    minutes: 5, baseServings: 1, servingGrams: 280, perServing: { calories: 290, protein: 17, carbohydrates: 31, fat: 13 },
    tags: ["yogurt", "curd", "no cook", "quick", "fruit"],
    ingredients: [I(150, "g", "plain Greek yogurt"), I(100, "g", "banana, sliced"), I(10, "g", "almonds, chopped"), I(0, "", "cinnamon, optional")],
    steps: ["Spoon the yogurt into a bowl.", "Top with banana and almonds.", "Sprinkle cinnamon if you like."],
    tip: "Use seasonal fruit such as apple, papaya or berries. Choose unsweetened yogurt.",
  },
  {
    id: "sprouts-chaat", title: "Sprouts chaat", diet: "veg", allergens: ["nuts"], meals: ["snack"],
    minutes: 10, baseServings: 1, servingGrams: 220, perServing: { calories: 180, protein: 11, carbohydrates: 22, fat: 5 },
    tags: ["sprouts", "moong", "snack", "light", "indian", "no cook"],
    ingredients: [I(150, "g", "moong sprouts, steamed or boiled until tender"), I(50, "g", "onion, chopped"), I(100, "g", "tomato, chopped"), I(50, "g", "cucumber, chopped"), I(10, "g", "roasted peanuts"), I(1, "tsp", "lemon juice"), I(0.5, "tsp", "chaat masala"), I(0, "", "green chilli, coriander and salt")],
    steps: ["Steam or boil the sprouts for 5 to 8 minutes until tender.", "Mix with onion, tomato and cucumber.", "Add lemon juice, chaat masala, chilli and salt.", "Top with peanuts and coriander just before eating."],
    tip: "Raw sprouts can carry bacteria, so cook them lightly, especially for children or pregnancy.",
  },
];

const FRAC: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾" };
export function formatAmount(n: number): string {
  if (n >= 100) return String(Math.round(n / 5) * 5);
  if (n >= 10) return String(Math.round(n));
  const q = Math.max(0.25, Math.round(n * 4) / 4);
  const whole = Math.floor(q), f = FRAC[q - whole];
  return whole ? (f ? `${whole}${f}` : String(whole)) : f;
}
export function formatIngredient(i: Ingredient, factor: number): string {
  const a = i.amount > 0 ? formatAmount(i.amount * factor) : "";
  return [a, i.unit, i.name].filter(Boolean).join(" ");
}

export const dietLabel = (d: RecipeDiet) => (d === "veg" ? "Vegetarian" : d === "egg" ? "Contains egg" : "Non-vegetarian");

export function isAllowed(r: Recipe, diet: DietFilter, avoid: Allergen[]): boolean {
  if (diet === "veg" && r.diet !== "veg") return false;
  if (diet === "egg" && r.diet === "nonveg") return false;
  return !r.allergens.some((a) => avoid.includes(a));
}

const haystackTags = (r: Recipe) =>
  [...r.tags, r.perServing.protein >= 18 ? "high protein" : "", r.perServing.calories <= 220 ? "light low calorie" : "",
    r.minutes <= 20 ? "quick" : "", r.diet === "veg" ? "vegetarian veg" : r.diet === "egg" ? "egg" : "non-veg"].join(" ").toLowerCase();

/** Match words against title (3), tags (2) and ingredients (1). Empty query returns the pool unchanged. */
export function searchRecipes(query: string, pool: Recipe[], meal: MealType | "all"): Recipe[] {
  const byMeal = pool.filter((r) => meal === "all" || r.meals.includes(meal));
  const tokens = query.toLowerCase().split(/[^a-z]+/).filter((t) => t.length > 1)
    .map((t) => (t.length > 3 ? t.replace(/oes$/, "o").replace(/s$/, "") : t));
  if (!tokens.length) return byMeal;
  return byMeal.map((r) => {
    const title = r.title.toLowerCase(), tags = haystackTags(r), ing = r.ingredients.map((i) => i.name.toLowerCase()).join(" ");
    const score = tokens.reduce((s, t) => s + (title.includes(t) ? 3 : 0) + (tags.includes(t) ? 2 : 0) + (ing.includes(t) ? 1 : 0), 0);
    return { r, score };
  }).filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (tokens.includes("protein") ? b.r.perServing.protein - a.r.perServing.protein : 0)).map((x) => x.r);
}