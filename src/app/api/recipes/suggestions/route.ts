import { NextResponse } from "next/server";
import { generateSuggestions } from "@/lib/recipes/generator";
import { normalizeIngredientName } from "@/lib/ingredients/normalize";
import { normalizeInventoryItems } from "@/lib/ingredients/userInventoryNormalizer";
import { createClient } from "@/lib/supabase/server";
import { calculateDaysUntilExpiry } from "@/lib/utils/dateUtils";

export const revalidate = 0; // dynamic, don't cache at edge by default

// Helper function to determine cuisine based on recipe title
function determineCuisineFromTitle(title: string): string {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('curry') || titleLower.includes('masala') ||
    titleLower.includes('dosa') || titleLower.includes('idli') ||
    titleLower.includes('sambar') || titleLower.includes('rasam') ||
    titleLower.includes('biryani') || titleLower.includes('dal') ||
    titleLower.includes('tandoori') || titleLower.includes('naan') ||
    titleLower.includes('uttapam')) {
    return 'Indian';
  }

  if (titleLower.includes('stir-fry') || titleLower.includes('stir fry') ||
    titleLower.includes('fried rice') || titleLower.includes('soy') ||
    titleLower.includes('wok') || titleLower.includes('noodles')) {
    return 'East Asian';
  }

  if (titleLower.includes('pasta') || titleLower.includes('pizza') ||
    titleLower.includes('risotto') || titleLower.includes('pesto') ||
    titleLower.includes('polenta') || titleLower.includes('Italian')) {
    return 'Italian';
  }

  if (titleLower.includes('roasted') || titleLower.includes('traybake') ||
    titleLower.includes('steak') || titleLower.includes('schnitzel') ||
    titleLower.includes('european')) {
    return 'European';
  }

  return 'International';
}



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
    const showAll = url.searchParams.get('all') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

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

    // Filter out expired items dynamically
    const items = (data || []).filter(item => {
      const days = calculateDaysUntilExpiry(item.expiry_date);
      // Update the item's days_until_expiry so downstream logic uses the correct value
      item.days_until_expiry = days;
      return days >= 0; // Only include non-expired items
    });

    // If no items, return empty immediately
    if (items.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Generate template-based suggestions (fast, always available)
    const templateSuggestions = await generateSuggestions(items);

    // If Sugran is requested, use Sugran API (with proper sorting by availability)
    if (source === 'sugran' || source === 'recipes-site') {
      try {
        const SUGRAN = process.env.SUGRAN_URL || process.env.RECIPES_SITE_URL || 'https://sugran.vercel.app';

        // Build inventory mapping using the same normalizer as recipe detail page
        // This ensures both use identical ingredient matching logic
        const { available } = await normalizeInventoryItems(items as any);
        const inventoryNames = Array.from(available.values());

        // First try: fetch all recipes and calculate matches manually
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const sugranUrl = `${SUGRAN.replace(/\/$/, '')}/api/recipes?limit=100`;

        const allResp = await fetch(sugranUrl, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (allResp.ok) {
          const allData = await allResp.json();
          const allRecipes = Array.isArray(allData.results) ? (allData.results as unknown[]) : [];

          // Map and calculate matches manually - process ALL recipes, not just first 12
          const mapped = await Promise.all(allRecipes.map(async (r) => {
            const recipe = r as Record<string, unknown>;
            const title = String((recipe.name ?? recipe.title ?? 'Untitled') as unknown);
            const image = String((recipe.image ?? recipe.image_url ?? (recipe as any).imageUrl ?? '') as unknown);
            const id = recipe.id ? `sugran-${String(recipe.id)}` : `sugran-${encodeURIComponent(title).toLowerCase()}`;

            // Get ingredients from recipe
            const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

            // Calculate matches manually
            const matchedIngredients: string[] = [];
            const missingIngredients: string[] = [];

            // Use for loop to allow async normalization
            for (const ing of ingredients) {
              // Handle both string and object ingredient formats
              let ingName = '';
              if (typeof ing === 'string') {
                ingName = ing.trim().toLowerCase();
              } else if (typeof ing === 'object' && ing !== null) {
                const ingObj = ing as Record<string, unknown>;
                ingName = String(ingObj.name || '').trim().toLowerCase();
              }

              if (!ingName) continue;

              // Check 1: Try canonical normalization
              let normalized = '';
              try {
                normalized = await normalizeIngredientName(ingName);
              } catch {
                normalized = ingName;
              }

              // Check if we have this canonical ingredient in normalized inventory
              const hasExactMatch = inventoryNames.some(inv => inv.toLowerCase() === normalized.toLowerCase());

              // Check 2: Fallback to substring matching (for fuzzy-matched inventory)
              // IMPORTANT: Require at least 60% match ratio to avoid false positives like "amchur powder" matching "powder"
              let matchingInventoryItem = '';
              const hasSubstringMatch = inventoryNames.some(inv => {
                const inv_lower = inv.toLowerCase();
                const ing_lower = ingName.toLowerCase();

                // Calculate match ratio to avoid single-word false positives
                const longerStr = ing_lower.length >= inv_lower.length ? ing_lower : inv_lower;
                const shorterStr = ing_lower.length < inv_lower.length ? ing_lower : inv_lower;
                const matchRatio = shorterStr.length / longerStr.length;

                // Only match if shorter string is at least 60% of longer string
                if (matchRatio >= 0.6 && (ing_lower.includes(inv_lower) || inv_lower.includes(ing_lower))) {
                  matchingInventoryItem = inv;
                  return true;
                }
                return false;
              });

              if (hasExactMatch || hasSubstringMatch) {
                matchedIngredients.push(ingName);
              } else {
                missingIngredients.push(ingName);
              }
            }

            const matchedCount = matchedIngredients.length;
            const totalCount = ingredients.length;

            let cuisine = String((recipe.cuisine ?? '') as unknown).trim();
            if (!cuisine) {
              cuisine = determineCuisineFromTitle(title);
            }

            // Determine if recipe should be treated as "exactly available now" allowing a single missing staple
            const STAPLES = ['water', 'salt', 'oil', 'sugar', 'pepper'];
            const isStaple = (name: string) => {
              const n = String(name || '').toLowerCase();
              return STAPLES.some(s => n.includes(s) || s.includes(n));
            };

            const stapleMissingCount = missingIngredients.filter(m => isStaple(m)).length;
            const missingNonStaples = missingIngredients.filter(m => !isStaple(m));
            const isExactNow = (missingNonStaples.length === 0 && stapleMissingCount <= 1) || (matchedCount >= totalCount && totalCount > 0);

            return {
              title,
              image,
              id,
              source: 'sugran',
              matched: matchedIngredients,
              missing: missingIngredients,
              isExactNow,
              ingredients: ingredients.map((ing: unknown) => {
                if (typeof ing === 'string') {
                  return { name: ing.trim(), amount: '' };
                } else if (typeof ing === 'object' && ing !== null) {
                  const ingObj = ing as Record<string, unknown>;
                  return {
                    name: String(ingObj.name || '').trim(),
                    amount: String(ingObj.amount || ingObj.quantity || '').trim()
                  };
                }
                return { name: '', amount: '' };
              }).filter(ing => ing.name),
              cuisine,
              diet: (() => {
                const d = String((recipe.diet ?? '') as unknown).trim();
                if (d) return d;
                const tags = Array.isArray(recipe.tags) ? (recipe.tags as string[]) : [];
                if (tags.some(t => String(t).toLowerCase() === 'vegetarian')) return 'Vegetarian';
                if (tags.some(t => String(t).toLowerCase() === 'non-veg')) return 'Non-Vegetarian';
                return '';
              })(),
              matchedIngredientCount: matchedCount,
              totalIngredientCount: totalCount,
            };
          }));

          // SORT BY AVAILABILITY RATIO (matched/total) - HIGHEST PERCENTAGE FIRST!
          const sorted = mapped.sort((a: typeof mapped[0], b: typeof mapped[0]) => {
            const aMatched = a.matchedIngredientCount ?? 0;
            const aTotal = a.totalIngredientCount ?? 1;
            const bMatched = b.matchedIngredientCount ?? 0;
            const bTotal = b.totalIngredientCount ?? 1;

            // Calculate availability percentage
            const aRatio = aMatched / aTotal;
            const bRatio = bMatched / bTotal;

            // Sort by ratio (descending) - highest percentage first
            return bRatio - aRatio;
          });

          // Return sorted Sugran recipes (show all available recipes, up to specified limit)
          const maxDishes = showAll ? limit : 6;
          const finalSuggestions = sorted.slice(0, maxDishes);

          return NextResponse.json({ suggestions: finalSuggestions as any });
        }
      } catch (e) {
        console.error('[Recipes API] Sugran error:', (e as Error).message);
      }
    }

    // Fallback: return template suggestions only
    const merged = [...templateSuggestions].slice(0, 6);
    return NextResponse.json({ suggestions: merged });

  } catch (e) {
    console.error('[Recipes API] Error:', e);
    const err = e as Error
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
