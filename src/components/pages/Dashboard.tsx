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
    <div className="min-h-screen font-['Poppins'] bg-gradient-to-br from-emerald-50 via-white to-green-100">
      <WelcomeSection />

  {/* Expiry alert popup (shows when there are items expiring within 1-2 days) */}
  <ExpiryAlert items={inventoryItems} />

      <div id="content-section" className="p-8 max-w-6xl mx-auto relative z-0 pb-32 md:pb-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {Object.entries(summary).map(([key, value], idx) => {
            let icon,
              title: string = " ",
              gradient: string = "from-gray-400 to-gray-600",
              blink = false;

            switch (key) {
              case "foodTracked":
                icon = <Utensils className="w-8 h-8 text-white drop-shadow-sm" />;
                title = "Food Items Tracked";
                gradient = "from-emerald-400 to-emerald-600";
                break;
              case "expiringSoon":
                icon = <Bell className="w-8 h-8 text-white drop-shadow-sm" />;
                title = "Expiring Soon";
                gradient = "from-teal-300 to-emerald-500"; // slightly lighter for calmer feel
                blink = true;
                break;
              case "wasteReduced":
                icon = <BarChart3 className="w-8 h-8 text-white drop-shadow-sm" />;
                title = "Waste Reduced";
                gradient = "from-emerald-500 to-green-700";
                break;
            }

            return (
              <SummaryCard
                key={key}
                icon={icon}
                title={title}
                value={value}
                gradient={gradient!}
                blink={blink}
                idx={idx}
              />
            );
          })}
        </div>

        {/* Inventory Section */}
        <Section title="Food Inventory Snapshot" icon={<ShoppingBasket className="text-emerald-600" />}>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-emerald-100 p-5 bg-white/70 backdrop-blur-xl shadow-xl">
                  <div className="h-6 w-3/4 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-shimmer" />
                  <div className="mt-3 h-4 w-1/3 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-shimmer" />
                  <div className="mt-6 h-4 w-1/2 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-shimmer" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-gradient-to-r from-gray-200 to-gray-100 animate-shimmer" />
                    <div className="h-5 w-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-100 animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : expiringItemsGrouped.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items expiring soon. Scan a QR code to add items!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiringItemsGrouped.slice(0, 6).map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="rounded-2xl border border-emerald-100 p-5 bg-white/70 backdrop-blur-xl shadow-xl hover:shadow-2xl"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-orange-600 font-medium">
                      Expires in {item.expiry}
                    </p>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-emerald-100 rounded-full text-emerald-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </Section>

        {/* Recipes Section (restored) */}
        <Section title="Recipe Suggestions" icon={<Utensils className="text-orange-500" />}>
          {showAllRecipes && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800 font-semibold">
                🎉 All 100 recipes unlocked! Showing complete recipe collection.
              </p>
            </div>
          )}
          <div id="recipe-suggestions" className="p-4">
            {/* Filter Dropdown and Search Bar - Horizontal Layout */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              {/* Cuisine Filter Dropdown - LEFT */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setCuisineDropdownOpen(!cuisineDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 whitespace-nowrap"
                >
                  <span>
                    {selectedCuisines.size === 0
                      ? 'Filter by Cuisine'
                      : `${selectedCuisines.size} cuisine${selectedCuisines.size > 1 ? 's' : ''} selected`}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform flex-shrink-0 ${cuisineDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {cuisineDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder="Search cuisines..."
                        value={cuisineSearchQuery}
                        onChange={(e) => setCuisineSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredCuisines.length > 0 ? (
                        filteredCuisines.map((cuisine) => (
                          <label
                            key={cuisine}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
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
                                setRecipePageIndex(0); // Reset to first page on filter change
                              }}
                              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-700">{cuisine}</span>
                          </label>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-sm text-gray-500 text-center">
                          No cuisines found
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-200 p-3 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCuisines(new Set());
                          setRecipePageIndex(0);
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setCuisineDropdownOpen(false)}
                        className="flex-1 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Bar - RIGHT */}
              <div className="flex-1 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search recipe by name"
                  value={recipeSearchQuery}
                  onChange={(e) => {
                    setRecipeSearchQuery(e.target.value);
                    setRecipePageIndex(0); // Reset to first page on search
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {recipeLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-white/90 border p-4 shadow-md overflow-hidden relative">
                    <div className="mb-3 rounded-md overflow-hidden bg-gray-100">
                      <div className="w-full h-64 bg-gradient-to-r from-gray-200 to-gray-100 animate-shimmer" />
                    </div>
                    <div className="h-4 w-2/3 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-shimmer" />
                    <div className="mt-2 h-4 w-1/3 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-shimmer" />
                  </div>
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No recipe suggestions yet. Try adding items to inventory or run the Sugran test.</div>
            ) : (() => {
              // Filter recipes by source, cuisine, and search query
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
                  // Filter by selected cuisines (if none selected, show all)
                  if (selectedCuisines.size === 0) return true;
                  const sCuisine = (s as unknown as Record<string, unknown>).cuisine as string | undefined;
                  return sCuisine && selectedCuisines.has(sCuisine);
                })
                .filter((s) => {
                  // Filter by search query
                  if (!recipeSearchQuery.trim()) return true;

                  const query = recipeSearchQuery.trim().toLowerCase();

                  // Check if query contains commas (indicating explicit ingredient search)
                  if (query.includes(',')) {
                    // Ingredient search: split by commas and check if recipe contains these ingredients
                    const searchIngredients = query.split(',')
                      .map(ing => ing.trim())
                      .filter(ing => ing.length > 0);

                    if (searchIngredients.length === 0) return true;

                    // Get recipe ingredients (handle both array and other formats)
                    const recipeIngredients = s.ingredients;
                    if (!Array.isArray(recipeIngredients)) return false;

                    // Check if recipe contains ALL searched ingredients
                    return searchIngredients.every(searchIng =>
                      recipeIngredients.some((recipeIng) =>
                        recipeIng.name && recipeIng.name.toLowerCase().includes(searchIng)
                      )
                    );
                  } else {
                    // Search both title AND ingredients (without commas)
                    const title = String(s.title || '').toLowerCase();
                    const titleMatch = title.includes(query);

                    // Also check ingredients
                    const recipeIngredients = s.ingredients;
                    const ingredientMatch = Array.isArray(recipeIngredients) &&
                      recipeIngredients.some((recipeIng) =>
                        recipeIng.name && recipeIng.name.toLowerCase().includes(query)
                      );

                    // Return true if either title or ingredients match
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayedRecipes.map((s, i) => (
                  <motion.div
                    key={String(s.id || i)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="rounded-xl bg-white/90 border p-4 shadow-md hover:shadow-lg overflow-hidden relative"
                  >
                    {/* Image area with overlayed View button and title */}
                    <div className="relative mb-3 rounded-md overflow-hidden bg-gray-100 shadow-sm">
                      {s.image ? (
                        <img src={String(s.image)} alt={String(s.title)} className="w-full h-64 object-cover block" />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center bg-gray-50 text-gray-300">No image</div>
                      )}

                      {/* stronger gradient overlay at bottom for title and ensure readability */}
                      <div className="absolute left-0 right-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                      {/* title overlay with semi-opaque pill for contrast */}
                      <div className="absolute left-4 bottom-4 text-white">
                        <div className="bg-black/55 px-3 py-1 rounded-md backdrop-blur-sm">
                          <h4 className="font-semibold text-sm drop-shadow-md leading-tight">{s.title}</h4>
                          {(() => {
                            const sObj = s as unknown as Record<string, unknown>;
                            const cuisine = String(sObj.cuisine || '');
                            return (
                              <p className="text-xs opacity-90 mt-0.5">
                                {cuisine && `${cuisine}`}
                              </p>
                            );
                          })()}
                        </div>
                      </div>

                      {/* matched ingredients badge top-left (overlay) */}
                      {(() => {
                        const sObj = s as unknown as Record<string, unknown>;
                        const matched = sObj.matched as number | undefined;
                        const matchedIngredientCount = sObj.matchedIngredientCount as number | undefined;
                        const totalIngredientCount = sObj.totalIngredientCount as number | undefined;
                        
                        if (typeof matched === 'number' && matched > 0) {
                          return (
                            <div className="absolute left-3 top-3 inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow-md">
                              <span>Matched</span>
                              <span className="bg-white/20 px-2 py-0.5 rounded-md">{String(matched)}</span>
                            </div>
                          );
                        }
                        
                        // Only show badge if both counts are valid and greater than 0
                        if (typeof matchedIngredientCount === 'number' && 
                            typeof totalIngredientCount === 'number' && 
                            matchedIngredientCount > 0 && 
                            totalIngredientCount > 0) {
                          return (
                            <div className="absolute left-3 top-3 inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow-md">
                              <span className="font-bold">{matchedIngredientCount}/{totalIngredientCount}</span>
                              <span className="text-xs">ingredients</span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* View button (top-right) */}
                      {s.id ? (
                        <Link
                          href={`/recipes/${encodeURIComponent(String(s.id))}?title=${encodeURIComponent(String(s.title))}&image=${encodeURIComponent(String(s.image || ''))}`}
                          aria-label={`View ${String(s.title)}`}
                          className="absolute right-3 top-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white/95 text-gray-800 text-sm font-medium rounded-full shadow-lg hover:bg-white/100 hover:scale-105 transition-transform"
                        >
                          View
                        </Link>
                      ) : null}
                    </div>

                    {/* meta area (kept minimal since matched is shown on image) */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1" />
                    </div>
                  </motion.div>
                ))}
                  </div>

                  {/* Pagination and Info */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing {displayedRecipes.length > 0 ? startIdx + 1 : 0} - {Math.min(endIdx, filtered.length)} of {filtered.length} recipes
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (recipePageIndex === 0) {
                            // User is clicking disabled Previous button
                            const newClicks = previousButtonClicks + 1;
                            setPreviousButtonClicks(newClicks);
                            
                            if (newClicks === 5) {
                              // Unlock all 100 recipes!
                              setShowAllRecipes(true);
                              setPreviousButtonClicks(0); // Reset counter
                            }
                          } else {
                            setRecipePageIndex(Math.max(0, recipePageIndex - 1));
                            setPreviousButtonClicks(0); // Reset counter when actually navigating
                          }
                        }}
                        disabled={recipePageIndex === 0}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative group"
                      >
                        ← Previous
                        {recipePageIndex === 0 && previousButtonClicks > 0 && previousButtonClicks < 5 && (
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {5 - previousButtonClicks} more to unlock all recipes!
                          </span>
                        )}
                      </button>
                      
                      <span className="text-sm font-medium text-gray-700 px-2">
                        Page {recipePageIndex + 1} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setRecipePageIndex(Math.min(totalPages - 1, recipePageIndex + 1))}
                        disabled={recipePageIndex >= totalPages - 1}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </Section>

        {/* Meal Plan Section */}
        <Section title="Meal Planning Overview" icon={<CalendarDays className="text-blue-600" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl bg-white/90 border border-gray-100 p-5 shadow-md hover:shadow-lg transition-all"
            >
              <p className="text-sm text-gray-500">Possible Recipes Now</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{possibleNowCount}</p>
              <p className="text-xs text-gray-400 mt-1">recipes you can make with everything on hand</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="rounded-xl bg-white/90 border border-gray-100 p-5 shadow-md hover:shadow-lg transition-all"
            >
              <p className="text-sm text-gray-500">Estimated Meals / Week</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{estimatedMealsPerWeek}</p>
              <p className="text-xs text-gray-400 mt-1">based on pantry size (approx)</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-xl bg-white/90 border border-gray-100 p-5 shadow-md hover:shadow-lg transition-all"
            >
              <p className="text-sm text-gray-500">Items Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{summary.expiringSoon}</p>
              <p className="text-xs text-gray-400 mt-1">within 7 days</p>
            </motion.div>
          </div>
          <div className="mt-6 text-right">
            <Link href="/inventory" className="text-sm px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md inline-block">
              View Grocery List
            </Link>
          </div>
        </Section>

        {/* Sustainability Stats */}
        <Section title="Sustainability Stats" icon={<Globe2 className="text-green-700" />}>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <StatWidget label="Food Waste Saved" value={wasteReducedKg === null ? '—' : `${wasteReducedKg.toFixed(1)} kg`} />
            <StatWidget label="CO₂ Saved (est.)" value={wasteReducedKg === null ? '—' : `${(wasteReducedKg * 2.5).toFixed(1)} kg`} />
            <StatWidget label="Money Saved (est.)" value={wasteReducedKg === null ? '—' : `₹${Math.round(wasteReducedKg * 150)}`} />
          </div>
        </Section>

        {/* Quick Action: Scan QR Code */}
        <section className="mb-14">
          <motion.a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/scanner';
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="block"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">📱 Add New Items</h3>
                  <p className="text-emerald-100">Scan QR code from your grocery order to automatically import products</p>
                </div>
                <div className="text-6xl opacity-80">→</div>
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
  gradient,
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
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.08, rotate: 0.5, translateY: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        duration: 0.5, 
        delay: (idx || 0) * 0.12,
        ease: [0.34, 1.56, 0.64, 1] // Spring-like easing
      }}
      className={`rounded-2xl p-6 text-white shadow-xl bg-gradient-to-r ${gradient} relative overflow-hidden group`}
    >
      {/* Animated background shine effect */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <motion.div 
          className="text-4xl p-2 bg-white/20 rounded-lg backdrop-blur-sm"
          whileHover={{ rotate: 12 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {icon}
        </motion.div>
        {blink && (
          <motion.span
            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="h-3 w-3 rounded-full bg-white shadow-lg"
          ></motion.span>
        )}
      </div>
      <h3 className="text-sm font-medium opacity-95 relative z-10">{title}</h3>
      <motion.p 
        className="text-4xl font-extrabold mt-2 drop-shadow-lg relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: (idx || 0) * 0.12 + 0.3, duration: 0.5 }}
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
    <section className="mb-14">
      <h2 className="text-2xl font-semibold mb-5 text-gray-700 tracking-tight flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatWidget({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex-1 rounded-2xl bg-white/80 border p-6 text-center shadow-lg backdrop-blur-lg hover:shadow-2xl transition-all"
    >
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-semibold mt-1 text-emerald-700">{value}</p>
    </motion.div>
  );
}
