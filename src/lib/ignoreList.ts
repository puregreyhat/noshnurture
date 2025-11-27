export const IGNORED_PRODUCT_TOKENS = new Set([
  'water',
  'drinking water',
  'tap water',
  // add more if you want: 'salt', 'pepper'
]);

export function shouldIgnoreProduct(name: string | undefined | null, tags?: string[] | null): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  // direct substring check (covers "water", "bottled water", etc.)
  for (const tok of IGNORED_PRODUCT_TOKENS) {
    if (lower === tok) return true;
    if (lower.includes(tok)) return true;
  }
  // tags may include canonical:water or simple 'water'
  if (Array.isArray(tags)) {
    for (const t of tags) {
      if (!t || typeof t !== 'string') continue;
      const tt = t.toLowerCase();
      if (tt === 'water' || tt.startsWith('canonical:water') || tt.includes(':water')) return true;
    }
  }
  return false;
}
