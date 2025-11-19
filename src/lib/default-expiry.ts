/**
 * Default expiry days for common food items
 * Based on USDA FoodKeeper guidelines and Indian food storage practices
 */

export const DEFAULT_EXPIRY_DAYS: Record<string, { 
  refrigerated: number; 
  room_temp: number;
  frozen?: number;
}> = {
  // Vegetables (Household fridge conditions)
  "tomato": { refrigerated: 5, room_temp: 2 },
  "potato": { refrigerated: 21, room_temp: 14 },
  "onion": { refrigerated: 30, room_temp: 21 },
  "carrot": { refrigerated: 14, room_temp: 3 },
  "cucumber": { refrigerated: 4, room_temp: 2 },
  "capsicum": { refrigerated: 5, room_temp: 2 },
  "bell pepper": { refrigerated: 5, room_temp: 2 },
  "spinach": { refrigerated: 3, room_temp: 1 },
  "palak": { refrigerated: 3, room_temp: 1 },
  "coriander": { refrigerated: 5, room_temp: 1 },
  "kothimbir": { refrigerated: 5, room_temp: 1 },
  "dhania": { refrigerated: 5, room_temp: 1 },
  "mint": { refrigerated: 5, room_temp: 1 },
  "pudina": { refrigerated: 5, room_temp: 1 },
  "lettuce": { refrigerated: 5, room_temp: 1 },
  "cabbage": { refrigerated: 10, room_temp: 3 },
  "cauliflower": { refrigerated: 5, room_temp: 2 },
  "broccoli": { refrigerated: 4, room_temp: 1 },
  "beetroot": { refrigerated: 14, room_temp: 5 },
  "radish": { refrigerated: 10, room_temp: 3 },
  "ginger": { refrigerated: 14, room_temp: 10 },
  "garlic": { refrigerated: 30, room_temp: 21 },
  "green chili": { refrigerated: 5, room_temp: 2 },
  "hari mirch": { refrigerated: 5, room_temp: 2 },
  "eggplant": { refrigerated: 5, room_temp: 2 },
  "brinjal": { refrigerated: 5, room_temp: 2 },
  "baingan": { refrigerated: 5, room_temp: 2 },
  "okra": { refrigerated: 3, room_temp: 1 },
  "bhindi": { refrigerated: 3, room_temp: 1 },
  "peas": { refrigerated: 3, room_temp: 1, frozen: 180 },
  "matar": { refrigerated: 3, room_temp: 1, frozen: 180 },
  "beans": { refrigerated: 4, room_temp: 2 },
  "mushroom": { refrigerated: 4, room_temp: 1 },
  "corn": { refrigerated: 3, room_temp: 2, frozen: 180 },
  "sweet potato": { refrigerated: 14, room_temp: 10 },
  "pumpkin": { refrigerated: 10, room_temp: 5 },
  
  // Dairy
  "milk": { refrigerated: 7, room_temp: 0 },
  "doodh": { refrigerated: 7, room_temp: 0 },
  "yogurt": { refrigerated: 14, room_temp: 0 },
  "dahi": { refrigerated: 14, room_temp: 0 },
  "curd": { refrigerated: 7, room_temp: 0 },
  "paneer": { refrigerated: 5, room_temp: 0, frozen: 60 },
  "cheese": { refrigerated: 21, room_temp: 0, frozen: 90 },
  "butter": { refrigerated: 30, room_temp: 7, frozen: 180 },
  "ghee": { refrigerated: 180, room_temp: 90 },
  "cream": { refrigerated: 7, room_temp: 0 },
  
  // Fruits
  "apple": { refrigerated: 30, room_temp: 7 },
  "seb": { refrigerated: 30, room_temp: 7 },
  "banana": { refrigerated: 7, room_temp: 5 },
  "kela": { refrigerated: 7, room_temp: 5 },
  "mango": { refrigerated: 7, room_temp: 3 },
  "aam": { refrigerated: 7, room_temp: 3 },
  "grapes": { refrigerated: 7, room_temp: 3 },
  "angoor": { refrigerated: 7, room_temp: 3 },
  "orange": { refrigerated: 14, room_temp: 7 },
  "santra": { refrigerated: 14, room_temp: 7 },
  "lemon": { refrigerated: 21, room_temp: 7 },
  "nimbu": { refrigerated: 21, room_temp: 7 },
  "papaya": { refrigerated: 7, room_temp: 3 },
  "watermelon": { refrigerated: 7, room_temp: 3 },
  "pomegranate": { refrigerated: 14, room_temp: 7 },
  "anaar": { refrigerated: 14, room_temp: 7 },
  "strawberry": { refrigerated: 5, room_temp: 1 },
  "pineapple": { refrigerated: 5, room_temp: 3 },
  
  // Meat & Fish
  "chicken": { refrigerated: 2, room_temp: 0, frozen: 180 },
  "mutton": { refrigerated: 3, room_temp: 0, frozen: 180 },
  "fish": { refrigerated: 2, room_temp: 0, frozen: 90 },
  "machli": { refrigerated: 2, room_temp: 0, frozen: 90 },
  "prawns": { refrigerated: 2, room_temp: 0, frozen: 90 },
  "eggs": { refrigerated: 28, room_temp: 7 },
  "ande": { refrigerated: 28, room_temp: 7 },
  
  // Bread & Grains
  "bread": { refrigerated: 7, room_temp: 3 },
  "roti": { refrigerated: 2, room_temp: 1 },
  "chapati": { refrigerated: 2, room_temp: 1 },
  "naan": { refrigerated: 3, room_temp: 1 },
  "rice": { refrigerated: 365, room_temp: 365 },
  "chawal": { refrigerated: 365, room_temp: 365 },
  "flour": { refrigerated: 180, room_temp: 90 },
  "atta": { refrigerated: 180, room_temp: 90 },
  "maida": { refrigerated: 180, room_temp: 90 },
  "besan": { refrigerated: 180, room_temp: 90 },
  "pasta": { refrigerated: 365, room_temp: 365 },
  
  // Pulses & Lentils
  "dal": { refrigerated: 365, room_temp: 365 },
  "moong dal": { refrigerated: 365, room_temp: 365 },
  "toor dal": { refrigerated: 365, room_temp: 365 },
  "masoor dal": { refrigerated: 365, room_temp: 365 },
  "chana dal": { refrigerated: 365, room_temp: 365 },
  "rajma": { refrigerated: 365, room_temp: 365 },
  "chickpeas": { refrigerated: 365, room_temp: 365 },
  
  // Condiments & Spices
  "ketchup": { refrigerated: 180, room_temp: 90 },
  "sauce": { refrigerated: 90, room_temp: 30 },
  "pickle": { refrigerated: 365, room_temp: 180 },
  "achar": { refrigerated: 365, room_temp: 180 },
  "jam": { refrigerated: 180, room_temp: 90 },
  "honey": { refrigerated: 365, room_temp: 365 },
};

/**
 * Category mapping for intelligent defaults
 */
const CATEGORY_DEFAULTS: Record<string, { refrigerated: number; room_temp: number; frozen?: number }> = {
  "vegetables": { refrigerated: 7, room_temp: 3 },
  "fruits": { refrigerated: 7, room_temp: 5 },
  "dairy": { refrigerated: 7, room_temp: 0 },
  "meat": { refrigerated: 2, room_temp: 0, frozen: 180 },
  "grains": { refrigerated: 180, room_temp: 90 },
  "pulses": { refrigerated: 365, room_temp: 365 },
  "condiments": { refrigerated: 90, room_temp: 30 },
  "other": { refrigerated: 7, room_temp: 3 },
};

/**
 * Get default expiry date for a product
 */
export function getDefaultExpiryDate(
  productName: string, 
  storageType: 'refrigerator' | 'room_temp' | 'freezer',
  category?: string
): Date {
  const normalized = productName.toLowerCase().trim();
  
  // Try exact match first
  const match = DEFAULT_EXPIRY_DAYS[normalized];
  
  if (match) {
    const days = storageType === 'freezer' ? (match.frozen || match.refrigerated) :
                 storageType === 'refrigerator' ? match.refrigerated : 
                 match.room_temp;
    
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(DEFAULT_EXPIRY_DAYS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      const days = storageType === 'freezer' ? (value.frozen || value.refrigerated) :
                   storageType === 'refrigerator' ? value.refrigerated : 
                   value.room_temp;
      
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);
      return expiry;
    }
  }
  
  // Use category-based default
  const categoryDefault = category ? CATEGORY_DEFAULTS[category] : null;
  if (categoryDefault) {
    const days = storageType === 'freezer' ? (categoryDefault.frozen || categoryDefault.refrigerated) :
                 storageType === 'refrigerator' ? categoryDefault.refrigerated : 
                 categoryDefault.room_temp;
    
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }
  
  // Final fallback
  const defaultDays = storageType === 'freezer' ? 90 : 
                     storageType === 'refrigerator' ? 7 : 3;
  
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + defaultDays);
  return expiry;
}

/**
 * Get default expiry days (as number)
 */
export function getDefaultExpiryDays(
  productName: string, 
  storageType: 'refrigerator' | 'room_temp' | 'freezer',
  category?: string
): number {
  const normalized = productName.toLowerCase().trim();
  const match = DEFAULT_EXPIRY_DAYS[normalized];
  
  if (match) {
    return storageType === 'freezer' ? (match.frozen || match.refrigerated) :
           storageType === 'refrigerator' ? match.refrigerated : 
           match.room_temp;
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(DEFAULT_EXPIRY_DAYS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return storageType === 'freezer' ? (value.frozen || value.refrigerated) :
             storageType === 'refrigerator' ? value.refrigerated : 
             value.room_temp;
    }
  }
  
  // Use category default
  const categoryDefault = category ? CATEGORY_DEFAULTS[category] : null;
  if (categoryDefault) {
    return storageType === 'freezer' ? (categoryDefault.frozen || categoryDefault.refrigerated) :
           storageType === 'refrigerator' ? categoryDefault.refrigerated : 
           categoryDefault.room_temp;
  }
  
  // Final fallback
  return storageType === 'freezer' ? 90 : 
         storageType === 'refrigerator' ? 7 : 3;
}

/**
 * Format expiry date for display
 */
export function formatExpiryDisplay(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  const months = Math.floor(days / 30);
  return `in ${months} ${months === 1 ? 'month' : 'months'}`;
}
