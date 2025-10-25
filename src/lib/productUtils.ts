export type QRProduct = {
  name: string;
  expiryDate: string;
  quantity: number;
  // optional measured size per unit, e.g. { value: 500, unit: 'g' }
  measure?: { value: number; unit: string } | null;
  category: string;
};

export type InventoryItem = QRProduct & {
  unit: string;
  daysUntilExpiry: number;
  storageType: string;
  tags: string[];
  commonUses: string[];
};

export function inferUnit(name: string, category: string): string {
  const lower = name.toLowerCase();
  // Prefer explicit clues in the name
  if (lower.includes('kg') || lower.includes('kg.') || lower.includes('kilogram')) return 'kg';
  if (lower.includes('g') || lower.includes('gram')) return 'g';
  if (lower.includes('ml') || lower.includes('millilitre')) return 'ml';
  if (lower.includes('l') || lower.includes('litre') || lower.includes('liter')) return 'L';
  if (lower.includes('loaf') || lower.includes('bread')) return 'loaf';

  // Fallback heuristics
  if (category === 'vegetables' || category === 'fruits') return 'pcs';
  if (category === 'atta' || category === 'grains') return 'kg';
  return 'pcs';
}

// Parse a measure string like "500 g", "1 kg", "500ml" and return normalized unit/value
export function parseMeasure(str: string | undefined | null): { value: number; unit: string } | null {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().toLowerCase();
  // common patterns: "500 g", "500g", "1 kg", "500 ml", "1 l"
  const m = s.match(/([0-9,.]+)\s*(kg|g|grams?|ml|l|litre|liter|ltr|gms?)/i);
  if (!m) return null;
  const raw = m[1].replace(',', '.');
  const value = Number(raw);
  let unit = (m[2] || '').toLowerCase();
  if (unit === 'grams' || unit === 'gram' || unit === 'gms' || unit === 'g') unit = 'g';
  if (unit === 'kg') unit = 'kg';
  if (unit === 'ml') unit = 'ml';
  if (unit === 'l' || unit === 'liter' || unit === 'litre' || unit === 'ltr') unit = 'L';
  if (isNaN(value)) return null;
  return { value, unit };
}

export function getStorageType(category: string): string {
  const cat = category.toLowerCase();
  if (cat === 'dairy') return 'refrigerated';
  if (cat === 'meat' || cat === 'seafood') return 'frozen';
  if (cat === 'vegetables' || cat === 'fruits') return 'cool';
  if (cat === 'atta' || cat === 'grains' || cat === 'bakery') return 'room-temp';
  return 'room-temp';
}

export function generateTags(name: string, category: string): string[] {
  const tags = [] as string[];
  const lower = name.toLowerCase();
  if (category) tags.push(category.toLowerCase());
  if (lower.includes('tomato')) tags.push('tomato', 'sauce-base');
  if (lower.includes('potato')) tags.push('potato', 'starch');
  if (lower.includes('onion')) tags.push('onion', 'aromatic');
  if (lower.includes('milk')) tags.push('milk', 'dairy');
  if (lower.includes('bread')) tags.push('bread', 'bakery');
  return Array.from(new Set(tags));
}

export function getCommonUses(name: string): string[] {
  const lower = name.toLowerCase();
  if (lower.includes('tomato')) return ['soup', 'curry', 'sauce', 'salad'];
  if (lower.includes('onion')) return ['curry', 'stir-fry', 'salad'];
  if (lower.includes('potato')) return ['fries', 'curry', 'roast'];
  if (lower.includes('milk')) return ['tea', 'cereal', 'sauces'];
  if (lower.includes('bread')) return ['toast', 'sandwich'];
  return ['general'];
}

export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function enhanceProductData(p: QRProduct) : InventoryItem {
  // Start with defaults
  let unit = inferUnit(p.name, p.category);
  let quantity = p.quantity;

  // If a measure is provided (e.g. 500 g per item), compute the total and normalize units
  if (p.measure && typeof p.measure.value === 'number' && p.measure.unit) {
    const perUnit = p.measure.value;
    const measureUnit = p.measure.unit;
    // total amount in base units
  const total = perUnit * (p.quantity || 1);

    // normalize grams -> kg if >= 1000
    if (measureUnit === 'g') {
      if (total >= 1000) {
        quantity = Number((total / 1000).toFixed(3));
        unit = 'kg';
      } else {
        quantity = total;
        unit = 'g';
      }
    } else if (measureUnit === 'ml') {
      if (total >= 1000) {
        quantity = Number((total / 1000).toFixed(3));
        unit = 'L';
      } else {
        quantity = total;
        unit = 'ml';
      }
    } else if (measureUnit === 'kg') {
      quantity = Number((total).toFixed(3));
      unit = 'kg';
    } else if (measureUnit === 'L') {
      quantity = Number((total).toFixed(3));
      unit = 'L';
    } else {
      // unknown measure - fall back
      quantity = p.quantity;
    }
  }

  return {
    ...p,
    quantity,
    unit,
    daysUntilExpiry: daysUntilExpiry(p.expiryDate),
    storageType: getStorageType(p.category),
    tags: generateTags(p.name, p.category),
    commonUses: getCommonUses(p.name),
  };
}
