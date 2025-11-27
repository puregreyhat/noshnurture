import { NextRequest, NextResponse } from 'next/server';
import { normalizeIngredientName } from '@/lib/ingredients/normalize';

interface RecipeDetail {
  id: number;
  title: string;
  image: string;
  imageType: string;
  servings: number;
  readyInMinutes: number;
  cookingMinutes?: number;
  preparationMinutes?: number;
  pricePerServing: number;
  cheap: boolean;
  healthScore: number;
  spoonacularScore: number;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  occasions: string[];
  summary: string;
  extendedIngredients: Array<{
    id: number;
    name: string;
    original: string;
    amount: number;
    unit: string;
    measures: {
      metric: { amount: number; unitShort: string; unitLong: string };
      us: { amount: number; unitShort: string; unitLong: string };
    };
  }>;
  analyzedInstructions: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
      ingredients: Array<{ id: number; name: string; image: string }>;
      equipment: Array<{ id: number; name: string; image: string }>;
      length?: { number: number; unit: string };
    }>;
  }>;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
      percentOfDailyNeeds: number;
    }>;
    caloricBreakdown: {
      percentProtein: number;
      percentFat: number;
      percentCarbs: number;
    };
  };
}

// In-memory cache for recipe details (24 hours)
const recipeCache = new Map<
  string,
  { data: RecipeDetail; timestamp: number }
>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = id;

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    // Check if this is a template recipe (non-numeric ID)
    // Template IDs look like: curry-onion-potato, stirfry-carrot-dal, etc.
    // Normalize the incoming id by URL-decoding it (handles cases where
    // a colon was URL-encoded into %3A by the browser/Link).
    const normalizedId = (() => { try { return decodeURIComponent(recipeId); } catch { return recipeId; } })();
    const isNumericId = /^\d+$/.test(normalizedId);

    // Support recipes from our local `recipes-site` (or our new Sugran service)
    // which are returned as path-safe IDs like `local-123`, legacy `recipes-site:123`,
    // or `sugran-m-1` (sugran IDs can be non-numeric). If so, proxy to the
    // appropriate service detail endpoint and map the response into our
    // RecipeDetail shape.
    const localMatch = normalizedId.match(/^local-(\d+)$/) || normalizedId.match(/^recipes-site:(\d+)$/);
    const sugranMatch = normalizedId.match(/^sugran-(.+)$/);
      if (localMatch || sugranMatch) {
        try {
          let resp;
          if (sugranMatch) {
            const sugranId = sugranMatch[1];
            const SUGRAN = process.env.SUGRAN_URL || process.env.RECIPES_SITE_URL || 'https://sugran.vercel.app';
            resp = await fetch(`${SUGRAN.replace(/\/$/, '')}/api/recipes/${encodeURIComponent(sugranId)}`);
          } else {
            const localId = localMatch![1];
            const RECIPES_SITE = process.env.RECIPES_SITE_URL || 'http://localhost:3005';
            resp = await fetch(`${RECIPES_SITE.replace(/\/$/, '')}/api/recipes/${encodeURIComponent(localId)}`);
          }
          if (!resp.ok) {
            return NextResponse.json({ error: 'Local recipe not found' }, { status: resp.status });
          }
          const j = await resp.json();
          const r = (j && j.recipe) || j;

          // Prepare normalized ingredients (collapse duplicates) and formatted summary
          type LocalIngredientObj = { name?: string; quantity?: number; unit?: string };
          let extendedIngredientsArr: Array<{ id: number; name: string; original: string; amount: number; unit: string; }> = [];
          try {
            if (Array.isArray(r.ingredients)) {
              // If ingredients are objects with a `name` field (our Sugran format), map directly
              if (r.ingredients.length > 0 && typeof r.ingredients[0] === 'object' && (r.ingredients[0] as LocalIngredientObj).name) {
                let i = 1;
                for (const ingObjRaw of r.ingredients) {
                  const ingObj = ingObjRaw as LocalIngredientObj;
                  const nameRaw = String(ingObj.name || '').trim();
                  if (!nameRaw) continue;
                  const canon = await normalizeIngredientName(nameRaw, { prefer: 'fuzzy' });
                  const name = canon || nameRaw;
                  extendedIngredientsArr.push({ id: i++, name, original: nameRaw, amount: ingObj.quantity || 0, unit: ingObj.unit || '' });
                }
              } else {
                const map = new Map<string, { originals: string[] }>();
                for (const ing of r.ingredients) {
                  const rawIng = String(ing || '').trim();
                  if (!rawIng) continue;
                  const canon = await normalizeIngredientName(rawIng, { prefer: 'fuzzy' });
                  const key = canon || rawIng.toLowerCase();
                  if (!map.has(key)) map.set(key, { originals: [rawIng] });
                  else map.get(key)!.originals.push(rawIng);
                }
                let i = 1;
                for (const [name, data] of map.entries()) {
                  extendedIngredientsArr.push({ id: i++, name, original: data.originals.join(', '), amount: 0, unit: '' });
                }
              }
            }
          } catch (e) {
            extendedIngredientsArr = Array.isArray(r.ingredients) ? r.ingredients.map((ing: unknown, idx: number) => {
              const obj = ing as LocalIngredientObj | string;
              const name = typeof obj === 'string' ? String(obj) : String((obj as LocalIngredientObj).name ?? obj);
              const amount = typeof obj === 'object' && (obj as LocalIngredientObj).quantity ? (obj as LocalIngredientObj).quantity ?? 0 : 0;
              const unit = typeof obj === 'object' && (obj as LocalIngredientObj).unit ? (obj as LocalIngredientObj).unit ?? '' : '';
              return { id: idx + 1, name: name, original: name, amount, unit };
            }) : [];
          }

          const rawText = r.description || (r.raw && (r.raw.TranslatedInstructions || r.raw.summary)) || '';
          const summaryHtml = ((): string => {
            if (!rawText) return '';
            try {
              const sentences = String(rawText).replace(/\n+/g, ' ').split(/(?<=[.?!])\s+/).filter(Boolean).map(s => s.trim());
              return sentences.map(s => `<p>${s.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('');
            } catch (e) {
              return String(rawText);
            }
          })();

          // Map recipes-site shape to our expected RecipeDetail lite shape
          const mapped: any = {
            id: r.id || recipeId,
            title: r.title || r.name || (r.raw && r.raw.TranslatedRecipeName) || 'Untitled',
            image: r.image || r.image_url || r.imageUrl || '',
            imageType: '',
            servings: r.servings || 0,
            readyInMinutes: (r.prep_time_minutes || r.prepTime || 0) + (r.cook_time_minutes || r.cookTime || r.total_minutes || r.totalMinutes || 0),
            cookingMinutes: undefined,
            preparationMinutes: undefined,
            pricePerServing: 0,
            cheap: false,
            healthScore: 0,
            spoonacularScore: 0,
            cuisines: r.cuisine ? (Array.isArray(r.cuisine) ? r.cuisine : [r.cuisine]) : (Array.isArray(r.cuisines) ? r.cuisines : []),
            dishTypes: Array.isArray(r.dishTypes) ? r.dishTypes : [],
            diets: Array.isArray(r.diets) ? r.diets : [],
            occasions: [],
            summary: summaryHtml || (r.summary || r.description || ''),
            extendedIngredients: extendedIngredientsArr,
            analyzedInstructions: Array.isArray(r.steps) && r.steps.length > 0
              ? [{ name: '', steps: r.steps.map((s: string, i: number) => ({ number: i + 1, step: s, ingredients: [], equipment: [] })) }]
              : [],
          };

          // Cache and return
          recipeCache.set(recipeId, { data: mapped, timestamp: Date.now() });
          return NextResponse.json(mapped);
        } catch (err) {
          console.error('Local recipe fetch failed:', err);
          return NextResponse.json({ error: 'Failed to fetch local recipe' }, { status: 500 });
        }
      }

      if (!isNumericId) {
        return NextResponse.json(
          {
            error: 'Template recipe',
            message: 'This is a quick suggestion template. Only Spoonacular recipes have full cooking instructions and nutrition info.',
            isTemplate: true,
          },
          { status: 404 }
        );
      }

    // Check cache
    const cached = recipeCache.get(recipeId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Check if Spoonacular API key is available
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Spoonacular API key not configured',
          message: 'Please add SPOONACULAR_API_KEY to .env.local',
        },
        { status: 503 }
      );
    }

    // Fetch recipe details from Spoonacular
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}&includeNutrition=true`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 402) {
        return NextResponse.json(
          {
            error: 'API quota exceeded',
            message: 'Daily API limit reached. Please try again tomorrow.',
          },
          { status: 402 }
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          {
            error: 'Recipe not found',
            message: 'This recipe is no longer available. Please try another recipe.',
          },
          { status: 404 }
        );
      }
      throw new Error(`Spoonacular API error: ${response.statusText}`);
    }

    const data: RecipeDetail = await response.json();

    // Cache the result
    recipeCache.set(recipeId, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Recipe detail fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch recipe details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
