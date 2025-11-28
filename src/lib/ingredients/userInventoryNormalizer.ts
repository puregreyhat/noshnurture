import { InventoryItemDB } from '@/lib/supabase-types';
import { normalizeIngredientName } from './normalize';

export type CanonicalExpiry = { canonical: string; days_until_expiry: number };

/**
 * Build a normalized "available" set from inventory rows.
 * This mirrors the token + canonical extraction logic used in the recipe detail page
 * so both list and detail views use the same matching rules.
 */
export async function normalizeInventoryItems(items: InventoryItemDB[]): Promise<{
  available: Set<string>;
  canonicalExpiry: CanonicalExpiry[];
}> {
  const available = new Set<string>();
  const canonicalExpiry: CanonicalExpiry[] = [];

  for (const item of items) {
    const raw = String(item.product_name || '');

    // 1) Prefer explicit canonical tags if present
    let canonical: string | null = null;
    if (Array.isArray(item.tags)) {
      for (const t of item.tags) {
        if (typeof t === 'string' && t.startsWith('canonical:')) {
          canonical = t.replace(/^canonical:/, '').toLowerCase().trim();
          break;
        }
      }
    }

    // 2) If no canonical in tags, normalize the product name (fuzzy)
    if (!canonical) {
      try {
        const n = await normalizeIngredientName(raw, { prefer: 'fuzzy' });
        canonical = String(n || '').toLowerCase().trim() || null;
      } catch {
        canonical = raw.toLowerCase().trim() || null;
      }
    }

    // Calculate dynamic days_until_expiry
    let daysUntilExpiry = 0;
    if (item.expiry_date) {
      try {
        const separator = item.expiry_date.includes('/') ? '/' : '-';
        const [day, month, year] = item.expiry_date.split(separator).map(Number);
        const exp = new Date(year, month - 1, day);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        exp.setHours(0, 0, 0, 0);
        daysUntilExpiry = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } catch {
        daysUntilExpiry = Number(item.days_until_expiry || 0);
      }
    } else {
      daysUntilExpiry = Number(item.days_until_expiry || 0);
    }

    if (canonical) {
      available.add(canonical);
      canonicalExpiry.push({ canonical, days_until_expiry: daysUntilExpiry });
    }

    // 3) Also include plain tag strings (non-canonical) as additional tokens
    if (Array.isArray(item.tags)) {
      for (const t of item.tags) {
        if (typeof t !== 'string') continue;
        if (t.startsWith('canonical:')) continue;
        const v = t.toLowerCase().trim();
        if (v) available.add(v);
      }
    }

    // 4) Token-level fallbacks from product name (split on non-alphanum), include tokens >= 3 chars
    try {
      const tokens = raw.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      for (const tk of tokens) {
        if (tk.length >= 3) available.add(tk.trim());
      }
    } catch {
      // ignore tokenization errors
    }
  }

  return { available, canonicalExpiry };
}

export default normalizeInventoryItems;
