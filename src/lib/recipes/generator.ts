import type { InventoryItemDB } from "@/lib/supabase-types";
import { normalizeIngredientName } from "@/lib/ingredients/normalize";
import normalizeInventoryItems from '@/lib/ingredients/userInventoryNormalizer';
import { TEMPLATES, type Pantry, type RecipeSuggestion } from "./templates";

function getCanonicalFromTags(tags: string[] | null | undefined): string | null {
  if (!tags) return null;
  const t = tags.find((t) => t.startsWith("canonical:"));
  return t ? t.replace(/^canonical:/, "") : null;
}

export async function buildPantry(items: InventoryItemDB[]): Promise<Pantry> {
  const expiring = new Set<string>();

  // Use centralized normalization so generator and recipe detail use the same rules
  const { available, canonicalExpiry } = await normalizeInventoryItems(items as InventoryItemDB[]);

  for (const ce of canonicalExpiry) {
    if (ce.days_until_expiry >= 0 && ce.days_until_expiry <= 7) {
      expiring.add(ce.canonical);
    }
  }

  return { expiring, available };
}

export async function generateSuggestions(items: InventoryItemDB[]): Promise<RecipeSuggestion[]> {
  const pantry = await buildPantry(items);
  const candidates: RecipeSuggestion[] = [];

  for (const tpl of TEMPLATES) {
    const r = tpl({ pantry });
    if (r) candidates.push(r);
  }

  // Sort by:
  // 1. Matched ingredient count (descending - recipes using more of your items first)
  // 2. Score (descending - prioritize expiring items)
  // 3. Total time (ascending - quicker recipes first)
  candidates.sort((a, b) => {
    const matchedCountDiff = (b.matchedIngredientCount || 0) - (a.matchedIngredientCount || 0);
    if (matchedCountDiff !== 0) return matchedCountDiff;
    
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    
    return a.totalTime - b.totalTime;
  });
  return candidates.slice(0, 5);
}
