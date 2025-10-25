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

export async function GET() {
  try {
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
    
    // Optionally fetch Spoonacular suggestions for variety
    let spoonSuggestions: Record<string, unknown>[] = [];
    const expiringIngredients = await getExpiringIngredients(items);
    
    if (expiringIngredients.length > 0 && process.env.SPOONACULAR_API_KEY) {
      try {
        console.log(`[Recipes API] Fetching from Spoonacular with ingredients: ${expiringIngredients.join(', ')}`);
        
        // Call Spoonacular API directly instead of internal route
        const ingredientsStr = expiringIngredients.join(',+');
        const url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${process.env.SPOONACULAR_API_KEY}&ingredients=${ingredientsStr}&number=3&ranking=2&ignorePantry=false`;
        
        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const spoonRes = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (spoonRes.ok) {
          const data = await spoonRes.json();
          // Transform to our format
          spoonSuggestions = (Array.isArray(data) ? data : []).map((r: Record<string, unknown>) => ({
            id: r.id,
            title: r.title,
            image: r.image,
            usedIngredients: Array.isArray(r.usedIngredients) ? r.usedIngredients.map((i: Record<string, unknown>) => i.name) : [],
            missedIngredients: Array.isArray(r.missedIngredients) ? r.missedIngredients.map((i: Record<string, unknown>) => i.name) : [],
            source: "spoonacular",
            readyInMinutes: r.readyInMinutes,
            servings: r.servings,
          }));
          console.log(`[Recipes API] Successfully fetched ${spoonSuggestions.length} Spoonacular recipes`);
        }
      } catch (e) {
        const err = e as { name?: string; message?: string }
        if (err.name === 'AbortError') {
          console.log('[Recipes API] Spoonacular request timed out, using template recipes only');
        } else {
          console.error('[Recipes API] Spoonacular fetch failed:', err.message);
        }
      }
    }
    
    console.log(`[Recipes API] Got ${spoonSuggestions.length} Spoonacular suggestions`);
    
    // Merge: templates first (reliable), then Spoonacular for variety
    const merged = [...templateSuggestions, ...spoonSuggestions].slice(0, 8);
    
    console.log(`[Recipes API] Returning ${merged.length} total suggestions`);
    return NextResponse.json({ suggestions: merged });
  } catch (e) {
    console.error('[Recipes API] Error:', e);
    const err = e as Error
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
