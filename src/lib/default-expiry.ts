/**
 * Default expiry days for common food items
 * Based on Indian food safety standards & IS 4751 guidelines where applicable.
 * @note VALUES ARE CONSERVATIVE ESTIMATES FOR INDIAN CLIMATE
 * @note -1 indicates UNSAFE/NOT RECOMMENDED storage condition
 */

export const DEFAULT_EXPIRY_DAYS: Record<string, {
  refrigerated: number;
  room_temp: number;
  frozen?: number;
}> = {
  // --- DAIRY (High Risk) ---
  "milk": { refrigerated: 3, room_temp: -1 }, // Assumed opened/pasteurized
  "milk (opened)": { refrigerated: 3, room_temp: -1 },
  "milk (tetra pack/unopened)": { refrigerated: 7, room_temp: 1 }, // Once opened, becomes 3
  "curd": { refrigerated: 5, room_temp: -1 },
  "dahi": { refrigerated: 5, room_temp: -1 },
  "yogurt": { refrigerated: 7, room_temp: -1 }, // Preservative-free household dahi expires faster
  "paneer": { refrigerated: 5, room_temp: -1, frozen: 30 },
  "loose paneer": { refrigerated: 3, room_temp: -1 },
  "cheese": { refrigerated: 21, room_temp: -1, frozen: 90 },
  "butter": { refrigerated: 30, room_temp: 7, frozen: 90 },
  "ghee": { refrigerated: 365, room_temp: 180 }, // Pantry safe
  "cream": { refrigerated: 3, room_temp: -1 },
  "malai": { refrigerated: 3, room_temp: -1 },

  // --- COOKED FOOD (Strict 3-4 Days Max) ---
  "cooked rice": { refrigerated: 3, room_temp: -1, frozen: 30 },
  "cooked dal": { refrigerated: 3, room_temp: -1, frozen: 30 },
  "cooked sabzi": { refrigerated: 3, room_temp: -1, frozen: 30 },
  "roti (cooked)": { refrigerated: 3, room_temp: 1, frozen: 30 },
  "chapati (cooked)": { refrigerated: 3, room_temp: 1, frozen: 30 },
  "leftover": { refrigerated: 3, room_temp: -1 },
  "gravy": { refrigerated: 3, room_temp: -1, frozen: 30 },
  "curry": { refrigerated: 3, room_temp: -1, frozen: 30 },
  "idli batter": { refrigerated: 4, room_temp: -1 },
  "dosa batter": { refrigerated: 4, room_temp: -1 },

  // --- VEGETABLES (Conservative Indian household estimates) ---
  "tomato": { refrigerated: 5, room_temp: 2 },
  "potato": { refrigerated: 14, room_temp: 10 }, // Fridging alters taste but safe
  "onion": { refrigerated: 14, room_temp: 14 }, // Moisture in fridge can rot them
  "carrot": { refrigerated: 7, room_temp: 3 },
  "cucumber": { refrigerated: 4, room_temp: 1 },
  "capsicum": { refrigerated: 5, room_temp: 2 },
  "bell pepper": { refrigerated: 5, room_temp: 2 },
  "spinach": { refrigerated: 3, room_temp: -1 }, // Wilts fast in heat
  "palak": { refrigerated: 3, room_temp: -1 },
  "coriander": { refrigerated: 4, room_temp: 1 },
  "kothimbir": { refrigerated: 4, room_temp: 1 },
  "dhania": { refrigerated: 4, room_temp: 1 },
  "mint": { refrigerated: 4, room_temp: 1 },
  "pudina": { refrigerated: 4, room_temp: 1 },
  "lettuce": { refrigerated: 5, room_temp: 1 },
  "cabbage": { refrigerated: 7, room_temp: 2 },
  "cauliflower": { refrigerated: 5, room_temp: 2 },
  "broccoli": { refrigerated: 4, room_temp: 1 },
  "beetroot": { refrigerated: 10, room_temp: 4 },
  "radish": { refrigerated: 7, room_temp: 2 },
  "ginger": { refrigerated: 14, room_temp: 7 },
  "garlic": { refrigerated: 30, room_temp: 21 },
  "green chili": { refrigerated: 7, room_temp: 3 },
  "hari mirch": { refrigerated: 7, room_temp: 3 },
  "eggplant": { refrigerated: 4, room_temp: 2 },
  "brinjal": { refrigerated: 4, room_temp: 2 },
  "baingan": { refrigerated: 4, room_temp: 2 },
  "okra": { refrigerated: 4, room_temp: 2 },
  "bhindi": { refrigerated: 4, room_temp: 2 },
  "peas": { refrigerated: 3, room_temp: 1, frozen: 180 },
  "matar": { refrigerated: 3, room_temp: 1, frozen: 180 },
  "beans": { refrigerated: 5, room_temp: 2 },
  "mushroom": { refrigerated: 3, room_temp: -1 }, // unsafe at room temp
  "corn": { refrigerated: 3, room_temp: 1, frozen: 90 },
  "sweet potato": { refrigerated: 14, room_temp: 7 },
  "pumpkin": { refrigerated: 7, room_temp: 4 },

  // --- FRUITS ---
  "apple": { refrigerated: 21, room_temp: 5 },
  "seb": { refrigerated: 21, room_temp: 5 },
  "banana": { refrigerated: 3, room_temp: 3 }, // Blackens in fridge
  "kela": { refrigerated: 3, room_temp: 3 },
  "mango": { refrigerated: 5, room_temp: 3 },
  "aam": { refrigerated: 5, room_temp: 3 },
  "grapes": { refrigerated: 5, room_temp: 2 },
  "angoor": { refrigerated: 5, room_temp: 2 },
  "orange": { refrigerated: 14, room_temp: 5 },
  "santra": { refrigerated: 14, room_temp: 5 },
  "lemon": { refrigerated: 21, room_temp: 7 },
  "nimbu": { refrigerated: 21, room_temp: 7 },
  "papaya": { refrigerated: 4, room_temp: 2 },
  "watermelon": { refrigerated: 5, room_temp: -1 }, // Cut watermelon unsafe at room temp
  "pomegranate": { refrigerated: 10, room_temp: 5 },
  "anaar": { refrigerated: 10, room_temp: 5 },
  "strawberry": { refrigerated: 2, room_temp: -1 },
  "pineapple": { refrigerated: 4, room_temp: 2 },

  // --- MEAT & FISH (Strict Safety) ---
  "chicken": { refrigerated: 2, room_temp: -1, frozen: 90 },
  "mutton": { refrigerated: 3, room_temp: -1, frozen: 90 },
  "fish": { refrigerated: 2, room_temp: -1, frozen: 60 },
  "machli": { refrigerated: 2, room_temp: -1, frozen: 60 },
  "prawns": { refrigerated: 2, room_temp: -1, frozen: 60 },
  "eggs": { refrigerated: 21, room_temp: 7 }, // Salmonella risk in summer
  "ande": { refrigerated: 21, room_temp: 7 },

  // --- RAW/DRY GRAINS (Long shelf life if kept dry) ---
  "rice": { refrigerated: 365, room_temp: 365 },
  "chawal": { refrigerated: 365, room_temp: 365 },
  "dal": { refrigerated: 365, room_temp: 365 },
  "moong dal": { refrigerated: 365, room_temp: 365 },
  "toor dal": { refrigerated: 365, room_temp: 365 },
  "wheat flour": { refrigerated: 90, room_temp: 45 }, // Atta gets bugs
  "atta": { refrigerated: 90, room_temp: 45 },
  "maida": { refrigerated: 180, room_temp: 90 },
  "besan": { refrigerated: 180, room_temp: 60 },
  "pasta": { refrigerated: 365, room_temp: 365 },
  "bread": { refrigerated: 5, room_temp: 2 }, // Mold risk high in humidity

  // --- CONDIMENTS ---
  "ketchup": { refrigerated: 180, room_temp: 30 }, // Opened should be fridged
  "sauce": { refrigerated: 90, room_temp: 30 },
  "pickle": { refrigerated: 365, room_temp: 365 },
  "achar": { refrigerated: 365, room_temp: 365 },
  "jam": { refrigerated: 180, room_temp: 30 },
  "honey": { refrigerated: 365, room_temp: 365 },
};

/**
 * Category mapping for intelligent defaults
 * Safe defaults only.
 */
const CATEGORY_DEFAULTS: Record<string, { refrigerated: number; room_temp: number; frozen?: number }> = {
  "vegetables": { refrigerated: 5, room_temp: 2 },
  "fruits": { refrigerated: 5, room_temp: 2 },
  "dairy": { refrigerated: 3, room_temp: -1 }, // Conservative default
  "meat": { refrigerated: 1, room_temp: -1, frozen: 60 },
  "grains": { refrigerated: 90, room_temp: 60 },
  "cooked": { refrigerated: 3, room_temp: -1, frozen: 30 },
  "condiments": { refrigerated: 60, room_temp: 30 },
  "other": { refrigerated: 3, room_temp: 1 },
};

/**
 * Get default expiry date for a product
 */
export function getDefaultExpiryDate(
  productName: string,
  storageType: 'refrigerator' | 'room_temp' | 'freezer',
  category?: string
): Date {
  const days = getDefaultExpiryDays(productName, storageType, category);
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days); // if days is -1, date becomes yesterday
  return expiry;
}

/**
 * Get default expiry days (as number)
 * Returns -1 if storage type is unsafe
 */
export function getDefaultExpiryDays(
  productName: string,
  storageType: 'refrigerator' | 'room_temp' | 'freezer',
  category?: string
): number {
  const normalized = productName.toLowerCase().trim();

  // 1. Exact Match
  let match = DEFAULT_EXPIRY_DAYS[normalized];

  // 2. Partial Match
  if (!match) {
    for (const [key, value] of Object.entries(DEFAULT_EXPIRY_DAYS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        // Prioritize "cooked" prefix if user input has it (e.g. "cooked rice" matches "rice" key? No, "cooked rice" key exists)
        // Ensure broad keys don't shadow specific keys.
        // But since we iterate object entries, order is not guaranteed.
        // Better: Find best match by length?
        // Simple iteration usually works if keys are distinct.
        match = value;
        break;
      }
    }
  }

  // 3. Category Fallback
  if (!match && category) {
    match = CATEGORY_DEFAULTS[category];
  }

  // 4. Final Fallback (Safe defaults)
  if (!match) {
    return storageType === 'freezer' ? 30 :
      storageType === 'refrigerator' ? 3 : -1; // Unknown at room temp = unsafe
  }

  // Value Extraction logic
  if (storageType === 'freezer') {
    // DO NOT fallback to refrigerated if frozen is missing.
    return match.frozen !== undefined ? match.frozen : -1;
  }

  if (storageType === 'refrigerator') {
    return match.refrigerated;
  }

  // room_temp
  return match.room_temp;
}

/**
 * Format expiry date for display
 */
export function formatExpiryDisplay(days: number): string {
  if (days === -1) return "Unsafe storage!";
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  if (days < 7) return `in ${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  const months = Math.floor(days / 30);
  return `in ${months} ${months === 1 ? 'month' : 'months'}`;
}
