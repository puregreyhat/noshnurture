export type Ingredient = { name: string; amount?: string };
export type RecipeSuggestion = {
  id: string;
  title: string;
  image?: string;
  totalTime: number; // minutes
  ingredients: Ingredient[];
  usedIngredients: string[];
  missingIngredients: string[];
  instructions: string[];
  score: number;
  cuisine?: string; // e.g., "Indian", "Italian", "East Asian"
  diet?: string; // "Vegetarian" or "Non-Vegetarian"
  matchedIngredientCount?: number; // Number of ingredients you have
  totalIngredientCount?: number; // Total ingredients needed
};

export type Pantry = {
  expiring: Set<string>;
  available: Set<string>;
};

export const AROMATICS = new Set([
  "onion",
  "garlic",
  "ginger",
  "spring onion",
]);

export const HERBS = new Set([
  "coriander",
  "mint",
  "parsley",
  "basil",
]);

export const VEG = new Set([
  "tomato", "onion", "garlic", "ginger", "potato", "carrot", "cabbage", "cauliflower", "spinach", "lettuce", "broccoli", "bell pepper", "capsicum", "chili", "green chili", "pea", "green pea", "okra", "eggplant", "zucchini", "cucumber", "beetroot", "radish", "mushroom", "corn", "sweet corn",
]);

export const PROTEIN = new Set([
  "egg", "chicken", "paneer", "tofu", "chickpea", "lentil", "dal", "rajma", "kidney bean", "black bean", "fish", "prawn", "shrimp",
]);

export const CARB = new Set([
  "rice", "bread", "pasta", "noodles", "poha", "vermicelli", "quinoa", "oats",
]);

export const STAPLES = new Set([
  "salt", "sugar", "oil", "olive oil", "mustard oil", "turmeric", "chili powder", "garam masala", "cumin", "coriander powder", "soy sauce", "vinegar", "lemon", "lime", "butter",
]);

export type TemplateContext = {
  pantry: Pantry;
  titleHint?: string;
};

// Helpers to pick items by role
export function pickOne(set: Set<string>, pantry: Pantry): string | null {
  for (const i of pantry.available) {
    if (set.has(i)) return i;
  }
  return null;
}

export function pickMany(set: Set<string>, pantry: Pantry, max = 2): string[] {
  const out: string[] = [];
  for (const i of pantry.available) {
    if (set.has(i)) out.push(i);
    if (out.length >= max) break;
  }
  return out;
}

export function scoreByUsage(pantry: Pantry, used: string[]): number {
  // score: 3 per expiring used + 1 per available used
  let score = 0;
  for (const u of used) {
    if (pantry.expiring.has(u)) score += 3;
    else if (pantry.available.has(u)) score += 1;
  }
  return score;
}

// Template: Indian-style curry
export function curryTemplate(ctx: TemplateContext): RecipeSuggestion | null {
  const { pantry } = ctx;
  const aromatic = pickOne(AROMATICS, pantry) || "onion";
  const baseTomato = pantry.available.has("tomato") ? "tomato" : null;
  const vegs = pickMany(VEG, pantry, 2);
  const prot = pickOne(PROTEIN, pantry);
  if (!baseTomato && vegs.length === 0 && !prot) return null;

  const used = [aromatic, baseTomato, ...vegs, prot].filter(Boolean) as string[];
  const ingredients: Ingredient[] = [
    { name: aromatic, amount: "1 medium, chopped" },
    ...(baseTomato ? [{ name: "tomato", amount: "2, chopped" } as Ingredient] : []),
    ...vegs.map(v => ({ name: v, amount: "2 cups, chopped" })),
    ...(prot ? [{ name: prot, amount: prot === "egg" ? "2" : "200 g" } as Ingredient] : []),
    { name: "oil", amount: "2 tbsp" },
    { name: "garam masala", amount: "1 tsp" },
    { name: "turmeric", amount: "1/2 tsp" },
    { name: "cumin", amount: "1 tsp" },
    { name: "salt", amount: "to taste" },
    { name: "water", amount: "1–2 cups" },
  ];
  const instructions = [
    `Heat oil, sauté ${aromatic}.`,
    baseTomato ? `Add tomato, cook until soft.` : `Proceed to spices.`,
    `Add spices (garam masala, turmeric, cumin).`,
    vegs.length ? `Add ${vegs.join(", ")} and cook 3–5 min.` : `Skip veg step if none.`,
    prot ? `Add ${prot} and simmer with water 8–12 min.` : `Add water and simmer 8–10 min.`,
    `Adjust salt; garnish with cilantro if available.`,
  ];

  return {
    id: `curry-${used.join("-")}`,
    title: `${(prot || vegs[0] || "Vegetable").toString().replace(/^./, c => c.toUpperCase())} Curry`,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop",
    totalTime: 25,
    ingredients,
    usedIngredients: used,
    missingIngredients: Array.from(STAPLES).filter(s => !pantry.available.has(s)),
    instructions,
    score: scoreByUsage(pantry, used),
    cuisine: "Indian",
    diet: ["chicken", "egg", "fish", "prawn", "shrimp", "mutton"].includes(prot || "") ? "Non-Vegetarian" : "Vegetarian",
    matchedIngredientCount: used.length,
    totalIngredientCount: ingredients.length,
  };
}

// Template: Stir-fry
export function stirFryTemplate(ctx: TemplateContext): RecipeSuggestion | null {
  const { pantry } = ctx;
  const arom = pickOne(AROMATICS, pantry) || "garlic";
  const vegs = pickMany(VEG, pantry, 3);
  const prot = pickOne(PROTEIN, pantry);
  const carb = pantry.available.has("rice") ? "rice" : pantry.available.has("noodles") ? "noodles" : null;
  if (!vegs.length && !prot) return null;

  const used = [arom, ...vegs, prot, carb].filter(Boolean) as string[];
  const ingredients: Ingredient[] = [
    { name: arom, amount: "2 cloves, minced" },
    ...vegs.map(v => ({ name: v, amount: "2 cups, sliced" })),
    ...(prot ? [{ name: prot, amount: "200 g" } as Ingredient] : []),
    ...(carb ? [{ name: carb, amount: carb === "rice" ? "2 cups cooked" : "200 g" } as Ingredient] : []),
    { name: "oil", amount: "2 tbsp" },
    { name: "soy sauce", amount: "1–2 tbsp" },
    { name: "vinegar", amount: "1 tsp" },
    { name: "salt", amount: "to taste" },
  ];
  const instructions = [
    `Heat oil on high, stir-fry ${arom} 30s.`,
    vegs.length ? `Add ${vegs.join(", ")} and toss 3–4 min.` : `Skip veg step if none.`,
    prot ? `Add ${prot} and cook until done.` : `Skip protein if none.`,
    carb ? `Add ${carb}, then soy sauce and vinegar; toss 1–2 min.` : `Season and serve.`,
  ];

  return {
    id: `stirfry-${used.join("-")}`,
    title: `${(carb || "Veg").toString().replace(/^./, c => c.toUpperCase())} Stir-Fry`,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop",
    totalTime: 20,
    ingredients,
    usedIngredients: used,
    missingIngredients: ["soy sauce"].filter(s => !pantry.available.has(s)),
    instructions,
    score: scoreByUsage(pantry, used),
    cuisine: "East Asian",
    matchedIngredientCount: used.length,
    totalIngredientCount: ingredients.length,
  };
}

// Template: Pasta
export function pastaTemplate(ctx: TemplateContext): RecipeSuggestion | null {
  const { pantry } = ctx;
  if (!pantry.available.has("pasta")) return null;
  const arom = pantry.available.has("garlic") ? "garlic" : "onion";
  const tomato = pantry.available.has("tomato") ? "tomato" : null;
  const herb = pantry.available.has("basil") ? "basil" : pantry.available.has("cilantro") ? "cilantro" : null;
  const used = ["pasta", arom, tomato, herb].filter(Boolean) as string[];

  const ingredients: Ingredient[] = [
    { name: "pasta", amount: "200 g" },
    { name: arom, amount: "2 cloves, minced" },
    ...(tomato ? [{ name: "tomato", amount: "3, chopped" } as Ingredient] : []),
    ...(herb ? [{ name: herb, amount: "few leaves" } as Ingredient] : []),
    { name: "oil", amount: "2 tbsp" },
    { name: "salt", amount: "to taste" },
    { name: "black pepper", amount: "to taste" },
  ];
  const instructions = [
    "Boil pasta until al dente.",
    `Sauté ${arom} in oil; ${tomato ? "add tomato and cook down." : "add pepper."}`,
    "Toss pasta with sauce; season and garnish with herbs.",
  ];

  return {
    id: `pasta-${used.join("-")}`,
    title: `Simple Tomato Pasta`,
    image: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2a389?w=800&auto=format&fit=crop",
    totalTime: 25,
    ingredients,
    usedIngredients: used,
    missingIngredients: [],
    instructions,
    score: scoreByUsage({ expiring: pantry.expiring, available: pantry.available }, used),
    cuisine: "Italian",
    diet: "Vegetarian",
    matchedIngredientCount: used.length,
    totalIngredientCount: ingredients.length,
  };
}

// Template: Omelet
export function omeletTemplate(ctx: TemplateContext): RecipeSuggestion | null {
  const { pantry } = ctx;
  if (!pantry.available.has("egg")) return null;
  const vegs = pickMany(VEG, pantry, 2);
  const used = ["egg", ...vegs];
  const ingredients: Ingredient[] = [
    { name: "egg", amount: "2–3" },
    ...vegs.map(v => ({ name: v, amount: "1/2 cup, chopped" })),
    { name: "salt", amount: "to taste" },
    { name: "black pepper", amount: "to taste" },
    { name: "oil", amount: "1 tbsp" },
  ];
  const instructions = [
    "Beat eggs with salt and pepper.",
    vegs.length ? `Sauté ${vegs.join(", ")}.` : "Skip veg step.",
    "Pour eggs, cook until set; fold and serve.",
  ];
  return {
    id: `omelet-${used.join("-")}`,
    title: `Veg Omelet`,
    image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&auto=format&fit=crop",
    totalTime: 10,
    ingredients,
    usedIngredients: used,
    missingIngredients: [],
    instructions,
    score: scoreByUsage(pantry, used),
    cuisine: "International",
    matchedIngredientCount: used.length,
    totalIngredientCount: ingredients.length,
  };
}

// Template: Fried Rice
export function friedRiceTemplate(ctx: TemplateContext): RecipeSuggestion | null {
  const { pantry } = ctx;
  if (!pantry.available.has("rice")) return null;
  const vegs = pickMany(VEG, pantry, 3);
  const egg = pantry.available.has("egg") ? "egg" : null;
  const soy = pantry.available.has("soy sauce") ? "soy sauce" : null;
  const used = ["rice", ...vegs, egg, soy].filter(Boolean) as string[];
  const ingredients: Ingredient[] = [
    { name: "rice", amount: "2 cups cooked" },
    ...vegs.map(v => ({ name: v, amount: "1 cup, diced" })),
    ...(egg ? [{ name: "egg", amount: "2" } as Ingredient] : []),
    { name: "oil", amount: "2 tbsp" },
    { name: "salt", amount: "to taste" },
    ...(soy ? [{ name: "soy sauce", amount: "1–2 tbsp" } as Ingredient] : []),
  ];
  const instructions = [
    "Heat oil, add veg and sauté.",
    egg ? "Scramble egg on side, mix in." : "Skip egg step.",
    soy ? "Add rice and soy sauce; toss." : "Add rice; season and toss.",
  ];
  return {
    id: `friedrice-${used.join("-")}`,
    title: `Veg Fried Rice`,
    image: "https://images.unsplash.com/photo-1498579150354-ea3a22475763?w=800&auto=format&fit=crop",
    totalTime: 15,
    ingredients,
    usedIngredients: used,
    missingIngredients: [],
    instructions,
    score: scoreByUsage(pantry, used),
    cuisine: "East Asian",
    matchedIngredientCount: used.length,
    totalIngredientCount: ingredients.length,
  };
}

// Template: Fresh Salad
export function saladTemplate(ctx: TemplateContext): RecipeSuggestion | null {
  const { pantry } = ctx;
  const greens = pantry.available.has("lettuce") ? "lettuce" : pantry.available.has("spinach") ? "spinach" : null;
  const vegs = ["tomato", "cucumber", "bell pepper"].filter(v => pantry.available.has(v));
  if (!greens && vegs.length < 2) return null;
  const used = [greens, ...vegs].filter(Boolean) as string[];
  const ingredients: Ingredient[] = [
    ...(greens ? [{ name: greens, amount: "2 cups, chopped" } as Ingredient] : []),
    ...vegs.map(v => ({ name: v, amount: "1 cup, chopped" })),
    { name: "olive oil", amount: "2 tbsp" },
    { name: "vinegar", amount: "1 tbsp" },
    { name: "salt", amount: "to taste" },
    { name: "black pepper", amount: "to taste" },
  ];
  const instructions = [
    "Combine greens and chopped vegetables in a bowl.",
    "Whisk olive oil, vinegar, salt, and pepper.",
    "Toss dressing with salad and serve immediately.",
  ];
  return {
    id: `salad-${used.join("-")}`,
    title: `Fresh Garden Salad`,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop",
    totalTime: 10,
    ingredients,
    usedIngredients: used,
    missingIngredients: [],
    instructions,
    score: scoreByUsage(pantry, used),
    cuisine: "International",
    matchedIngredientCount: used.length,
    totalIngredientCount: ingredients.length,
  };
}

// Template: Simple Soup
export function soupTemplate(ctx: TemplateContext): RecipeSuggestion | null {
  const { pantry } = ctx;
  const arom = pantry.available.has("onion") ? "onion" : pantry.available.has("garlic") ? "garlic" : null;
  const base = pantry.available.has("tomato") ? "tomato" : pantry.available.has("carrot") ? "carrot" : null;
  if (!arom && !base) return null;
  const used = [arom, base].filter(Boolean) as string[];
  const ingredients: Ingredient[] = [
    ...(arom ? [{ name: arom, amount: "1 small, chopped" } as Ingredient] : []),
    ...(base ? [{ name: base, amount: "2 cups, chopped" } as Ingredient] : []),
    { name: "salt", amount: "to taste" },
    { name: "black pepper", amount: "to taste" },
    { name: "water", amount: "3 cups" },
  ];
  const instructions = [
    arom ? `Sauté ${arom} in a little oil.` : "Bring water to a simmer.",
    base ? `Add ${base} and water; simmer 12–15 min.` : "Simmer 10–12 min.",
    "Season and blend (optional) for a smooth soup.",
  ];
  return {
    id: `soup-${used.join("-")}`,
    title: `Comfort Soup`,
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop",
    totalTime: 20,
    ingredients,
    usedIngredients: used,
    missingIngredients: [],
    instructions,
    score: scoreByUsage(pantry, used),
    cuisine: "International",
    matchedIngredientCount: used.length,
    totalIngredientCount: ingredients.length,
  };
}

// Template: Wrap/Sandwich
export function wrapTemplate(ctx: TemplateContext): RecipeSuggestion | null {
  const { pantry } = ctx;
  const base = pantry.available.has("bread") ? "bread" : null;
  const prot = ["paneer", "tofu", "chicken", "egg"].find(p => pantry.available.has(p)) || null;
  const vegs = ["lettuce", "spinach", "tomato", "cucumber"].filter(v => pantry.available.has(v));
  if (!base || (!prot && vegs.length === 0)) return null;
  const used = [base, prot, ...vegs].filter(Boolean) as string[];
  const ingredients: Ingredient[] = [
    { name: base, amount: base === "bread" ? "4 slices" : "2 wraps" },
    ...(prot ? [{ name: prot, amount: "150 g" } as Ingredient] : []),
    ...vegs.map(v => ({ name: v, amount: "as needed" })),
    { name: "butter", amount: "1 tbsp (optional)" },
    { name: "salt", amount: "to taste" },
    { name: "black pepper", amount: "to taste" },
  ];
  const instructions = [
    "Warm or toast the base.",
    prot ? `Cook or slice ${prot}.` : "Skip protein step.",
    `Assemble with ${vegs.length ? vegs.join(", ") : "available veg"}, season, and serve.`,
  ];
  return {
    id: `wrap-${used.join("-")}`,
    title: `Quick Wrap/Sandwich`,
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop",
    totalTime: 12,
    ingredients,
    usedIngredients: used,
    missingIngredients: [],
    instructions,
    score: scoreByUsage(pantry, used),
    cuisine: "International",
    matchedIngredientCount: used.length,
    totalIngredientCount: ingredients.length,
  };
}

// Template: Oven Traybake
export function traybakeTemplate(ctx: TemplateContext): RecipeSuggestion | null {
  const { pantry } = ctx;
  const roots = ["potato", "carrot", "beetroot"].filter(v => pantry.available.has(v));
  const vegs = ["bell pepper", "onion", "broccoli", "cauliflower"].filter(v => pantry.available.has(v));
  if (roots.length + vegs.length < 2) return null;
  const used = [...roots, ...vegs].slice(0, 4);
  const ingredients: Ingredient[] = [
    ...used.map(v => ({ name: v, amount: "2 cups, chopped" })),
    { name: "oil", amount: "2 tbsp" },
    { name: "salt", amount: "to taste" },
    { name: "black pepper", amount: "to taste" },
  ];
  const instructions = [
    "Preheat oven to 200°C (390°F).",
    `Toss ${used.join(", ")} with oil, salt, and pepper.`,
    "Bake 20–30 min until tender and golden, tossing once.",
  ];
  return {
    id: `traybake-${used.join("-")}`,
    title: `Roasted Veg Traybake`,
    image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop",
    totalTime: 35,
    ingredients,
    usedIngredients: used,
    missingIngredients: [],
    instructions,
    score: scoreByUsage(pantry, used),
    cuisine: "European",
    diet: "Vegetarian",
    matchedIngredientCount: used.length,
    totalIngredientCount: ingredients.length,
  };
}

// Template: Smoothie
export function smoothieTemplate(ctx: TemplateContext): RecipeSuggestion | null {
  const { pantry } = ctx;
  const base = pantry.available.has("banana") ? "banana" : pantry.available.has("mango") ? "mango" : null;
  const dairy = pantry.available.has("milk") ? "milk" : pantry.available.has("yogurt") ? "yogurt" : null;
  if (!base || !dairy) return null;
  const used = [base, dairy];
  const ingredients: Ingredient[] = [
    { name: base, amount: "1" },
    { name: dairy, amount: "1 cup" },
    { name: "sugar", amount: "1 tsp (optional)" },
  ];
  const instructions = [
    `Blend ${base} with ${dairy} until smooth; sweeten to taste.`,
  ];
  return {
    id: `smoothie-${used.join("-")}`,
    title: `Quick ${base.charAt(0).toUpperCase() + base.slice(1)} Smoothie`,
    image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&auto=format&fit=crop",
    totalTime: 5,
    ingredients,
    usedIngredients: used,
    missingIngredients: [],
    instructions,
    score: scoreByUsage(pantry, used),
    cuisine: "International",
    matchedIngredientCount: used.length,
    totalIngredientCount: ingredients.length,
  };
}

export const TEMPLATES = [
  curryTemplate,
  stirFryTemplate,
  pastaTemplate,
  omeletTemplate,
  friedRiceTemplate,
  saladTemplate,
  soupTemplate,
  wrapTemplate,
  traybakeTemplate,
  smoothieTemplate,
];
