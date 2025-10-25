"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
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
import { createClient } from "@/lib/supabase/client";
import { getSettings } from "@/lib/settings";
import { isLocalModelAvailable, generateLocalRecipe } from "@/lib/recipes/localRnn";
import type { InventoryItemDB } from "@/lib/supabase-types";
import { useAuth } from "@/contexts/AuthContext";

export default function FoodDashboard() {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItemDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ 
    title: string; 
    image?: string; 
    source?: string;
    id?: number | string;
    readyInMinutes?: number;
    servings?: number;
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

  // Fetch inventory from Supabase
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

    fetchInventory();
  }, [user]);

  // Fetch recipe suggestions from API
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setRecipeLoading(true);
        const res = await fetch('/api/recipes/suggestions');
        if (!res.ok) throw new Error('Failed to fetch recipes');
        const json = await res.json();
        setSuggestions((json?.suggestions || []).map((r: Record<string, unknown>) => ({ 
          title: typeof r.title === 'string' ? r.title : '', 
          image: typeof r.image === 'string' ? r.image : '', 
          id: (typeof r.id === 'number' || typeof r.id === 'string') ? r.id : undefined,
          source: typeof r.source === 'string' ? r.source : '',
          readyInMinutes: typeof r.readyInMinutes === 'number' ? r.readyInMinutes : 0,
          servings: typeof r.servings === 'number' ? r.servings : 0
        })));
      } catch (e) {
        console.error('Recipe suggestions error', e);
      } finally {
        setRecipeLoading(false);
      }
    };
    loadRecipes();
  }, []);

  // Probe local AI availability if enabled
  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return;
      if (!getSettings().useLocalAIGenerator) return;
      const ok = await isLocalModelAvailable();
      setLocalAIReady(ok);
    })();
  }, []);

  async function handleLocalAIGenerate() {
    try {
      // Build a simple prompt from expiring items
      const expiring = groupedInventory
        .filter(i => i.days_until_expiry >= 0 && i.days_until_expiry <= 7)
        .map(i => i.product_name)
        .slice(0, 6);
      const prompt = `ingredients: ${expiring.join(', ')}\nrecipe:`;
      const out = await generateLocalRecipe(prompt);
      if (!out) {
        alert('Local AI model is not ready to generate yet. Place model.json and vocab.json under /public/models/recipe_rnn/.');
        return;
      }
      // For now, we keep the UI simple: append a placeholder enhanced card
      setEnhanced(prev => [{ title: 'AI-Generated Recipe', image: suggestions[0]?.image }, ...prev]);
    } catch (e) {
      console.error('Local AI generation failed', e);
    }
  }

  async function handleDiscoverMore() {
    setDiscoverMore(true);
    try {
      // Re-fetch suggestions to get fresh Spoonacular results
      const res = await fetch('/api/recipes/suggestions');
      if (!res.ok) throw new Error('Failed to fetch more');
      const json = await res.json();
      setSuggestions((json?.suggestions || []).map((r: Record<string, unknown>) => ({ 
        title: typeof r.title === 'string' ? r.title : '', 
        image: typeof r.image === 'string' ? r.image : '', 
        id: typeof r.id === 'number' ? r.id : 0,
        source: typeof r.source === 'string' ? r.source : '',
        readyInMinutes: typeof r.readyInMinutes === 'number' ? r.readyInMinutes : 0,
        servings: typeof r.servings === 'number' ? r.servings : 0
      })));
    } catch (e) {
      console.error('Discover more error', e);
    } finally {
      setDiscoverMore(false);
    }
  }

  // Calculate summary stats from real data
  const summary = {
    foodTracked: inventoryItems.length,
    expiringSoon: inventoryItems.filter(item => item.days_until_expiry <= 7 && item.days_until_expiry >= 0).length,
    wasteReduced: "3.8 kg", // Keep static for now
  };

  // Group items by product name and sum quantities
  const groupedInventory = inventoryItems.reduce((acc, item) => {
    const existing = acc.find(i => i.product_name === item.product_name);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as InventoryItemDB[]);

  // Get items expiring soon (within 7 days), grouped by product
  const expiringItemsGrouped = groupedInventory
    .filter(item => item.days_until_expiry <= 7 && item.days_until_expiry >= 0)
    .slice(0, 6)
    .map(item => ({
      name: item.product_name,
      expiry: `${item.days_until_expiry} day${item.days_until_expiry !== 1 ? 's' : ''}`,
      action: "Use",
      quantity: item.quantity,
      unit: item.unit,
      tags: item.tags,
    }));

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

  const mealPlan = [
    { day: "Mon", meal: "Pasta" },
    { day: "Tue", meal: "Salad" },
    { day: "Wed", meal: "Rice & Curry" },
  ];

  return (
    <div className="min-h-screen font-['Poppins'] bg-gradient-to-br from-emerald-50 via-white to-green-100">
      <WelcomeSection />

      <div id="content-section" className="p-8 max-w-6xl mx-auto relative z-0">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {Object.entries(summary).map(([key, value], idx) => {
            let icon,
              title: string = " ",
              gradient: string = "from-gray-400 to-gray-600",
              blink = false;

            switch (key) {
              case "foodTracked":
                icon = <Utensils className="text-green-700" />;
                title = "Food Items Tracked";
                gradient = "from-green-400 to-green-600";
                break;
              case "expiringSoon":
                icon = <Bell className="text-yellow-600" />;
                title = "Expiring Soon";
                gradient = "from-yellow-400 to-orange-500";
                blink = true;
                break;
              case "wasteReduced":
                icon = <BarChart3 className="text-blue-600" />;
                title = "Waste Reduced";
                gradient = "from-blue-400 to-cyan-500";
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
            <div className="text-center py-8 text-gray-500">Loading inventory...</div>
          ) : expiringItemsGrouped.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items expiring soon. Scan a QR code to add items!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiringItemsGrouped.map((item, idx) => (
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
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all">
                      {item.action}
                    </button>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.slice(0, 3).map((tag, i) => (
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

        {/* Recipes Section */}
        <Section title="Recipe Suggestions" icon={<Utensils className="text-orange-500" />}>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            {getSettings().useLocalAIGenerator && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">
                  Local AI {localAIReady ? '✓' : '✗'}
                </p>
                <button
                  onClick={handleLocalAIGenerate}
                  className="text-sm px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                >
                  Generate with local AI
                </button>
              </div>
            )}
            <button
              onClick={handleDiscoverMore}
              disabled={discoverMore}
              className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md disabled:opacity-50"
            >
              {discoverMore ? 'Loading...' : '🔍 Discover More Recipes'}
            </button>
          </div>
          {recipeLoading ? (
            <div className="text-center py-8 text-gray-500">Finding recipes that use expiring items...</div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No suggestions yet. Add items or adjust expiry windows.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[...enhanced, ...suggestions].map((recipe, i) => {
              // Template recipes have non-numeric IDs (curry-..., stirfry-..., etc.)
              // Spoonacular recipes have numeric IDs
              const isNumericId = recipe.id && /^\d+$/.test(recipe.id.toString());
              const hasDetails = recipe.id && isNumericId;
              const isTemplate = !isNumericId;
              
              return (
              <motion.div
                key={recipe.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all"
              >
                <Image
                  src={recipe.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop'}
                  alt={recipe.title}
                  width={800}
                  height={176}
                  className="w-full h-44 object-cover transition-transform hover:scale-105"
                />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {recipe.title}
                      </h3>
                      {recipe.source && (
                        <p className="text-xs text-gray-500 mt-1">via {recipe.source}</p>
                      )}
                      {isTemplate && (
                        <span className="inline-block text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full mt-1">
                          Quick Idea
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    {recipe.readyInMinutes && (
                      <span className="flex items-center gap-1">
                        🕐 {recipe.readyInMinutes} mins
                      </span>
                    )}
                    {recipe.servings && (
                      <span className="flex items-center gap-1">
                        👥 {recipe.servings} servings
                      </span>
                    )}
                  </div>
                  {hasDetails ? (
                    <Link 
                      href={`/recipes/${recipe.id}`}
                      className="block w-full text-sm px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-colors font-semibold text-center"
                    >
                      View Recipe →
                    </Link>
                  ) : (
                    <Link 
                      href={recipe.id ? `/recipes/template/${recipe.id}` : '#'}
                      className="block w-full text-sm px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-md transition-colors font-semibold text-center"
                    >
                      See Recipe Idea →
                    </Link>
                  )}
                </div>
              </motion.div>
            )})}

          </div>
          )}
        </Section>

        {/* Meal Plan Section */}
        <Section title="Meal Planning Overview" icon={<CalendarDays className="text-blue-600" />}>
          <div className="grid grid-cols-3 gap-4 text-center">
            {mealPlan.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="rounded-xl bg-white/90 border border-gray-100 p-5 shadow-md hover:shadow-lg transition-all"
              >
                <p className="font-semibold text-gray-800 text-lg">
                  {plan.day}
                </p>
                <p className="text-gray-500 text-sm">{plan.meal}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 text-right">
            <button className="text-sm px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md">
              View Grocery List
            </button>
          </div>
        </Section>

        {/* Sustainability Stats */}
        <Section title="Sustainability Stats" icon={<Globe2 className="text-green-700" />}>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <StatWidget label="Food Waste Saved" value="3.8 kg" />
            <StatWidget label="CO₂ Saved" value="9.4 kg" />
            <StatWidget label="Money Saved" value="₹520" />
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.07, rotate: 0.5 }}
      transition={{ duration: 0.6, delay: idx * 0.1 }}
      className={`rounded-2xl p-5 text-white shadow-xl bg-gradient-to-r ${gradient} relative overflow-hidden`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="text-2xl">{icon}</div>
        {blink && (
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="h-3 w-3 rounded-full bg-white shadow-sm"
          ></motion.span>
        )}
      </div>
      <h3 className="text-sm opacity-90">{title}</h3>
      <p className="text-3xl font-extrabold mt-1 drop-shadow-md">{value}</p>
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
