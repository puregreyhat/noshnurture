import { NextResponse } from "next/server";
import { generateSuggestions } from "@/lib/recipes/generator";
import { normalizeIngredientName } from "@/lib/ingredients/normalize";
import { createClient } from "@/lib/supabase/server";

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
    
    console.log(`[Recipes API] Found ${items.length} inventory items, showAll=${showAll}, source=${source}`);
    
    // If no items, return empty immediately
    if (items.length === 0) {
      console.log('[Recipes API] No inventory items, returning empty suggestions');
      return NextResponse.json({ suggestions: [] });
    }
    
    // Generate template-based suggestions (fast, always available)
    const templateSuggestions = await generateSuggestions(items);
    console.log(`[Recipes API] Generated ${templateSuggestions.length} template suggestions`);
    
    // If Sugran is requested, use Sugran API (with proper sorting by availability)
    if (source === 'sugran' || source === 'recipes-site') {
      try {
        const SUGRAN = process.env.SUGRAN_URL || process.env.RECIPES_SITE_URL || 'https://sugran.vercel.app';
        
        // Build simple inventory array of product names (normalized to lowercase)
        const inventoryNames: string[] = (items || [])
          .slice(0, 100)
          .map(it => String(it.product_name || it.name || '').trim().toLowerCase())
          .filter(Boolean);

        console.log(`[Recipes API] Inventory: ${inventoryNames.join(', ')}`);

        // First try: fetch all recipes and calculate matches manually
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const sugranUrl = `${SUGRAN.replace(/\/$/, '')}/api/recipes?limit=100`;
        console.log(`[Recipes API] Fetching all recipes from: ${sugranUrl}`);
        
        const allResp = await fetch(sugranUrl, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        console.log(`[Recipes API] Fetch response status: ${allResp.status}`);
        
        if (allResp.ok) {
          const allData = await allResp.json();
          console.log(`[Recipes API] Response keys: ${Object.keys(allData).join(', ')}`);
          const allRecipes = Array.isArray(allData.results) ? (allData.results as unknown[]) : [];
          console.log(`[Recipes API] Fetched ${allRecipes.length} total recipes from Sugran`);
          
          // Map and calculate matches manually - process ALL recipes, not just first 12
          const mapped = allRecipes.map((r) => {
            const recipe = r as Record<string, unknown>;
            const title = String((recipe.name ?? recipe.title ?? 'Untitled') as unknown);
            const image = String((recipe.image ?? recipe.image_url ?? (recipe as any).imageUrl ?? '') as unknown);
            const id = recipe.id ? `sugran-${String(recipe.id)}` : `sugran-${encodeURIComponent(title).toLowerCase()}`;
            
            // Get ingredients from recipe
            const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
            
            // Calculate matches manually
            const matchedIngredients: string[] = [];
            const missingIngredients: string[] = [];
            
            ingredients.forEach((ing: unknown) => {
              // Handle both string and object ingredient formats
              let ingName = '';
              if (typeof ing === 'string') {
                ingName = ing.trim().toLowerCase();
              } else if (typeof ing === 'object' && ing !== null) {
                const ingObj = ing as Record<string, unknown>;
                ingName = String(ingObj.name || '').trim().toLowerCase();
              }
              
              if (ingName && inventoryNames.some(inv => ingName.includes(inv) || inv.includes(ingName))) {
                matchedIngredients.push(ingName);
              } else if (ingName) {
                missingIngredients.push(ingName);
              }
            });
            
            const matchedCount = matchedIngredients.length;
            const totalCount = ingredients.length;
            
            console.log(`[Recipes API] Recipe: ${title} → ${matchedCount}/${totalCount} ingredients (${totalCount > 0 ? (matchedCount/totalCount*100).toFixed(0) : 0}%)`);
            
            let cuisine = String((recipe.cuisine ?? '') as unknown).trim();
            if (!cuisine) {
              cuisine = determineCuisineFromTitle(title);
            }
            
            return {
              title,
              image,
              id,
              source: 'sugran',
              matched: matchedIngredients,
              missing: missingIngredients,
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
              matchedIngredientCount: matchedCount,
              totalIngredientCount: totalCount,
            };
          });
          
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
          
          console.log(`[Recipes API] Final sorted order: ${sorted.map(r => `${r.title}(${r.matchedIngredientCount}/${r.totalIngredientCount}=${(r.totalIngredientCount > 0 ? (r.matchedIngredientCount/r.totalIngredientCount*100).toFixed(0) : 0)}%)`).join(' → ')}`);
          
          // Return sorted Sugran recipes (show all available recipes, up to 50)
          const maxDishes = showAll ? 50 : 6;
          const finalSuggestions = sorted.slice(0, maxDishes);
          
          console.log(`[Recipes API] Final suggestions: ${finalSuggestions.length} recipes`);
          return NextResponse.json({ suggestions: finalSuggestions as any });
        }
      } catch (e) {
        console.error('[Recipes API] Sugran error:', (e as Error).message);
      }
    }
    
    // Fallback: return template suggestions only
    const merged = [...templateSuggestions].slice(0, 6);
    console.log(`[Recipes API] Returning ${merged.length} template suggestions (fallback)`);
    return NextResponse.json({ suggestions: merged });
    
  } catch (e) {
    console.error('[Recipes API] Error:', e);
    const err = e as Error
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
