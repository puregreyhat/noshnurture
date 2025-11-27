'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Users,
  Heart,
  Leaf,
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { normalizeIngredientName, normalizeIngredientNameWithScore, levenshtein } from '@/lib/ingredients/normalize';
import { InventoryItemDB } from '@/lib/supabase-types';
import normalizeInventoryItems from '@/lib/ingredients/userInventoryNormalizer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguagePreference } from '@/hooks/useLanguagePreference';

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

export default function RecipePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { language, updateLanguage, isLoaded } = useLanguagePreference();

  const recipeId = params.id as string;
  const recipeTitle = searchParams.get('title') || 'Recipe';
  const recipeImage = searchParams.get('image') || '';

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [cooking, setCooking] = useState(false);
  const [error, setError] = useState('');
  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [normalizedUserIngredients, setNormalizedUserIngredients] = useState<string[]>([]);
  const [ownedIngredientNames, setOwnedIngredientNames] = useState(new Set<string>());
  const [ingredientConfidences, setIngredientConfidences] = useState<{ [key: string]: 'high' | 'medium' | 'low' }>({});
  const [toasts, setToasts] = useState<Array<{ id: number; content: React.ReactNode; type: 'success' | 'error' | 'info' }>>([]);
  const [translatedSteps, setTranslatedSteps] = useState<{ [key: number]: string }>({});
  const [translatingSteps, setTranslatingSteps] = useState(false);

  // Local translation handlers removed — site relies on Google Translate widget only.

  function addToast(content: React.ReactNode, type: 'success' | 'error' | 'info' = 'info', timeout = 3000) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((s) => [...s, { id, content, type }]);
    if (timeout > 0) {
      setTimeout(() => {
        removeToast(id);
      }, timeout);
    }
  }

  function removeToast(id: number) {
    setToasts((s) => s.filter((t) => t.id !== id));
  }

  // Helper to remove redundant numeric prefixes like "1) ", "1. ", "1 - " from step text
  const stripLeadingNumber = (text?: string): string => {
    if (!text) return '';
    return String(text).replace(/^\s*\d+\s*(?:\)|\.|:|-)\s*/, '').trim();
  };

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
        // fetch tags and product_name so we can normalize product names when tags don't contain canonical values
        .select('tags, product_name')
        .eq('user_id', user.id)
        .eq('is_consumed', false);

      if (error) throw error;

      // Use centralized normalizer so recipe detail and suggestions use the same matching
      const rows = (data || []) as InventoryItemDB[];
      const { available } = await normalizeInventoryItems(rows);
      const uniq = Array.from(available.values());
      setUserIngredients(uniq);
      setNormalizedUserIngredients(uniq);
    } catch (err) {
      console.error('Error fetching user ingredients:', err);
    }
  };

  const checkIngredientOwnership = (ingredientName: string): boolean => {
    // ONLY use precomputed confidences from exact matching
    // No fallbacks - only 'high' counts as owned
    const key = ingredientName.toLowerCase().trim();
    const conf = ingredientConfidences[key];
    return conf === 'high';
  };

  // When recipe or normalizedUserIngredients change, compute which recipe ingredients are owned
  useEffect(() => {
    if (!recipe || !recipe.extendedIngredients || normalizedUserIngredients.length === 0) {
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

          // Compare against user's canonical ingredients
          let found = false;
          for (const u of Array.from(normalizedUserIngredients)) {
            const userTok = u.toLowerCase().trim();
            // Check for exact match
            if (userTok === recipeCanon) {
              found = true;
              owned.add(userTok);
              confs[(ing.name || ing.original || '').toLowerCase()] = 'high';
              break;
            }
            // Also check substring match (fallback for fuzzy-matched inventory)
            if (rawName.toLowerCase().includes(userTok) || userTok.includes(rawName.toLowerCase())) {
              found = true;
              owned.add(userTok);
              confs[(ing.name || ing.original || '').toLowerCase()] = 'high';
              break;
            }
          }

          // If not found, mark as low confidence but don't add
          if (!found) {
            confs[(ing.name || ing.original || '').toLowerCase()] = 'low';
          }
        } catch (e) {
          // ignore and continue
          confs[(ing.name || ing.original || '').toLowerCase()] = 'low';
        }
      }));
      setOwnedIngredientNames(owned);
      setIngredientConfidences(confs);
    })();
  }, [recipe, normalizedUserIngredients]);

  // Local automatic step translation removed — rely on Google Translate widget only.

  const handleMarkAsCooked = async () => {
    setCooking(true);
    try {
      if (!user) {
        addToast('⚠️ Please log in to mark ingredients as used.', 'error', 3000);
        setCooking(false);
        return;
      }

      if (!recipe) {
        addToast('❌ Recipe data missing', 'error', 3000);
        setCooking(false);
        return;
      }

      // Get ingredients that user owns from this recipe
      const usedIngredients = recipe.extendedIngredients
        .filter((ing) => checkIngredientOwnership(ing.name))
        .map((ing) => ing.name) || [];

      if (usedIngredients.length === 0) {
        addToast('⚠️ No matching ingredients found in your inventory!', 'error', 3000);
        setCooking(false);
        return;
      }

      // Fetch all user inventory items
      const supabase = createClient();
      const { data: allItems, error: fetchErr } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_consumed', false);

      if (fetchErr) throw fetchErr;

      // Find items that match the used ingredients
      const itemsToConsume = (allItems || []).filter(item => {
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const canonicalTag = tags.find((t: unknown) => typeof t === 'string' && t.startsWith('canonical:'));

        if (canonicalTag) {
          const canonical = String(canonicalTag).replace('canonical:', '').toLowerCase();
          return usedIngredients.some(ing =>
            canonical.includes(ing.toLowerCase()) || ing.toLowerCase().includes(canonical)
          );
        }

        // Fallback to product_name matching
        const productName = String(item.product_name || '').toLowerCase();
        return usedIngredients.some(ing =>
          productName.includes(ing.toLowerCase()) || ing.toLowerCase().includes(productName)
        );
      });

      if (itemsToConsume.length === 0) {
        addToast('⚠️ Could not find matching items in your inventory', 'error', 3000);
        setCooking(false);
        return;
      }

      // Mark all matching items as consumed
      const { error: updateErr } = await supabase
        .from('inventory_items')
        .update({
          is_consumed: true,
          consumed_date: new Date().toISOString(),
        })
        .in('id', itemsToConsume.map(item => item.id));

      if (updateErr) throw updateErr;

      addToast(
        `✅ Recipe completed! ${itemsToConsume.length} ingredient${itemsToConsume.length !== 1 ? 's' : ''} marked as used.`,
        'success',
        3000
      );

      // Redirect back to dashboard after success
      setTimeout(() => {
        window.history.back();
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addToast(`❌ Error: ${errorMsg}`, 'error', 4000);
    } finally {
      setCooking(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 bg-[#FDFBF7] flex items-center justify-center z-50 font-['Poppins']"
        animate={{ opacity: showLoadingAnimation ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        onAnimationComplete={() => {
          if (!showLoadingAnimation) {
            // Animation complete, allow page to render
          }
        }}
      >
        {showLoadingAnimation && (
          <>
            {/* Dramatic backdrop blur and fade */}
            <motion.div
              className="absolute inset-0 bg-stone-900/10 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />

            {/* Animated recipe card that enlarges */}
            <motion.div
              className="relative z-10 w-80 h-96 bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-100"
              initial={{
                scale: 0.8,
                opacity: 0,
                y: 100
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              onAnimationComplete={() => {
                // Wait a moment then enlarge dramatically
                setTimeout(() => {
                  setShowLoadingAnimation(false);
                }, 800);
              }}
            >
              {/* Card image - actual recipe image or placeholder */}
              <motion.div
                className="w-full h-full relative overflow-hidden"
                animate={{ scale: showLoadingAnimation ? 1 : 20, opacity: showLoadingAnimation ? 1 : 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                {recipeImage ? (
                  <>
                    {/* Recipe image background */}
                    <img
                      src={recipeImage}
                      alt={recipeTitle}
                      className="w-full h-full object-cover"
                    />
                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/30 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-stone-200" />
                )}

                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />

                {/* Loading content overlay - appears on top */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  {/* Recipe title */}
                  <h3 className="text-white font-serif font-bold text-xl text-center px-4 mb-4 drop-shadow-lg">
                    {recipeTitle}
                  </h3>

                  {/* Loading spinner */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-12 h-12 text-white/90" />
                  </motion.div>
                  <p className="text-white/80 font-medium text-sm mt-3 drop-shadow-md">Preparing...</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Particle effects around card */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-emerald-500 rounded-full"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  x: Math.cos((i / 6) * Math.PI * 2) * 200,
                  y: Math.sin((i / 6) * Math.PI * 2) * 200,
                  opacity: 0,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: '-4px',
                  marginTop: '-4px',
                }}
              />
            ))}
          </>
        )}
      </motion.div>
    );
  }

  // Wait for language preference to load before rendering
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your language preference...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 font-['Poppins']">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">Oops!</h2>
          <p className="text-stone-600 mb-6">{error || 'Recipe not found'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-full hover:bg-emerald-800 transition-colors font-medium"
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

  // Sort ingredients so that owned/matched ingredients appear first
  const sortedIngredients = recipe.extendedIngredients.slice().sort((a, b) => {
    const aOwned = checkIngredientOwnership(a.name) ? 1 : 0;
    const bOwned = checkIngredientOwnership(b.name) ? 1 : 0;
    // put owned items first
    return bOwned - aOwned;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-['Poppins']">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-stone-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32 max-w-5xl">
        {/* Top controls */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* Hero section */}
        <div className="rounded-[2rem] overflow-hidden mb-8 shadow-xl relative group">
          <div className="absolute inset-0 bg-stone-900/40 z-10 transition-opacity group-hover:bg-stone-900/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-transparent z-10" />

          {/* Background Image if available, else fallback */}
          <div className="absolute inset-0 z-0">
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-stone-800" />
            )}
          </div>

          <div className="relative z-20 p-8 md:p-12 text-white h-[400px] flex flex-col justify-end">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium border border-white/10">Quick Idea</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight text-stone-50">{recipe.title}</h1>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full text-sm border border-white/10">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{recipe.readyInMinutes} mins</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full text-sm border border-white/10">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{recipe.servings} servings</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full text-sm border border-white/10">
                <Heart className="w-4 h-4 text-emerald-400" />
                <span>{recipe.healthScore}/100</span>
              </div>
              {ownershipPercentage > 0 && (
                <div className="flex items-center gap-2 bg-emerald-600/80 backdrop-blur-md px-4 py-2 rounded-full text-sm border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{ownershipPercentage}% owned</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="px-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {recipe.cuisines.map((cuisine) => (
              <span
                key={cuisine}
                className="px-4 py-1.5 bg-stone-100 text-stone-700 rounded-full text-sm font-medium border border-stone-200"
              >
                🌍 {cuisine}
              </span>
            ))}
            {recipe.diets.map((diet) => (
              <span
                key={diet}
                className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100"
              >
                <Leaf className="w-3 h-3 inline mr-1" />
                {diet}
              </span>
            ))}
            {recipe.dishTypes.slice(0, 3).map((type) => (
              <span
                key={type}
                className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100"
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
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 sticky top-8">
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6 flex items-center gap-3">
                <span className="inline-flex w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl items-center justify-center text-sm">🍽️</span>
                Ingredients
              </h2>
              <div className="mb-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <p className="text-sm text-emerald-800 font-medium mb-2">
                  {ownedCount} of {totalCount} ingredients owned
                </p>
                <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all rounded-full"
                    style={{ width: `${ownershipPercentage}%` }}
                  />
                </div>
              </div>
              <ul className="space-y-3">
                {sortedIngredients.map((ingredient) => {
                  const owned = checkIngredientOwnership(ingredient.name);
                  const conf = ingredientConfidences[(ingredient.name || ingredient.original || '').toLowerCase()] || 'low';
                  return (
                    <li key={ingredient.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${owned ? 'bg-emerald-50/30 border border-emerald-100' : 'bg-stone-50 border border-stone-100'}`}>
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${owned ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${owned ? 'text-emerald-900' : 'text-stone-600'}`}>{ingredient.name}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{ingredient.original}</div>
                        {owned && (
                          <div className="mt-1.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-md bg-emerald-100 text-emerald-700 font-medium">
                              In Pantry
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-medium text-stone-500 bg-white px-2 py-1 rounded-lg border border-stone-100 shadow-sm whitespace-nowrap">
                        {ingredient.amount} {ingredient.unit}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-8 pt-6 border-t border-stone-100">
                <button
                  onClick={handleMarkAsCooked}
                  disabled={cooking || ownedCount === 0}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-700 text-white rounded-2xl hover:bg-emerald-800 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 hover:-translate-y-0.5"
                >
                  {cooking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <Flame className="w-5 h-5" />
                      Mark as Cooked
                    </>
                  )}
                </button>
                {ownedCount === 0 && (
                  <p className="text-xs text-stone-400 mt-3 text-center">You need at least one ingredient to cook this.</p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions & Nutrition (right) */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-8">Instructions</h2>
              {recipe.analyzedInstructions.length > 0 ? (
                <ol className="space-y-8">
                  {recipe.analyzedInstructions[0].steps.map((step) => (
                    <li key={step.number} className="relative group">
                      <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-stone-100 -z-10 group-last:hidden" />
                      <div className="flex gap-6 items-start">
                        <div className="flex-shrink-0 w-10 h-10 bg-stone-800 text-white rounded-full flex items-center justify-center font-serif font-bold text-lg shadow-md ring-4 ring-white">
                          {step.number}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-stone-700 leading-relaxed text-lg font-light">
                            {language !== 'en' && translatedSteps[step.number]
                              ? stripLeadingNumber(translatedSteps[step.number])
                              : stripLeadingNumber(step.step)}
                          </p>
                          {step.length && (
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-50 text-stone-500 text-sm border border-stone-100">
                              <Clock className="w-3.5 h-3.5" />
                              {step.length.number} {step.length.unit}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="space-y-6">
                  {String(recipe.summary || '')
                    .split(/\.(?:\s+|$)/)
                    .map(s => s.trim())
                    .filter(Boolean)
                    .map((sentence, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-stone-300 mt-2.5 flex-shrink-0" />
                        <p className="text-stone-700 leading-relaxed text-lg font-light">{sentence.trim()}{sentence.endsWith('.') ? '' : '.'}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Nutrition */}
            {recipe.nutrition && (
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
                <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">Nutrition</h2>

                {/* Caloric breakdown */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-stone-50 rounded-2xl p-5 text-center border border-stone-100">
                    <div className="text-3xl font-serif font-bold text-stone-800 mb-1">
                      {Math.round(recipe.nutrition.caloricBreakdown.percentProtein)}%
                    </div>
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">Protein</p>
                  </div>
                  <div className="bg-stone-50 rounded-2xl p-5 text-center border border-stone-100">
                    <div className="text-3xl font-serif font-bold text-stone-800 mb-1">
                      {Math.round(recipe.nutrition.caloricBreakdown.percentFat)}%
                    </div>
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">Fat</p>
                  </div>
                  <div className="bg-stone-50 rounded-2xl p-5 text-center border border-stone-100">
                    <div className="text-3xl font-serif font-bold text-stone-800 mb-1">
                      {Math.round(recipe.nutrition.caloricBreakdown.percentCarbs)}%
                    </div>
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">Carbs</p>
                  </div>
                </div>

                {/* Key nutrients */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {recipe.nutrition.nutrients
                    .filter((n) =>
                      ['Calories', 'Protein', 'Fat', 'Carbohydrates', 'Fiber', 'Sugar'].includes(
                        n.name
                      )
                    )
                    .map((nutrient) => (
                      <div
                        key={nutrient.name}
                        className="flex flex-col p-4 bg-stone-50 rounded-2xl border border-stone-100"
                      >
                        <span className="text-stone-500 text-xs uppercase tracking-wider font-medium mb-1">
                          {nutrient.name}
                        </span>
                        <span className="text-stone-800 font-serif font-bold text-lg">
                          {Math.round(nutrient.amount)}
                          <span className="text-sm font-normal text-stone-400 ml-0.5">{nutrient.unit}</span>
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toast Notifications */}
        <div className="fixed bottom-8 right-8 space-y-3 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg backdrop-blur-xl border animate-in fade-in slide-in-from-right-4 ${toast.type === 'success'
                  ? 'bg-emerald-800/90 border-emerald-700 text-white'
                  : toast.type === 'error'
                    ? 'bg-red-800/90 border-red-700 text-white'
                    : 'bg-stone-800/90 border-stone-700 text-white'
                }`}
            >
              <div className="flex-1 font-medium">{toast.content}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
