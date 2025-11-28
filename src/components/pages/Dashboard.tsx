"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Bell,
  Utensils,
  BarChart3,
  ShoppingBasket,
  CalendarDays,
  Globe2,
  ChevronDown,
} from "lucide-react";
import WelcomeSection from "./Welcome";
import { ExpiryAlert } from "@/components/ExpiryAlert";
import { createClient } from "@/lib/supabase/client";
import { getSettings } from "@/lib/settings";
import { isLocalModelAvailable, generateLocalRecipe } from "@/lib/recipes/localRnn";
import type { InventoryItemDB } from "@/lib/supabase-types";
import { useAuth } from "@/contexts/AuthContext";

export default function FoodDashboard() {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItemDB[]>([]);
  const [consumedItems30d, setConsumedItems30d] = useState<InventoryItemDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    title: string;
    image?: string;
    source?: string;
    id?: number | string;
    readyInMinutes?: number;
    servings?: number;
    cuisine?: string;
    ingredients?: { name: string; amount?: string }[];
  }>>([]);

  const [localAIReady, setLocalAIReady] = useState<boolean>(false);
  const [enhanced, setEnhanced] = useState<Array<{
    title: string;
    image?: string;
    source?: string;
    id?: number | string;
    readyInMinutes?: number;
    servings?: number;
  }>>([]);
  const [discoverMore, setDiscoverMore] = useState(false);
  const [showOnlySugran, setShowOnlySugran] = useState<boolean>(true);
  const [wasteReducedKg, setWasteReducedKg] = useState<number | null>(null);
  const [estimatedMealsPerWeek, setEstimatedMealsPerWeek] = useState<number>(0);
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(new Set());
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [cuisineDropdownOpen, setCuisineDropdownOpen] = useState<boolean>(false);
  const [cuisineSearchQuery, setCuisineSearchQuery] = useState<string>("");
  const [recipeSearchQuery, setRecipeSearchQuery] = useState<string>("");
  const [recipePageIndex, setRecipePageIndex] = useState<number>(0);
  const [previousButtonClicks, setPreviousButtonClicks] = useState<number>(0);
  const [showAllRecipes, setShowAllRecipes] = useState<boolean>(false);

  const [previousUser, setPreviousUser] = useState(user);

  // Ensure expiry alert will show on login by clearing any session dismissal flag
  // Only clear when user actually logs in, not on every dashboard navigation
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // Only clear dismissal flag when user logs in (transitions from no user to having a user)
        const isNewLogin = !previousUser && user;
        if (isNewLogin) {
          sessionStorage.removeItem("expiryAlertDismissed");
        }
        setPreviousUser(user);
      }
    } catch (e) {
      // ignore
    }
  }, [user, previousUser]);

  // Auto-enable all recipes for admin user
  useEffect(() => {
    if (user?.email === 'puregreyhat@gmail.com') {
      setShowAllRecipes(true);
    }
  }, [user]);

  // Fetch inventory from Supabase and recently consumed items (for waste calculations)
  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_consumed', false)
          .order('days_until_expiry', { ascending: true });

        if (error) {
          console.error('Error fetching inventory:', error);
        } else {
          setInventoryItems(data || []);
        }
      } catch (err) {
        console.error('Failed to load inventory:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchConsumedItems = async () => {
      if (!user) return;
      try {
        const supabase = createClient();
        const d = new Date();
        d.setDate(d.getDate() - 30);
        const iso = d.toISOString();
        const { data: consumed, error: consErr } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_consumed', true)
          .gte('consumed_date', iso)
          .order('consumed_date', { ascending: false });

        if (consErr) {
          console.error('Error fetching consumed items:', consErr);
        } else {
          setConsumedItems30d(consumed || []);
        }
      } catch (err) {
        console.error('Failed to load consumed items:', err);
      }
    };

    // invoke loaders
    fetchInventory();
    fetchConsumedItems();
  }, [user]);

  // Fetch recipe suggestions (separate effect; depends on inventory length so suggestions update when items change)
  useEffect(() => {
    const fetchSuggestions = async () => {
      setRecipeLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('source', 'sugran');
        if (showOnlySugran) params.set('all', 'true');
        if (showAllRecipes) params.set('limit', '100');
        const url = `/api/recipes/suggestions?${params.toString()}`;
        console.log('[Dashboard] Fetching suggestions from:', url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        console.log('[Dashboard] Response status:', resp.status);
        if (resp.ok) {
          const j = await resp.json();
          console.log('[Dashboard] Received suggestions:', j.suggestions?.length || 0);
          const newSuggestions = Array.isArray(j.suggestions) ? j.suggestions : [];
          setSuggestions(newSuggestions);

          // Trigger Telegram recipe notification when recipes available
          if (newSuggestions.length > 0) {
            // Only send if we haven't sent today (prevent spam)
            const lastSentKey = 'telegram_recipe_notification_sent';
            const lastSent = sessionStorage.getItem(lastSentKey);
            const today = new Date().toDateString();

            if (lastSent !== today) {
              fetch('/api/telegram/send-recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipes: newSuggestions.slice(0, 10),
                  recipeCount: newSuggestions.length,
                }),
              })
                .then((res) => res.json())
                .then((result) => {
                  if (result.success) {
                    console.log('[Dashboard] Recipe notification sent via Telegram');
                    sessionStorage.setItem(lastSentKey, today);
                  }
                })
                .catch((err) => {
                  console.log('[Dashboard] Telegram recipe notification skipped:', err.message);
                });
            }
          }
        } else {
          const errText = await resp.text();
          console.error('Failed to load suggestions', resp.status, errText);
        }
      } catch (e) {
        console.error('Error fetching suggestions', e);
      } finally {
        setRecipeLoading(false);
      }
    };
    if (user) {
      fetchSuggestions();
    }
  }, [user, inventoryItems.length, showOnlySugran, showAllRecipes]);

  // Extract unique cuisines from suggestions dynamically
  useEffect(() => {
    const cuisines = suggestions
      .map((recipe) => recipe.cuisine)
      .filter((cuisine): cuisine is string => cuisine !== undefined && typeof cuisine === 'string')
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index)
      .sort();

    setAvailableCuisines(cuisines);
    // Reset selected cuisines when available cuisines change
    setSelectedCuisines(new Set());
  }, [suggestions]);

  // Estimate meals/week and compute wasteReduced when consumed items change or inventory updates
  useEffect(() => {
    // helper: convert common units to kg (estimates)
    function toKg(quantity: number | undefined, unit: string | undefined) {
      const q = Number(quantity || 0);
      if (!unit) return q * 0.2; // assume pieces-ish
      const u = unit.toLowerCase();
      if (u.includes('kg')) return q;
      if (u.includes('g')) return q / 1000;
      if (u.includes('gram')) return q / 1000;
      if (u.includes('ml')) return q / 1000; // approximate density 1
      if (u.includes('l')) return q; // liters ~ kg (water) approximate
      if (u.includes('pcs') || u.includes('pc') || u.includes('piece') || u.includes('count')) return q * 0.2; // avg 200g each
      // fallback: assume 200g each
      return q * 0.2;
    }

    // estimate total edible mass in pantry
    const totalKg = inventoryItems.reduce((acc, it) => acc + toKg(it.quantity, it.unit), 0);
    // assume 0.5 kg per meal
    const mealsPerWeek = Math.max(0, Math.floor((totalKg / 0.5)));
    setEstimatedMealsPerWeek(mealsPerWeek);

    // compute waste reduced as total mass of items consumed in last 30 days
    const consumedKg = consumedItems30d.reduce((acc, it) => acc + toKg(it.quantity, it.unit), 0);
    setWasteReducedKg(consumedKg);
  }, [inventoryItems, consumedItems30d]);

  // const recipes = [
  //   {
  //     title: "Tomato Pasta",
  //     img: "https://centslessdeals.com/wp-content/uploads/2022/06/One-Pot-Creamy-Tomato-Pasta-TheShortcutKitchen-8.jpg",
  //   },
  //   {
  //     title: "Garlic Bread",
  //     img: "https://bing.com/th?id=OSK.77d6b9a9f8d18c7b8b7566fcfb11e902",
  //   },
  // ];

  // mealPlan placeholder removed — using dynamic suggestions/estimates instead

  // lightweight derived values used by the UI
  const expiringItemsGrouped = inventoryItems.map((it) => ({
    name: (it.product_name || 'Item') as string,
    quantity: (it.quantity ?? 0) as number,
    unit: (it.unit ?? '') as string,
    expiry: typeof it.days_until_expiry === 'number' ? `${String(it.days_until_expiry)} days` : 'Unknown',
    action: typeof it.days_until_expiry === 'number' && it.days_until_expiry <= 3 ? 'Use soon' : 'Plan',
    tags: it.tags || [],
  }));

  const summary = {
    foodTracked: inventoryItems.length,
    expiringSoon: expiringItemsGrouped.filter((x) => x.expiry !== 'Unknown' && Number(String(x.expiry).split(' ')[0]) <= 7).length,
    wasteReduced: wasteReducedKg !== null ? Math.round(wasteReducedKg) : 0,
  };

  // Compute how many suggestions are exact/fully-available matches (all ingredients present)
  const possibleNowCount = suggestions.reduce((acc, s) => {
    // s may come from Sugran (has matchedIngredientCount/totalIngredientCount, matched, missing)
    const matched = (s as any).matchedIngredientCount ?? (Array.isArray((s as any).matched) ? (s as any).matched.length : 0);
    const total = (s as any).totalIngredientCount ?? (Array.isArray((s as any).ingredients) ? (s as any).ingredients.length : 0);
    const missingArr = (s as any).missing ?? (s as any).missingIngredients ?? [];

    // If the backend already marked isExactNow (Sugran), respect it
    if ((s as any).isExactNow === true) return acc + 1;

    // Otherwise apply the same "ignore common staples" rule here for template suggestions
    const STAPLES = ['water', 'salt', 'oil', 'sugar', 'pepper'];
    const isStaple = (name: string) => {
      const n = String(name || '').toLowerCase();
      return STAPLES.some(s => n.includes(s) || s.includes(n));
    };

    const stapleMissingCount = Array.isArray(missingArr) ? missingArr.filter((m: string) => isStaple(m)).length : 0;
    const missingNonStaples = Array.isArray(missingArr) ? missingArr.filter((m: string) => !isStaple(m)) : [];

    // Consider exact match when there are no non-staple missing ingredients and at most one staple missing,
    // or when matched >= total (defensive).
    if ((Array.isArray(missingArr) && missingNonStaples.length === 0 && stapleMissingCount <= 1) || (typeof matched === 'number' && typeof total === 'number' && total > 0 && matched >= total)) {
      return acc + 1;
    }
    return acc;
  }, 0);

  // Filter cuisines based on search query
  const filteredCuisines = availableCuisines.filter((cuisine) =>
    cuisine.toLowerCase().includes(cuisineSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen font-['Poppins'] bg-[#FDFBF7] relative">
      <WelcomeSection />

      {/* Expiry alert popup */}
      <ExpiryAlert items={inventoryItems} />

      <div id="content-section" className="p-6 md:p-12 max-w-7xl mx-auto relative z-0 pb-32 md:pb-12 -mt-20">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {Object.entries(summary).map(([key, value], idx) => {
            let icon,
              title: string = " ",
              gradient: string = "", // Unused in new design
              blink = false;

            switch (key) {
              case "foodTracked":
                icon = <Utensils className="w-6 h-6" />;
                title = "Pantry Items";
                break;
              case "expiringSoon":
                icon = <Bell className="w-6 h-6" />;
                title = "Expiring Soon";
                blink = true;
                break;
              case "wasteReduced":
                icon = <BarChart3 className="w-6 h-6" />;
                title = "Waste Saved";
                break;
            }

            return (
              <SummaryCard
                key={key}
                icon={icon}
                title={title}
                value={value}
                gradient={gradient}
                blink={blink}
                idx={idx}
              />
            );
          })}
        </div>

        {/* Inventory Section */}
        <Section title="Pantry Snapshot" icon={<ShoppingBasket className="w-5 h-5" />}>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-3xl border border-stone-100 p-6 bg-white shadow-sm h-40 animate-pulse">
                  <div className="h-6 w-3/4 bg-stone-100 rounded-full mb-4" />
                  <div className="h-4 w-1/2 bg-stone-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : expiringItemsGrouped.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-white border border-stone-100 shadow-sm">
              <div className="inline-block p-4 bg-stone-50 rounded-full mb-4">
                <ShoppingBasket className="w-8 h-8 text-stone-300" />
              </div>
              <p className="text-stone-500 text-lg font-medium">Your pantry is empty.</p>
              <p className="text-stone-400 text-sm mt-1">Scan a receipt to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {expiringItemsGrouped.slice(0, 6).map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="rounded-3xl border border-stone-100 p-6 bg-white shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-serif font-bold text-stone-800 text-lg mb-1">{item.name}</h3>
                        <p className="text-xs text-stone-500">{item.quantity}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.action === 'Use soon' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                          {item.action}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-stone-50 flex justify-between items-center">
                      <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">Expires in</span>
                      <span className={`font-bold ${typeof item.expiry === 'string' && item.expiry.includes('days') && parseInt(item.expiry) <= 3
                        ? 'text-amber-600'
                        : 'text-stone-600'
                        }`}>
                        {item.expiry}
                      </span>
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.tags.slice(0, 3).map((tag: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-1 bg-stone-50 rounded-md text-stone-500 font-medium border border-stone-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Section>

        {/* Recipes Section */}
        <Section title="Recipe Suggestions" icon={<Utensils className="w-5 h-5" />}>
          {showAllRecipes && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3"
            >
              <span className="text-2xl">🌿</span>
              <p className="text-emerald-800 font-medium">
                All recipes unlocked. Enjoy your sustainable cooking journey!
              </p>
            </motion.div>
          )}

          <div id="recipe-suggestions" className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-sm">
            {/* Filter Dropdown and Search Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-8">
              {/* Cuisine Filter Dropdown */}
              <div className="relative z-20 w-full lg:w-auto">
                <button
                  onClick={() => setCuisineDropdownOpen(!cuisineDropdownOpen)}
                  className="w-full lg:w-auto flex items-center justify-between gap-3 px-5 py-3 bg-white border border-stone-200 rounded-xl hover:border-emerald-500 transition-all text-sm font-medium text-stone-600"
                >
                  <span>
                    {selectedCuisines.size === 0
                      ? 'Filter by Cuisine'
                      : `${selectedCuisines.size} cuisine${selectedCuisines.size > 1 ? 's' : ''} selected`}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${cuisineDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {cuisineDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 mt-2 w-full lg:w-80 bg-white border border-stone-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-stone-100">
                      <input
                        type="text"
                        placeholder="Search cuisines..."
                        value={cuisineSearchQuery}
                        onChange={(e) => setCuisineSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto p-2">
                      {filteredCuisines.length > 0 ? (
                        filteredCuisines.map((cuisine) => (
                          <label
                            key={cuisine}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCuisines.has(cuisine)}
                              onChange={() => {
                                const newSet = new Set(selectedCuisines);
                                if (newSet.has(cuisine)) {
                                  newSet.delete(cuisine);
                                } else {
                                  newSet.add(cuisine);
                                }
                                setSelectedCuisines(newSet);
                                setRecipePageIndex(0);
                              }}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                            />
                            <span className="text-sm text-stone-700">{cuisine}</span>
                          </label>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-sm text-stone-400 text-center">
                          No cuisines found
                        </div>
                      )}
                    </div>

                    <div className="border-t border-stone-100 p-3 flex gap-2 bg-stone-50">
                      <button
                        onClick={() => {
                          setSelectedCuisines(new Set());
                          setRecipePageIndex(0);
                        }}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-white border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setCuisineDropdownOpen(false)}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors shadow-sm"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Search Bar */}
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search recipes or ingredients..."
                  value={recipeSearchQuery}
                  onChange={(e) => {
                    setRecipeSearchQuery(e.target.value);
                    setRecipePageIndex(0);
                  }}
                  className="w-full px-5 py-3 border border-stone-200 rounded-xl bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {recipeLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-stone-50 p-4 h-80 animate-pulse">
                    <div className="w-full h-48 bg-stone-200 rounded-xl mb-4" />
                    <div className="h-6 w-3/4 bg-stone-200 rounded-full mb-2" />
                    <div className="h-4 w-1/2 bg-stone-200 rounded-full" />
                  </div>
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-4 bg-stone-50 rounded-full mb-4">
                  <Utensils className="w-8 h-8 text-stone-300" />
                </div>
                <p className="text-stone-500 font-medium">No recipe suggestions yet.</p>
                <p className="text-sm text-stone-400 mt-1">Try adding items to your pantry!</p>
              </div>
            ) : (() => {
              // Filter logic (same as before)
              const filtered = (
                showOnlySugran
                  ? suggestions.filter((s) => {
                    if (!s) return false;
                    if (typeof s.id === 'string' && s.id.startsWith('sugran-')) return true;
                    if (typeof s.source === 'string' && s.source.includes('sugran')) return true;
                    if (typeof s.image === 'string' && s.image.includes('sugran.vercel.app')) return true;
                    return false;
                  })
                  : suggestions
              )
                .filter((s) => {
                  if (selectedCuisines.size === 0) return true;
                  const sCuisine = (s as unknown as Record<string, unknown>).cuisine as string | undefined;
                  return sCuisine && selectedCuisines.has(sCuisine);
                })
                .filter((s) => {
                  if (!recipeSearchQuery.trim()) return true;
                  const query = recipeSearchQuery.trim().toLowerCase();
                  if (query.includes(',')) {
                    const searchIngredients = query.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0);
                    if (searchIngredients.length === 0) return true;
                    const recipeIngredients = s.ingredients;
                    if (!Array.isArray(recipeIngredients)) return false;
                    return searchIngredients.every(searchIng =>
                      recipeIngredients.some((recipeIng) =>
                        recipeIng.name && recipeIng.name.toLowerCase().includes(searchIng)
                      )
                    );
                  } else {
                    const title = String(s.title || '').toLowerCase();
                    const titleMatch = title.includes(query);
                    const recipeIngredients = s.ingredients;
                    const ingredientMatch = Array.isArray(recipeIngredients) &&
                      recipeIngredients.some((recipeIng) =>
                        recipeIng.name && recipeIng.name.toLowerCase().includes(query)
                      );
                    return titleMatch || ingredientMatch;
                  }
                });

              const itemsPerPage = 6;
              const totalPages = Math.ceil(filtered.length / itemsPerPage);
              const startIdx = recipePageIndex * itemsPerPage;
              const endIdx = startIdx + itemsPerPage;
              const displayedRecipes = filtered.slice(startIdx, endIdx);

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {displayedRecipes.map((s, i) => {
                      const recipeUrl = s.id
                        ? `/recipes/${encodeURIComponent(String(s.id))}?title=${encodeURIComponent(String(s.title))}&image=${encodeURIComponent(String(s.image || ''))}`
                        : '#';

                      return (
                        <Link
                          key={String(s.id || i)}
                          href={recipeUrl}
                          className="block"
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                            className="group rounded-2xl bg-white border border-stone-100 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer"
                          >
                            <div className="relative h-87 overflow-hidden">
                              {s.image ? (
                                <img
                                  src={String(s.image)}
                                  alt={String(s.title)}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                                  <Utensils size={40} />
                                </div>
                              )}

                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                              <div className="absolute bottom-0 left-0 right-0 p-5">
                                <h4 className="text-white font-serif font-bold text-lg leading-tight mb-1 drop-shadow-sm line-clamp-2">
                                  {s.title}
                                </h4>
                                {(() => {
                                  const sObj = s as unknown as Record<string, unknown>;
                                  const cuisine = String(sObj.cuisine || '');
                                  return cuisine && (
                                    <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-medium text-white uppercase tracking-wider border border-white/10">
                                      {cuisine}
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* Matched Badge */}
                              {(() => {
                                const sObj = s as unknown as Record<string, unknown>;
                                const matchedIngredientCount = sObj.matchedIngredientCount as number | undefined;
                                const totalIngredientCount = sObj.totalIngredientCount as number | undefined;

                                if (typeof matchedIngredientCount === 'number' && typeof totalIngredientCount === 'number' && matchedIngredientCount > 0) {
                                  return (
                                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-white/50">
                                      <span className="text-emerald-800 font-bold text-xs">{matchedIngredientCount}/{totalIngredientCount}</span>
                                      <span className="text-emerald-600 text-[10px] font-medium uppercase tracking-wide">Found</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-stone-100">
                    <p className="text-sm text-stone-500 font-medium">
                      Showing {displayedRecipes.length > 0 ? startIdx + 1 : 0} - {Math.min(endIdx, filtered.length)} of {filtered.length} recipes
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (recipePageIndex === 0) {
                            const newClicks = previousButtonClicks + 1;
                            setPreviousButtonClicks(newClicks);
                            if (newClicks === 5) {
                              setShowAllRecipes(true);
                              setPreviousButtonClicks(0);
                            }
                          } else {
                            setRecipePageIndex(Math.max(0, recipePageIndex - 1));
                            setPreviousButtonClicks(0);
                          }
                        }}
                        disabled={recipePageIndex === 0}
                        className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
                      >
                        Previous
                      </button>

                      <span className="text-sm font-semibold text-stone-700 px-3 bg-stone-50 py-2 rounded-xl border border-stone-200">
                        {recipePageIndex + 1} / {totalPages}
                      </span>

                      <button
                        onClick={() => setRecipePageIndex(Math.min(totalPages - 1, recipePageIndex + 1))}
                        disabled={recipePageIndex >= totalPages - 1}
                        className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </Section>

        {/* Meal Plan Section */}
        <Section title="Meal Planning Overview" icon={<CalendarDays className="w-5 h-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ y: -5 }}
              className="rounded-3xl bg-white border border-stone-100 p-6 shadow-sm text-center"
            >
              <p className="text-stone-400 text-xs uppercase tracking-wider font-bold mb-2">Possible Recipes</p>
              <p className="text-4xl font-serif font-bold text-emerald-800 mb-1">{possibleNowCount}</p>
              <p className="text-xs text-stone-400">Ready to cook now</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="rounded-3xl bg-white border border-stone-100 p-6 shadow-sm text-center"
            >
              <p className="text-stone-400 text-xs uppercase tracking-wider font-bold mb-2">Meals / Week</p>
              <p className="text-4xl font-serif font-bold text-emerald-800 mb-1">{estimatedMealsPerWeek}</p>
              <p className="text-xs text-stone-400">Estimated from pantry</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="rounded-3xl bg-white border border-stone-100 p-6 shadow-sm text-center"
            >
              <p className="text-stone-400 text-xs uppercase tracking-wider font-bold mb-2">Expiring Soon</p>
              <p className="text-4xl font-serif font-bold text-amber-600 mb-1">{summary.expiringSoon}</p>
              <p className="text-xs text-stone-400">Items within 7 days</p>
            </motion.div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/inventory" className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-700 text-white font-medium rounded-full shadow-lg hover:bg-emerald-800 hover:shadow-emerald-900/20 transition-all transform hover:-translate-y-1">
              <ShoppingBasket size={18} />
              View Full Grocery List
            </Link>
          </div>
        </Section>

        {/* Sustainability Stats */}
        <Section title="Sustainability Stats" icon={<Globe2 className="w-5 h-5" />}>
          <div className="flex flex-col sm:flex-row gap-6 justify-between">
            <StatWidget label="Food Waste Saved" value={wasteReducedKg === null ? '—' : `${wasteReducedKg.toFixed(1)} kg`} />
            <StatWidget label="CO₂ Saved (est.)" value={wasteReducedKg === null ? '—' : `${(wasteReducedKg * 2.5).toFixed(1)} kg`} />
            <StatWidget label="Money Saved (est.)" value={wasteReducedKg === null ? '—' : `₹${Math.round(wasteReducedKg * 150)}`} />
          </div>
        </Section>

        {/* Quick Action: Scan QR Code */}
        <section className="mb-20">
          <motion.a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/scanner';
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="block group"
          >
            <div className="bg-stone-800 rounded-[2rem] p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-emerald-500/20 transition-colors" />

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-serif font-bold mb-3 text-emerald-50">Add New Items</h3>
                  <p className="text-stone-300 text-lg max-w-xl font-light">Scan a receipt or barcode to instantly update your pantry.</p>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform border border-white/10">
                  <span className="text-3xl text-emerald-100">→</span>
                </div>
              </div>
            </div>
          </motion.a>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  gradient, // Kept for API compatibility but unused in new design
  blink = false,
  idx = 0,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  gradient: string;
  blink?: boolean;
  idx?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{
        duration: 0.4,
        delay: (idx || 0) * 0.1,
        ease: "easeOut"
      }}
      className="rounded-3xl p-6 bg-white border border-stone-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3 bg-stone-50 rounded-2xl text-emerald-800">
          {icon}
        </div>
        {blink && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        )}
      </div>
      <h3 className="text-xs font-semibold text-stone-500 tracking-wider uppercase mb-1">{title}</h3>
      <motion.p
        className="text-3xl font-serif font-bold text-emerald-900"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: (idx || 0) * 0.1 + 0.2, duration: 0.5 }}
      >
        {value}
      </motion.p>
    </motion.div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16 relative">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-emerald-100/50 rounded-xl text-emerald-700">
          {icon}
        </div>
        <h2 className="text-2xl font-serif font-bold text-emerald-900 tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function StatWidget({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="flex-1 rounded-3xl bg-white border border-stone-100 p-6 text-center shadow-sm hover:shadow-md transition-all"
    >
      <p className="text-stone-500 text-xs uppercase tracking-wider font-semibold mb-2">{label}</p>
      <p className="text-2xl font-serif font-bold text-emerald-800">{value}</p>
    </motion.div>
  );
}
