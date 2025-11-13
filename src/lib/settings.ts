export type AppSettings = {
  useSemanticNormalization: boolean;
  useLocalAIGenerator: boolean;
  // Whether to auto-fetch Vkart orders on scanner page load
  autoFetchVkartOrders: boolean;
  // Dietary preferences
  dietaryPreferences: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    ketogenic: boolean;
    paleo: boolean;
  };
  // Recipe filters
  recipeFilters: {
    maxCookingTime: number; // in minutes (0 = no limit)
    cuisine: string[]; // empty = all
    mealType: string[]; // empty = all (breakfast, lunch, dinner, snack, dessert)
  };
  // Which recipe source to use for suggestions
  // Note: Spoonacular provides full instructions & nutrition data but is deprecated
  // in this project due to API limits. Prefer our local `sugran` service.
  recipeSource?: 'spoonacular' | 'recipes-site' | 'sugran';
  // Expiry preferences
  expirySettings: {
    warningDays: number; // days before expiry to warn
    prioritizeExpiring: boolean; // prioritize recipes using expiring items
  };
};

const KEY = "nosh_settings_v1";

const defaults: AppSettings = {
  useSemanticNormalization: true,
  useLocalAIGenerator: false,
  autoFetchVkartOrders: false,
  dietaryPreferences: {
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    ketogenic: false,
    paleo: false,
  },
  recipeFilters: {
    maxCookingTime: 0, // no limit
    cuisine: [],
    mealType: [],
  },
  // NOTE: Spoonacular is deprecated for now; prefer our local Sugran service by default.
  // Spoonacular still has the most complete nutrition/instructions payloads, but
  // we avoid it to prevent external API limits. Use 'spoonacular' only if you
  // intentionally re-enable the external provider.
  recipeSource: 'sugran',
  expirySettings: {
    warningDays: 7,
    prioritizeExpiring: true,
  },
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed } as AppSettings;
  } catch {
    return defaults;
  }
}

export function saveSettings(next: Partial<AppSettings>) {
  if (typeof window === "undefined") return;
  const current = getSettings();
  const merged = { ...current, ...next };
  window.localStorage.setItem(KEY, JSON.stringify(merged));
}
