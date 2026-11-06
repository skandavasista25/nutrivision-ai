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
/** Round to a step, never to zero (zero would mean "to taste"). */
const q = (x: number, step: number) => Math.max(step, Math.round(x / step) * step);

// Shared building blocks for South Indian plates, scaled to `n` servings.
const rice = (n: number, rawG = 55): Ingredient[] => [I(q(rawG * n, 5), "g", "rice (cooked until soft, about 150 g cooked per serving)")];
const sambar = (n: number, ml = 200): Ingredient[] => {
  const f = (n * ml) / 200;
  return [I(q(20 * f, 5), "g", "toor dal"), I(q(80 * f, 10), "g", "mixed vegetables (drumstick, carrot, brinjal, onion)"), I(q(1 * f, 0.5), "tsp", "tamarind pulp"),
    I(q(0.75 * f, 0.25), "tsp", "sambar powder"), I(q(0.5 * f, 0.25), "tsp", "oil"), I(q(0.5 * f, 0.25), "tsp", "mustard seeds"), I(q(3 * f, 1), "", "curry leaves"), I(0, "", "turmeric and salt, to taste")];
};
const chutney = (n: number): Ingredient[] => [I(q(15 * n, 5), "g", "grated coconut"), I(q(5 * n, 5), "g", "roasted gram (pottukadalai)"), I(q(0.5 * n, 0.5), "", "green chilli"), I(0, "", "salt, to taste")];
const poriyal = (n: number, veg: string): Ingredient[] => [I(q(80 * n, 10), "g", `${veg}, finely chopped`), I(q(5 * n, 5), "g", "grated coconut"), I(q(0.5 * n, 0.25), "tsp", "oil"), I(q(0.5 * n, 0.25), "tsp", "mustard seeds")];

const S_RICE = "Cook the rice until soft.";
const S_SAMBAR = "Sambar: pressure-cook the toor dal with turmeric until soft and mash it. Simmer the vegetables with tamarind pulp and sambar powder until tender, add the dal and boil 5 minutes. Temper with mustard seeds and curry leaves in the oil.";
const S_CHUTNEY = "Coconut chutney: grind the coconut, roasted gram, green chilli and salt with a little water into a thick paste.";
const S_PORIYAL = (veg: string) => `Poriyal: heat the oil, crackle the mustard seeds, add the ${veg} with a splash of water and salt, cook covered until tender, then stir in the coconut.`;
const SA = "south indian";

// Curated library, mostly South Indian plates. Nutrition per serving is an approximate estimate for typical home cooking
// (moderate oil). Real values change with oil, portion and brand. Check against IFCT or a dietitian for precision.
export const RECIPES: Recipe[] = [
  {
    id: "idli-sambar", title: "Idli with sambar and coconut chutney (3 idlis)", diet: "veg", allergens: [], meals: ["breakfast", "dinner"],
    minutes: 45, baseServings: 2, servingGrams: 300, perServing: { calories: 305, protein: 10, carbohydrates: 48, fat: 8 },
    tags: [SA, "idly", "tiffin", "steamed", "vegan", "breakfast"],
    ingredients: [I(250, "g", "idli batter (ready-made, or fermented overnight)"), ...sambar(2, 150), ...chutney(2)],
    steps: ["Grease the idli plates lightly and pour in the batter.", "Steam for 10 to 12 minutes until a toothpick comes out clean. Rest 2 minutes before removing.", S_SAMBAR, S_CHUTNEY, "Serve 3 idlis per person with sambar and chutney."],
    tip: "Steaming uses no oil, which makes idli one of the lighter tiffins. Extra sambar adds protein and vegetables.",
  },
  {
    id: "dosa-sambar", title: "Plain dosa with sambar and chutney (2 dosas)", diet: "veg", allergens: [], meals: ["breakfast", "dinner"],
    minutes: 45, baseServings: 2, servingGrams: 380, perServing: { calories: 405, protein: 12, carbohydrates: 58, fat: 13 },
    tags: [SA, "dosai", "dose", "tiffin", "crepe", "vegan"],
    ingredients: [I(250, "g", "dosa batter (ready-made, or fermented overnight)"), I(2, "tsp", "oil, for cooking"), ...sambar(2, 150), ...chutney(2)],
    steps: ["Heat a flat tawa and wipe it with a little oil.", "Pour a ladle of batter and spread it thin in a circle. Drizzle a few drops of oil around the edge.", "Cook until golden and crisp, about 2 minutes. No need to flip.", S_SAMBAR, S_CHUTNEY, "Serve 2 dosas per person."],
    tip: "A well-seasoned or non-stick tawa lets you use less oil.",
  },
  {
    id: "masala-dosa", title: "Masala dosa with sambar and chutney", diet: "veg", allergens: [], meals: ["breakfast", "dinner"],
    minutes: 50, baseServings: 2, servingGrams: 330, perServing: { calories: 375, protein: 11, carbohydrates: 52, fat: 14 },
    tags: [SA, "dosai", "potato", "tiffin", "vegan"],
    ingredients: [I(125, "g", "dosa batter"), I(1, "tsp", "oil, for the dosas"), I(200, "g", "potatoes, boiled and roughly mashed"), I(50, "g", "onion, sliced"), I(1, "tsp", "oil, for the filling"),
      I(0.5, "tsp", "mustard seeds"), I(6, "", "curry leaves"), I(0.5, "tsp", "turmeric"), I(1, "", "green chilli"), ...sambar(2, 150), ...chutney(2)],
    steps: ["Filling: crackle mustard seeds in oil, add curry leaves, chilli and onion, and cook until soft. Add turmeric, the potatoes and salt, and mix.", "Make 1 thin dosa per person as in the plain dosa recipe.", "Place the filling in the middle and fold.", S_SAMBAR, S_CHUTNEY],
    tip: "Keep the filling light on oil. Most of the calories come from oil, not the potato.",
  },
  {
    id: "ven-pongal", title: "Ven pongal with sambar", diet: "veg", allergens: ["dairy", "nuts"], meals: ["breakfast", "lunch"],
    minutes: 30, baseServings: 2, servingGrams: 250, perServing: { calories: 340, protein: 11, carbohydrates: 53, fat: 10 },
    tags: [SA, "pongali", "rice", "moong", "tiffin", "tamil"],
    ingredients: [I(80, "g", "raw rice"), I(40, "g", "split moong dal"), I(700, "ml", "water"), I(2, "tsp", "ghee"), I(10, "g", "cashews"), I(1, "tsp", "black pepper, crushed"), I(1, "tsp", "cumin seeds"),
      I(1, "tsp", "grated ginger"), I(8, "", "curry leaves"), I(0, "", "salt, to taste"), ...sambar(2, 100)],
    steps: ["Dry-roast the moong dal for 2 minutes. Rinse it with the rice.", "Pressure-cook the rice and dal with the water and salt until very soft and mushy, about 4 whistles. Mash lightly.", "Heat the ghee, fry the cashews, pepper, cumin, ginger and curry leaves, and pour over the pongal.", S_SAMBAR],
    tip: "Use 1 teaspoon of ghee per person. It carries the flavour, so you don't need more.",
  },
  {
    id: "rava-upma", title: "Vegetable rava upma", diet: "veg", allergens: ["gluten", "nuts"], meals: ["breakfast"],
    minutes: 20, baseServings: 2, servingGrams: 220, perServing: { calories: 250, protein: 6, carbohydrates: 38, fat: 8 },
    tags: [SA, "upma", "semolina", "suji", "tiffin", "quick", "karnataka"],
    ingredients: [I(80, "g", "rava (semolina)"), I(2, "tsp", "oil"), I(1, "tsp", "mustard seeds"), I(1, "tsp", "chana dal"), I(10, "g", "peanuts"), I(80, "g", "onion, chopped"), I(50, "g", "carrot, diced"), I(40, "g", "green peas"),
      I(1, "", "green chilli"), I(1, "tsp", "grated ginger"), I(8, "", "curry leaves"), I(500, "ml", "water"), I(0, "", "salt and lemon juice")],
    steps: ["Dry-roast the rava until fragrant. Set aside.", "Heat the oil, add mustard seeds, chana dal and peanuts until golden. Add chilli, ginger, curry leaves and onion, and cook 3 minutes.", "Add the vegetables, water and salt and bring to a boil.", "Lower the heat, stir in the rava slowly to avoid lumps, cover and cook 3 minutes.", "Finish with lemon juice."],
    tip: "Add more vegetables and fewer peanuts to keep it light and filling.",
  },
  {
    id: "adai", title: "Adai (mixed lentil dosa) with coconut chutney", diet: "veg", allergens: [], meals: ["breakfast", "dinner"],
    minutes: 30, baseServings: 2, servingGrams: 280, perServing: { calories: 395, protein: 14, carbohydrates: 58, fat: 11 },
    tags: [SA, "lentil", "dosa", "high protein", "tamil", "kerala", "tiffin"],
    ingredients: [I(60, "g", "raw rice"), I(40, "g", "toor dal"), I(40, "g", "chana dal"), I(20, "g", "urad dal"), I(3, "", "dried red chillies"), I(50, "g", "onion, chopped"), I(8, "", "curry leaves"), I(2, "tsp", "oil, for cooking"), I(0, "", "salt and a pinch of asafoetida"), ...chutney(2)],
    steps: ["Soak the rice and dals with the chillies for 4 hours. Grind coarsely with salt and asafoetida into a thick batter.", "Stir in the onion and curry leaves.", "Spread a ladle of batter thick on a hot tawa. Drizzle a little oil around it.", "Cook on both sides until golden and crisp.", S_CHUTNEY],
    tip: "Adai has more protein than regular dosa because of the mixed dals.",
  },
  {
    id: "ragi-mudde", title: "Ragi mudde with sambar", diet: "veg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 35, baseServings: 2, servingGrams: 350, perServing: { calories: 285, protein: 9, carbohydrates: 54, fat: 4 },
    tags: [SA, "ragi sangati", "finger millet", "millet", "karnataka", "vegan", "high fibre"],
    ingredients: [I(110, "g", "ragi (finger millet) flour"), I(500, "ml", "water"), I(0, "", "salt, to taste"), ...sambar(2, 200)],
    steps: ["Boil the water with salt in a heavy pot.", "Add the ragi flour in the centre, cover and cook on low for 2 minutes. Do not stir yet.", "Stir and mash vigorously with a wooden spatula until smooth and dough-like, adding a splash of water if dry.", "With wet hands, shape into balls (1 per serving).", S_SAMBAR, "Break off small pieces of mudde and eat with the sambar. Don't chew it too much, just swallow."],
    tip: "Ragi is a good source of fibre and calcium. Many people eat 2 balls, so use the servings control.",
  },
  {
    id: "sambar-rice-plate", title: "Rice with sambar, beans poriyal and curd", diet: "veg", allergens: ["dairy"], meals: ["lunch"],
    minutes: 50, baseServings: 2, servingGrams: 450, perServing: { calories: 415, protein: 14, carbohydrates: 67, fat: 10 },
    tags: [SA, "meals", "sambar sadam", "thali", "poriyal", "tamil", "karnataka"],
    ingredients: [...rice(2), ...sambar(2, 200), ...poriyal(2, "French beans"), I(200, "g", "plain curd")],
    steps: [S_RICE, S_SAMBAR, S_PORIYAL("beans"), "Serve the rice with sambar and poriyal, with curd on the side."],
    tip: "Fill half the plate with vegetables (sambar and poriyal) and keep the rice to about a cup.",
  },
  {
    id: "rasam-rice", title: "Rasam rice with cabbage poriyal", diet: "veg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 35, baseServings: 2, servingGrams: 430, perServing: { calories: 295, protein: 8, carbohydrates: 54, fat: 5 },
    tags: [SA, "rasam sadam", "saaru anna", "charu", "light", "vegan", "tamil", "andhra"],
    ingredients: [...rice(2), I(120, "g", "tomato, chopped"), I(1, "tbsp", "tamarind pulp"), I(1, "tsp", "rasam powder"), I(4, "", "garlic cloves, crushed"), I(0.5, "tsp", "black pepper, crushed"), I(1, "tsp", "cumin seeds"),
      I(60, "ml", "cooked toor dal water"), I(1, "tsp", "oil"), I(1, "tsp", "mustard seeds"), I(8, "", "curry leaves"), I(500, "ml", "water"), I(0, "", "salt and coriander"), ...poriyal(2, "cabbage")],
    steps: [S_RICE, "Rasam: boil the tomato, tamarind, rasam powder, salt and water for 8 minutes. Add the dal water and crushed garlic, pepper and cumin, and bring just to a froth.", "Temper mustard seeds and curry leaves in the oil and pour over the rasam. Add coriander.", S_PORIYAL("cabbage"), "Mix the rice with rasam and serve with the poriyal."],
    tip: "A light, easy-to-digest meal. Add a boiled egg or a bowl of curd if you need more protein.",
  },
  {
    id: "curd-rice", title: "Curd rice (thayir sadam)", diet: "veg", allergens: ["dairy"], meals: ["lunch", "dinner"],
    minutes: 15, baseServings: 2, servingGrams: 300, perServing: { calories: 270, protein: 7, carbohydrates: 41, fat: 9 },
    tags: [SA, "thayir sadam", "mosaru anna", "perugu annam", "curd", "yogurt", "light", "quick"],
    ingredients: [I(90, "g", "raw rice, cooked until very soft"), I(200, "g", "plain curd"), I(60, "ml", "milk"), I(2, "tsp", "oil"), I(1, "tsp", "mustard seeds"), I(1, "tsp", "urad dal"), I(1, "", "green chilli"), I(1, "tsp", "grated ginger"), I(8, "", "curry leaves"), I(0, "", "salt and coriander")],
    steps: [S_RICE + " Mash it while warm and let it cool.", "Mix in the curd, milk and salt.", "Heat the oil, crackle the mustard seeds, then add urad dal, chilli, ginger and curry leaves. Pour over the rice and mix.", "Garnish with coriander."],
    tip: "Add grated carrot or cucumber for crunch and fibre. It's a good light dinner.",
  },
  {
    id: "lemon-rice", title: "Lemon rice (chitranna)", diet: "veg", allergens: ["nuts"], meals: ["lunch"],
    minutes: 20, baseServings: 2, servingGrams: 220, perServing: { calories: 290, protein: 7, carbohydrates: 42, fat: 10 },
    tags: [SA, "chitranna", "elumichai sadam", "rice", "karnataka", "quick"],
    ingredients: [I(100, "g", "raw rice, cooked and cooled"), I(3, "tsp", "oil"), I(1, "tsp", "mustard seeds"), I(2, "tsp", "chana dal"), I(20, "g", "peanuts"), I(2, "", "green chillies"), I(8, "", "curry leaves"), I(0.5, "tsp", "turmeric"), I(2, "tbsp", "lemon juice"), I(0, "", "salt, to taste")],
    steps: [S_RICE + " Spread it out to cool.", "Heat the oil, add mustard seeds, chana dal and peanuts until golden. Add chillies, curry leaves and turmeric.", "Turn off the heat, add the lemon juice and salt, and mix in the rice gently."],
    tip: "Pair it with a bowl of curd or a boiled egg to add protein.",
  },
  {
    id: "bisi-bele-bath", title: "Bisi bele bath", diet: "veg", allergens: ["dairy"], meals: ["lunch", "dinner"],
    minutes: 45, baseServings: 2, servingGrams: 320, perServing: { calories: 390, protein: 12, carbohydrates: 61, fat: 11 },
    tags: [SA, "bisibelebath", "karnataka", "one pot", "rice", "dal", "sambar rice"],
    ingredients: [I(80, "g", "raw rice"), I(60, "g", "toor dal"), I(200, "g", "mixed vegetables (carrot, beans, peas)"), I(1, "tbsp", "tamarind pulp"), I(2, "tbsp", "bisi bele bath powder"), I(2, "tsp", "ghee"),
      I(1, "tsp", "mustard seeds"), I(8, "", "curry leaves"), I(0.5, "tsp", "turmeric"), I(900, "ml", "water"), I(0, "", "salt, to taste")],
    steps: ["Pressure-cook the rice, dal, vegetables and turmeric with the water until very soft.", "Add tamarind pulp, bisi bele bath powder and salt. Simmer 10 minutes until thick, adding water to keep it porridge-like.", "Heat the ghee, crackle mustard seeds and curry leaves, and pour over."],
    tip: "It's a complete one-pot meal. Serve with cucumber raita instead of fried boondi or papad to keep it light.",
  },
  {
    id: "pepper-chicken-rice", title: "Pepper chicken fry with rice", diet: "nonveg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 35, baseServings: 2, servingGrams: 330, perServing: { calories: 395, protein: 37, carbohydrates: 37, fat: 9 },
    tags: [SA, "chicken", "chettinad", "chicken milagu", "high protein", "dry fry"],
    ingredients: [I(300, "g", "boneless chicken, small pieces"), I(120, "g", "onion, sliced"), I(2, "tsp", "oil"), I(2, "tsp", "black pepper, freshly crushed"), I(2, "tsp", "ginger-garlic paste"), I(0.5, "tsp", "turmeric"),
      I(1, "tsp", "fennel seeds"), I(10, "", "curry leaves"), I(1, "tbsp", "lemon juice"), I(0, "", "salt, to taste"), I(80, "g", "raw rice, cooked as usual")],
    steps: ["Marinate the chicken with ginger-garlic paste, turmeric, salt and half the pepper for 15 minutes.", "Heat the oil, add fennel and curry leaves, then the onion until golden.", "Add the chicken and cook covered on medium-low, stirring now and then, until cooked through and dry, about 15 minutes.", "Add the remaining pepper and lemon juice. Serve with rice."],
    tip: "Using skinless breast pieces and just 1 teaspoon of oil per person keeps the dish high in protein and low in fat.",
    note: "Cook chicken until there is no pink inside and the thickest piece reaches 75 °C.",
  },
  {
    id: "fish-curry-rice", title: "Fish curry (meen kuzhambu) with rice", diet: "nonveg", allergens: ["fish"], meals: ["lunch", "dinner"],
    minutes: 40, baseServings: 2, servingGrams: 400, perServing: { calories: 450, protein: 28, carbohydrates: 50, fat: 15 },
    tags: [SA, "meen curry", "meen kuzhambu", "fish kulambu", "kerala", "tamil", "seafood"],
    ingredients: [I(240, "g", "fish steaks (seer, rohu or any firm fish)"), I(40, "g", "grated coconut"), I(1, "tbsp", "tamarind pulp"), I(100, "g", "tomato, chopped"), I(80, "g", "onion, chopped"), I(2, "tsp", "oil"),
      I(1, "tsp", "chilli powder"), I(2, "tsp", "coriander powder"), I(0.5, "tsp", "turmeric"), I(1, "tsp", "mustard seeds"), I(8, "", "curry leaves"), I(0, "", "salt, to taste"), I(110, "g", "raw rice, cooked as usual")],
    steps: ["Grind the coconut with a little water into a smooth paste.", "Heat the oil, crackle mustard seeds and curry leaves, then add the onion and tomato until soft.", "Add chilli, coriander, turmeric, tamarind pulp, salt and 300 ml water. Simmer 8 minutes.", "Add the coconut paste and fish. Simmer gently, without stirring much, for 8 to 10 minutes until the fish is cooked.", "Serve with rice."],
    tip: "Oily fish like mackerel and sardine give omega-3 fats, so there's no need to fry the fish.",
    note: "Fish is done when it turns opaque and flakes easily.",
  },
  {
    id: "keerai-masiyal-rice", title: "Keerai masiyal (spinach dal) with rice", diet: "veg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 30, baseServings: 2, servingGrams: 350, perServing: { calories: 350, protein: 11, carbohydrates: 62, fat: 6 },
    tags: [SA, "keerai", "greens", "palak", "spinach", "tamil", "iron", "vegan"],
    ingredients: [I(200, "g", "keerai (spinach or amaranth greens), chopped"), I(50, "g", "split moong dal"), I(4, "", "garlic cloves"), I(1, "tsp", "cumin seeds"), I(2, "tsp", "oil"), I(1, "", "green chilli"), I(0, "", "salt, to taste"), I(110, "g", "raw rice, cooked as usual")],
    steps: ["Pressure-cook the moong dal until very soft.", "Cook the greens with the chilli and a splash of water until tender, about 5 minutes. Mash coarsely with the dal.", "Heat the oil, add cumin and sliced garlic until golden, and stir into the masiyal with salt.", "Serve with rice."],
    tip: "Squeeze a little lemon on top. The vitamin C helps your body absorb the iron from greens.",
  },
  {
    id: "chapati-kurma", title: "Chapati with vegetable kurma (2 chapatis)", diet: "veg", allergens: ["gluten"], meals: ["dinner"],
    minutes: 40, baseServings: 2, servingGrams: 320, perServing: { calories: 400, protein: 11, carbohydrates: 54, fat: 16 },
    tags: [SA, "chappathi", "roti", "kurma", "korma", "coconut", "dinner", "tamil", "kerala"],
    ingredients: [I(140, "g", "whole wheat flour"), I(250, "g", "mixed vegetables (carrot, beans, peas, potato)"), I(80, "g", "onion, chopped"), I(80, "g", "tomato, chopped"), I(40, "g", "grated coconut"), I(1, "tbsp", "roasted gram"),
      I(1, "tsp", "ginger-garlic paste"), I(2, "", "green chillies"), I(2, "tsp", "oil"), I(8, "", "curry leaves"), I(0.5, "tsp", "turmeric"), I(0, "", "salt, to taste")],
    steps: ["Knead the flour with water and salt into a soft dough. Rest 15 minutes, then roll into 4 chapatis and cook on a hot tawa until brown spots appear.", "Grind the coconut, roasted gram and chillies into a smooth paste.", "Heat the oil, cook the onion, ginger-garlic paste and tomato. Add the vegetables, turmeric, salt and a little water, and cook until tender.", "Stir in the coconut paste and simmer 5 minutes.", "Serve with the chapatis."],
    tip: "Cook the chapatis without oil. The coconut in the kurma already adds fat.",
  },
  {
    id: "chickpea-sundal", title: "Chickpea sundal", diet: "veg", allergens: [], meals: ["snack"],
    minutes: 20, baseServings: 2, servingGrams: 130, perServing: { calories: 220, protein: 10, carbohydrates: 28, fat: 9 },
    tags: [SA, "kondakadalai sundal", "chana sundal", "chickpeas", "snack", "high protein", "vegan"],
    ingredients: [I(200, "g", "boiled chickpeas (about 80 g dry, soaked overnight and boiled)"), I(20, "g", "grated coconut"), I(1, "tsp", "oil"), I(1, "tsp", "mustard seeds"), I(1, "tsp", "urad dal"), I(2, "", "dried red chillies"), I(8, "", "curry leaves"), I(0, "", "asafoetida and salt")],
    steps: ["Heat the oil, crackle the mustard seeds, then add urad dal, chillies, curry leaves and asafoetida.", "Add the boiled chickpeas and salt and toss for 2 minutes.", "Stir in the coconut and serve warm."],
    tip: "A filling evening snack that has more protein and fibre than fried snacks.",
    note: "Dried chickpeas must be soaked and boiled until fully soft.",
  },
  {
    id: "ragi-malt", title: "Ragi malt (ragi porridge drink)", diet: "veg", allergens: ["dairy"], meals: ["breakfast", "snack"],
    minutes: 10, baseServings: 1, servingGrams: 190, perServing: { calories: 180, protein: 6, carbohydrates: 26, fat: 5 },
    tags: [SA, "ragi java", "finger millet", "ragi kanji", "millet", "drink", "quick"],
    ingredients: [I(20, "g", "ragi flour"), I(100, "ml", "water"), I(150, "ml", "milk"), I(5, "g", "jaggery"), I(0, "", "a pinch of cardamom")],
    steps: ["Mix the ragi flour with the water into a smooth paste.", "Cook on low heat, stirring, for 4 to 5 minutes until it thickens and loses its raw smell.", "Add the milk, jaggery and cardamom and warm through. Serve hot."],
    tip: "Skip the jaggery or use less if you want to cut sugar.",
  },
  {
    id: "egg-bhurji-spinach", title: "Spinach egg bhurji, South Indian style", diet: "egg", allergens: ["egg"], meals: ["breakfast", "dinner"],
    minutes: 15, baseServings: 2, servingGrams: 200, perServing: { calories: 190, protein: 14, carbohydrates: 5, fat: 12 },
    tags: [SA, "eggs", "muttai", "scrambled", "quick", "high protein"],
    ingredients: [I(4, "", "eggs"), I(100, "g", "spinach, chopped"), I(100, "g", "onion, chopped"), I(100, "g", "tomato, chopped"), I(1, "tsp", "oil"), I(0.5, "tsp", "mustard seeds"), I(8, "", "curry leaves"), I(1, "", "green chilli"), I(0.5, "tsp", "turmeric"), I(0, "", "salt, to taste")],
    steps: ["Heat the oil, crackle the mustard seeds, then add curry leaves, chilli and onion. Cook until soft.", "Add tomato and turmeric and cook 2 minutes. Add the spinach until wilted.", "Pour in the beaten eggs and stir gently on medium-low heat until fully set.", "Serve with chapati, dosa or rice."],
    tip: "Add extra vegetables to make a bigger plate without many more calories.",
    note: "Cook the eggs until firm, with no liquid egg left.",
  },
  {
    id: "veg-oats-upma", title: "Vegetable oats upma", diet: "veg", allergens: ["gluten"], meals: ["breakfast"],
    minutes: 15, baseServings: 2, servingGrams: 250, perServing: { calories: 280, protein: 9, carbohydrates: 46, fat: 7 },
    tags: [SA, "oats", "upma", "breakfast", "quick", "fibre"],
    ingredients: [I(120, "g", "rolled oats"), I(1, "tsp", "oil"), I(1, "tsp", "mustard seeds"), I(100, "g", "onion, chopped"), I(100, "g", "carrot, grated"), I(50, "g", "green peas"), I(1, "", "green chilli, chopped"), I(8, "", "curry leaves"), I(300, "ml", "water"), I(0, "", "salt and lemon juice")],
    steps: ["Dry-roast the oats for 2 minutes and set aside.", "Heat the oil, add mustard seeds and curry leaves, then onion, chilli, carrot and peas. Cook 4 minutes.", "Add water and salt and bring to a boil.", "Stir in the oats and cook 2 to 3 minutes until thick.", "Finish with lemon juice."],
    tip: "Stir in a spoon of curd or serve with a boiled egg to raise the protein.",
    note: "Oats can be cross-contaminated with gluten. Check the label if you avoid it.",
  },
  {
    id: "paneer-bhurji", title: "Paneer bhurji", diet: "veg", allergens: ["dairy"], meals: ["breakfast", "lunch", "dinner"],
    minutes: 15, baseServings: 2, servingGrams: 150, perServing: { calories: 307, protein: 19, carbohydrates: 8, fat: 23 },
    tags: ["paneer", "high protein", "indian", "quick"],
    ingredients: [I(200, "g", "paneer, crumbled"), I(100, "g", "onion, chopped"), I(100, "g", "tomato, chopped"), I(1, "", "green chilli, chopped"), I(1, "tsp", "oil"), I(0.5, "tsp", "cumin seeds"), I(0.5, "tsp", "turmeric"), I(0.5, "tsp", "garam masala"), I(0, "", "salt and coriander")],
    steps: ["Heat the oil, add cumin, then the onion and chilli. Cook until soft.", "Add tomato, turmeric and salt. Cook until the tomato breaks down.", "Add the crumbled paneer and garam masala. Stir for 2 to 3 minutes.", "Garnish with coriander and serve with chapati."],
    tip: "Low-fat paneer, or half paneer and half tofu, lowers the fat noticeably.",
  },
  {
    id: "grilled-chicken-veg", title: "Grilled chicken with vegetables", diet: "nonveg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 30, baseServings: 2, servingGrams: 300, perServing: { calories: 235, protein: 36, carbohydrates: 7, fat: 7 },
    tags: ["chicken", "high protein", "low carb", "grilled"],
    ingredients: [I(300, "g", "boneless chicken breast"), I(1, "tbsp", "lemon juice"), I(1, "tsp", "ginger-garlic paste"), I(0.5, "tsp", "chilli powder or paprika"), I(0.5, "tsp", "black pepper"), I(1, "tsp", "oil"), I(200, "g", "mixed vegetables (capsicum, broccoli, beans)"), I(0, "", "salt, to taste")],
    steps: ["Mix chicken with lemon juice, ginger-garlic paste, spices and salt. Marinate at least 15 minutes.", "Heat a grill pan with half the oil. Cook the chicken 5 to 6 minutes per side.", "Rest the chicken 3 minutes, then slice.", "Saute the vegetables in the remaining oil for 4 to 5 minutes.", "Serve together, with rice or chapati if you need more energy."],
    tip: "Slice thick breasts in half horizontally so they cook evenly and stay juicy.",
    note: "Cook chicken until there is no pink inside and the thickest part reaches 75 °C.",
  },
  {
    id: "moong-dal-tadka", title: "Moong dal tadka", diet: "veg", allergens: [], meals: ["lunch", "dinner"],
    minutes: 30, baseServings: 2, servingGrams: 300, perServing: { calories: 295, protein: 18, carbohydrates: 49, fat: 4 },
    tags: ["dal", "lentil", "indian", "high fibre", "paruppu"],
    ingredients: [I(150, "g", "split yellow moong dal"), I(450, "ml", "water"), I(0.5, "tsp", "turmeric"), I(100, "g", "tomato, chopped"), I(1, "tsp", "oil"), I(1, "tsp", "cumin seeds"), I(3, "", "garlic cloves, sliced"), I(1, "", "dried red chilli"), I(0, "", "salt, to taste"), I(0, "", "coriander and lemon juice, to finish")],
    steps: ["Rinse the dal until the water runs mostly clear.", "Cook the dal with water, turmeric, tomato and salt until soft (about 3 pressure-cooker whistles, or 25 minutes simmering). Mash lightly.", "Heat the oil in a small pan. Add cumin until it sputters, then the garlic and chilli until golden.", "Pour the tempering over the dal and stir.", "Finish with coriander and lemon. Serve with rice or chapati."],
    tip: "Ghee instead of oil tastes richer but adds calories, so measure it with a teaspoon.",
  },
  {
    id: "yogurt-fruit-bowl", title: "Curd or Greek yogurt with banana and almonds", diet: "veg", allergens: ["dairy", "nuts"], meals: ["breakfast", "snack"],
    minutes: 5, baseServings: 1, servingGrams: 280, perServing: { calories: 290, protein: 17, carbohydrates: 31, fat: 13 },
    tags: ["yogurt", "curd", "no cook", "quick", "fruit"],
    ingredients: [I(150, "g", "plain Greek yogurt (or thick curd)"), I(100, "g", "banana, sliced"), I(10, "g", "almonds, chopped"), I(0, "", "cinnamon, optional")],
    steps: ["Spoon the yogurt into a bowl.", "Top with banana and almonds.", "Sprinkle cinnamon if you like."],
    tip: "Use seasonal fruit such as papaya, guava or apple. Choose unsweetened yogurt. Ordinary thick curd has less protein than Greek yogurt.",
  },
  {
    id: "sprouts-chaat", title: "Sprouts salad (moong sprouts)", diet: "veg", allergens: ["nuts"], meals: ["snack"],
    minutes: 10, baseServings: 1, servingGrams: 220, perServing: { calories: 180, protein: 11, carbohydrates: 22, fat: 5 },
    tags: ["sprouts", "moong", "snack", "light", "indian", "no cook", "salad"],
    ingredients: [I(150, "g", "moong sprouts, steamed or boiled until tender"), I(50, "g", "onion, chopped"), I(100, "g", "tomato, chopped"), I(50, "g", "cucumber, chopped"), I(10, "g", "roasted peanuts"), I(1, "tsp", "lemon juice"), I(0.5, "tsp", "chaat masala"), I(0, "", "green chilli, coriander and salt")],
    steps: ["Steam or boil the sprouts for 5 to 8 minutes until tender.", "Mix with onion, tomato and cucumber.", "Add lemon juice, chaat masala, chilli and salt.", "Top with peanuts and coriander just before eating."],
    tip: "Raw sprouts can carry bacteria, so cook them lightly, especially for children or during pregnancy.",
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