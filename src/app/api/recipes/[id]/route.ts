import { NextRequest, NextResponse } from 'next/server';

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
    const isNumericId = /^\d+$/.test(recipeId);
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
