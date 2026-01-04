import { NextResponse } from "next/server";

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY || "";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache (use Redis in production)
const cache = new Map<string, { data: unknown[]; timestamp: number }>();

export async function POST(request: Request) {
  try {
    const { ingredients, number = 5 } = await request.json();
    
    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({ recipes: [] });
    }

    // Check cache
    const cacheKey = `spoon_${ingredients.sort().join(",")}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return NextResponse.json({ recipes: cached.data, cached: true });
    }

    // Call Spoonacular only if key is present
    if (!SPOONACULAR_KEY) {
      return NextResponse.json({ recipes: [], message: "API key not configured" });
    }

    const ingredientsStr = ingredients.join(",+");
    const url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${SPOONACULAR_KEY}&ingredients=${ingredientsStr}&number=${number}&ranking=2&ignorePantry=false`;
    
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Spoonacular API error:", res.status, await res.text());
      return NextResponse.json({ recipes: [], error: "API request failed" });
    }

    const data = await res.json();
    
    // Transform to our format
    const recipes = (Array.isArray(data) ? data : []).map((r: Record<string, unknown>) => ({
      id: r.id, // Keep numeric ID for detail page
      title: r.title,
      image: r.image,
      usedIngredients: Array.isArray(r.usedIngredients) ? r.usedIngredients.map((i: Record<string, unknown>) => i.name) : [],
      missedIngredients: Array.isArray(r.missedIngredients) ? r.missedIngredients.map((i: Record<string, unknown>) => i.name) : [],
      source: "spoonacular",
      readyInMinutes: r.readyInMinutes,
      servings: r.servings,
    }));

    // Cache result
    cache.set(cacheKey, { data: recipes, timestamp: Date.now() });

    return NextResponse.json({ recipes });
  } catch (e) {
    console.error("Spoonacular route error:", e);
    const err = e as Error
    return NextResponse.json({ recipes: [], error: err?.message || "Unknown error" }, { status: 500 });
  }
}
