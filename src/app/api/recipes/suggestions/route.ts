import { NextResponse } from "next/server";
import { generateSuggestions } from "@/lib/recipes/generator";
import { normalizeIngredientName } from "@/lib/ingredients/normalize";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0; // dynamic, don't cache at edge by default

async function getExpiringIngredients(items: Record<string, unknown>[]): Promise<string[]> {
  const expiring = items.filter(i => typeof i.days_until_expiry === 'number' && i.days_until_expiry >= 0 && i.days_until_expiry <= 7);
  const canonicals = new Set<string>();
  for (const item of expiring) {
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const canonical = tags.find((t: unknown) => typeof t === 'string' && t.startsWith("canonical:"))?.toString().replace(/^canonical:/, "");
    if (canonical) {
      canonicals.add(canonical);
    } else {
      try {
        const c = await normalizeIngredientName(String(item.product_name || ''));
        canonicals.add(c);
      } catch {
        // ignore
      }
    }
  }
  return Array.from(canonicals).slice(0, 6);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const source = (url.searchParams.get('source') || 'spoonacular').toString()
    // Get authenticated user
    const supabaseServer = await createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const { data, error } = await supabaseServer
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId)
      .eq("is_consumed", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = data || [];
    
    console.log(`[Recipes API] Found ${items.length} inventory items`);
    
    // If no items, return empty immediately
    if (items.length === 0) {
      console.log('[Recipes API] No inventory items, returning empty suggestions');
      return NextResponse.json({ suggestions: [] });
    }
    
    // Generate template-based suggestions (fast, always available)
    const templateSuggestions = await generateSuggestions(items);
    console.log(`[Recipes API] Generated ${templateSuggestions.length} template suggestions`);
    
  // Optionally fetch Spoonacular suggestions for variety (DEPRECATED)
  // We intentionally do not call Spoonacular for now to avoid API limits.
  const expiringIngredients = await getExpiringIngredients(items);
  // If client asked to use our Sugran recipe service, proxy inventory and return those suggestions
    if (source === 'sugran' || source === 'recipes-site') {
      try {
        const SUGRAN = process.env.SUGRAN_URL || process.env.RECIPES_SITE_URL || 'https://sugran.vercel.app';
        // Build simple inventory array of product names
        const inventoryNames: string[] = (items || [])
          .slice(0, 100)
          .map(it => String(it.product_name || it.name || '').trim())
          .filter(Boolean);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const resp = await fetch(`${SUGRAN.replace(/\/$/, '')}/api/recipes/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inventory: inventoryNames, limit: 8 }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const j = await resp.json();
          const resultsArr = Array.isArray(j.results) ? (j.results as unknown[]) : [];
          const mapped = resultsArr.map((r) => {
            const rObj = r as Record<string, unknown>;
            const recipe = (rObj.recipe as Record<string, unknown>) ?? (rObj as Record<string, unknown>);
            const title = String((recipe.name ?? recipe.title ?? 'Untitled') as unknown);
            const image = '';
            // Make id path-safe and indicate origin
            const id = recipe.id ? `sugran-${String(recipe.id)}` : undefined;
            const matched = typeof rObj.matched === 'number' ? (rObj.matched as number) : (Array.isArray(rObj.matched) ? (rObj.matched as unknown[]) : []);
            const missing = Array.isArray(rObj.missing) ? (rObj.missing as unknown[]) : [];
            return {
              title,
              image,
              id,
              source: 'sugran',
              matched,
              missing,
            };
          });
          try { console.log('[Recipes API] mapped sugran suggestion ids:', mapped.map(m => m.id)); } catch {}
          const merged = [...templateSuggestions, ...mapped].slice(0, 8);
          return NextResponse.json({ suggestions: merged });
        }
      } catch (e) {
        console.error('[Recipes API] sugran proxy failed, falling back to templates', (e as Error).message)
      }
    }
    // We don't call Spoonacular right now. Return template suggestions only by default.
    const merged = [...templateSuggestions].slice(0, 8);
    
    console.log(`[Recipes API] Returning ${merged.length} total suggestions`);
  return NextResponse.json({ suggestions: merged });
  } catch (e) {
    console.error('[Recipes API] Error:', e);
    const err = e as Error
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
