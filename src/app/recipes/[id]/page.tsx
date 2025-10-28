'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Users,
  Heart,
  ChefHat,
  Leaf,
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { normalizeIngredientName, normalizeIngredientNameWithScore, levenshtein } from '@/lib/ingredients/normalize';
import { useAuth } from '@/contexts/AuthContext';

interface RecipeDetail {
  id: number;
  title: string;
  image: string;
  servings: number;
  readyInMinutes: number;
  cookingMinutes?: number;
  preparationMinutes?: number;
  healthScore: number;
  spoonacularScore: number;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  summary: string;
  extendedIngredients: Array<{
    id: number;
    name: string;
    original: string;
    amount: number;
    unit: string;
  }>;
  analyzedInstructions: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
      ingredients: Array<{ id: number; name: string }>;
      equipment: Array<{ id: number; name: string }>;
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

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const { user } = useAuth();

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [normalizedUserIngredients, setNormalizedUserIngredients] = useState<Set<string>>(new Set());
  const [ownedIngredientNames, setOwnedIngredientNames] = useState<Set<string>>(new Set());
  const [ingredientConfidences, setIngredientConfidences] = useState<Record<string, 'high' | 'medium' | 'low'>>({});
  const [cooking, setCooking] = useState(false);

  useEffect(() => {
    fetchRecipeDetails();
    fetchUserIngredients();
  }, [recipeId]);

  const fetchRecipeDetails = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch recipe');
      }
      const data = await response.json();
      setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserIngredients = async () => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('inventory_items')
        .select('tags')
        .eq('user_id', user.id)
        .eq('is_consumed', false);

      if (error) throw error;

      // Extract canonical ingredient names from tags (and fallback plain tags)
      const ingredients: string[] = [];
      const rows = (data || []) as Array<{ tags?: unknown[]; product_name?: string | null }>;
      rows.forEach((item) => {
        const tags = Array.isArray(item.tags) ? item.tags : [];
        tags.forEach((tag) => {
          if (typeof tag !== 'string') return;
          if (tag.startsWith('canonical:')) {
            ingredients.push(tag.replace('canonical:', '').toLowerCase());
          } else {
            const t = tag.trim().toLowerCase();
            if (t) ingredients.push(t);
          }
        });
        // also include product_name as a fallback
        const pname = item.product_name;
        if (pname && typeof pname === 'string') {
          ingredients.push(String(pname).trim().toLowerCase());
        }
      });
      const uniq = Array.from(new Set(ingredients));
      setUserIngredients(uniq);

      // Normalize user ingredients to canonical forms for better matching
      try {
        const norms = new Set<string>();
        await Promise.all(uniq.map(async (ing) => {
          try {
            const n = await normalizeIngredientName(ing, { prefer: 'fuzzy' });
            norms.add(n.toLowerCase());
          } catch {
            norms.add(ing.toLowerCase());
          }
        }));
        setNormalizedUserIngredients(norms);
      } catch (e) {
        // ignore normalization errors
        setNormalizedUserIngredients(new Set(uniq.map(s => s.toLowerCase())));
      }
    } catch (err) {
      console.error('Error fetching user ingredients:', err);
    }
  };

  const checkIngredientOwnership = (ingredientName: string): boolean => {
    // Use precomputed confidences: consider high/medium as owned
    const key = ingredientName.toLowerCase().trim();
    const conf = ingredientConfidences[key];
    if (conf) return conf === 'high' || conf === 'medium';

    // Fallback: existing ownedIngredientNames set
    if (ownedIngredientNames.size > 0) {
      const n = ingredientName.toLowerCase().trim();
      return Array.from(ownedIngredientNames).some(o => n.includes(o) || o === n);
    }

    // Final fallback: simple tag substring match
    const normalized = ingredientName.toLowerCase().trim();
    return userIngredients.some((ing) => normalized.includes(ing.toLowerCase()));
  };

  // When recipe or normalizedUserIngredients change, compute which recipe ingredients are owned
  useEffect(() => {
    if (!recipe || !recipe.extendedIngredients || normalizedUserIngredients.size === 0) {
      setOwnedIngredientNames(new Set());
      setIngredientConfidences({});
      return;
    }

    (async () => {
      const owned = new Set<string>();
      const confs: Record<string, 'high' | 'medium' | 'low'> = {};
      await Promise.all(recipe.extendedIngredients.map(async (ing) => {
        try {
          const rawName = String(ing.name || ing.original || '');
          const normObj = await normalizeIngredientNameWithScore(rawName, { prefer: 'fuzzy' });
          const recipeCanon = normObj.canonical.toLowerCase();

          // compare against user's canonical tokens
          let bestDist = Infinity;
          let bestUser: string | null = null;
          for (const u of Array.from(normalizedUserIngredients)) {
            const userTok = u.toLowerCase();
            if (userTok === recipeCanon) {
              bestDist = 0;
              bestUser = userTok;
              break;
            }
            const d = levenshtein(recipeCanon, userTok);
            if (d < bestDist) {
              bestDist = d;
              bestUser = userTok;
            }
          }

          // assign confidence: 0-1 => high, 2 => medium, >2 => low
          let conf: 'high' | 'medium' | 'low' = 'low';
          if (bestDist <= 1) conf = 'high';
          else if (bestDist === 2) conf = 'medium';
          else conf = 'low';

          confs[(ing.name || ing.original || '').toLowerCase()] = conf;

          if (bestUser && bestDist <= 2) {
            // Consider this owned (high or medium)
            owned.add(bestUser);
            return;
          }
        } catch (e) {
          // ignore and continue
        }
      }));
      setOwnedIngredientNames(owned);
      setIngredientConfidences(confs);
    })();
  }, [recipe, normalizedUserIngredients]);

  const handleMarkAsCooked = async () => {
    setCooking(true);
    try {
      // Get ingredients that user owns from this recipe
      const usedIngredients = recipe?.extendedIngredients
        .filter((ing) => checkIngredientOwnership(ing.name))
        .map((ing) => ing.name) || [];

      if (usedIngredients.length === 0) {
        alert('⚠️ No matching ingredients found in your inventory!');
        setCooking(false);
        return;
      }

      if (!user) {
        alert('⚠️ Please log in to mark ingredients as used.');
        setCooking(false);
        return;
      }

      // Mark matching ingredients as consumed
      const supabase = createClient();
      const { error } = await supabase
        .from('inventory_items')
        .update({
          is_consumed: true,
          consumed_date: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_consumed', false)
        .filter('tags', 'cs', `{${usedIngredients.join(',')}}`);

      if (error) throw error;

      alert(
        `✅ Recipe completed! ${usedIngredients.length} ingredients marked as used.`
      );
      router.push('/dashboard');
    } catch (err) {
      alert('❌ Error marking ingredients as used: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setCooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading delicious recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || 'Recipe not found'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const ownedCount = recipe.extendedIngredients.filter((ing) =>
    checkIngredientOwnership(ing.name)
  ).length;
  const totalCount = recipe.extendedIngredients.length;
  const ownershipPercentage = Math.round((ownedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Recipes
        </Link>

          {/* Hero section (purple theme like screenshot) */}
          <div className="rounded-3xl overflow-hidden mb-8 shadow-xl">
            <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-8 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">Quick Idea</span>
              </div>
              <h1 className="text-4xl font-extrabold mb-3">{recipe.title}</h1>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{recipe.readyInMinutes} mins</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                  <Users className="w-4 h-4" />
                  <span>{recipe.servings} servings</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                  <Heart className="w-4 h-4" />
                  <span>{recipe.healthScore}/100</span>
                </div>
                {ownershipPercentage > 0 && (
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{ownershipPercentage}% owned</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-white">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <p className="text-sm text-gray-700">This is a quick recipe idea generated from your ingredients. Feel free to adapt it to your taste and cooking style!</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {recipe.cuisines.map((cuisine) => (
                <span
                  key={cuisine}
                  className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                >
                  🌍 {cuisine}
                </span>
              ))}
              {recipe.diets.map((diet) => (
                <span
                  key={diet}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                >
                  <Leaf className="w-3 h-3 inline mr-1" />
                  {diet}
                </span>
              ))}
              {recipe.dishTypes.slice(0, 3).map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium"
                >
                  🍽️ {type}
                </span>
              ))}
            </div>
          </div>

        {/* Main content grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Ingredients (left card) */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="inline-block w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">🍽️</span>
                Your Ingredients
              </h2>
              <div className="mb-4 p-3 bg-emerald-50 rounded-xl">
                <p className="text-sm text-emerald-700 font-medium">
                  You have {ownedCount} of {totalCount} ingredients
                </p>
                <div className="mt-2 h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all"
                    style={{ width: `${ownershipPercentage}%` }}
                  />
                </div>
              </div>
              <ul className="space-y-2">
                {recipe.extendedIngredients.map((ingredient) => {
                  const owned = checkIngredientOwnership(ingredient.name);
                  const conf = ingredientConfidences[(ingredient.name || ingredient.original || '').toLowerCase()] || 'low';
                  return (
                    <li key={ingredient.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${owned ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                        <div>
                          <div className={`text-sm ${owned ? 'text-emerald-900 font-medium' : 'text-gray-700'}`}>{ingredient.name}</div>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${conf === 'high' ? 'bg-emerald-100 text-emerald-800' : conf === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                              {conf === 'high' ? 'High' : conf === 'medium' ? 'Medium' : 'Low'} match
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{ingredient.original}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">{ingredient.amount || ''}</div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6">
                <button
                  onClick={handleMarkAsCooked}
                  disabled={cooking || ownedCount === 0}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {cooking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Marking as cooked...
                    </>
                  ) : (
                    <>
                      <Flame className="w-5 h-5" />
                      I Cooked This!
                    </>
                  )}
                </button>
                {ownedCount === 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">You don't have any ingredients for this recipe</p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions & Nutrition (right) */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cooking Instructions</h2>
              {recipe.analyzedInstructions.length > 0 ? (
                <ol className="space-y-6">
                  {recipe.analyzedInstructions[0].steps.map((step) => (
                    <li key={step.number} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mt-1">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 leading-relaxed">{step.step}</p>
                        {step.length && (
                          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {step.length.number} {step.length.unit}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: recipe.summary }} />
              )}
            </div>

            {/* Nutrition */}
            {recipe.nutrition && (
              <div className="bg-white/70 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Nutrition Facts
                </h2>

                {/* Caloric breakdown */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-red-600">
                      {Math.round(recipe.nutrition.caloricBreakdown.percentProtein)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Protein</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-amber-600">
                      {Math.round(recipe.nutrition.caloricBreakdown.percentFat)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Fat</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {Math.round(recipe.nutrition.caloricBreakdown.percentCarbs)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Carbs</p>
                  </div>
                </div>

                {/* Key nutrients */}
                <div className="grid grid-cols-2 gap-4">
                  {recipe.nutrition.nutrients
                    .filter((n) =>
                      ['Calories', 'Protein', 'Fat', 'Carbohydrates', 'Fiber', 'Sugar'].includes(
                        n.name
                      )
                    )
                    .map((nutrient) => (
                      <div
                        key={nutrient.name}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-700 font-medium">
                          {nutrient.name}
                        </span>
                        <span className="text-gray-900 font-bold">
                          {Math.round(nutrient.amount)}
                          {nutrient.unit}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
