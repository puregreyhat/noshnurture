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
  const [wasteReducedKg, setWasteReducedKg] = useState<number | null>(null);
  const [estimatedMealsPerWeek, setEstimatedMealsPerWeek] = useState<number>(0);

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
    // end fetchInventory

    // invoke loader
    fetchInventory();
    // also fetch recently consumed items for "waste reduced" calculation
    if (user) {
      (async () => {
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
          if (!consErr) setConsumedItems30d(consumed || []);
        } catch (e) {
          console.warn('Failed to fetch consumed items', e);
        }
      })();
    }
  }, [user]);

  // Calculate summary stats from real data
  const summary = {
    foodTracked: inventoryItems.length,
    expiringSoon: inventoryItems.filter(item => item.days_until_expiry <= 7 && item.days_until_expiry >= 0).length,
    wasteReduced: wasteReducedKg === null ? '—' : `${wasteReducedKg.toFixed(1)} kg`,
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

  // Fetch recipe suggestions from our server (which proxies to Sugran)
  useEffect(() => {
    if (!user) return;
    const fetchSuggestions = async () => {
      setRecipeLoading(true);
      try {
        const resp = await fetch('/api/recipes/suggestions?source=sugran');
        if (resp.ok) {
          const j = await resp.json();
          setSuggestions(Array.isArray(j.suggestions) ? j.suggestions : []);
        } else {
          console.error('Failed to load suggestions', resp.status);
        }
      } catch (e) {
        console.error('Error fetching suggestions', e);
      } finally {
        setRecipeLoading(false);
      }
    };
    fetchSuggestions();
  }, [user, inventoryItems.length]);

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

        {/* Recipes Section (restored) */}
        <Section title="Recipe Suggestions" icon={<Utensils className="text-orange-500" />}>
          <div className="p-4">
            {recipeLoading ? (
              <div className="text-center py-6 text-gray-500">Loading recipes...</div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No recipe suggestions yet. Try adding items to inventory or run the Sugran test.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {suggestions.map((s, i) => (
                  <motion.div
                    key={String(s.id || i)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="rounded-xl bg-white/90 border p-4 shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{s.title}</h4>
                        {s.source && <p className="text-xs text-gray-500 mt-1">Source: {s.source}</p>}
                        {(() => {
                          const sObj = s as unknown as Record<string, unknown>;
                          if (typeof sObj.matched !== 'undefined') {
                            return <p className="text-xs text-green-600 mt-1">Matched: {String(sObj.matched)}</p>;
                          }
                          return null;
                        })()}
                      </div>
                      {s.id ? (
                        <Link href={`/recipes/${encodeURIComponent(String(s.id))}`} className="text-sm text-blue-600">View</Link>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
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
              <p className="text-2xl font-bold text-gray-800 mt-2">{suggestions.length}</p>
              <p className="text-xs text-gray-400 mt-1">recipes suggested from your pantry</p>
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
            <button className="text-sm px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md">
              View Grocery List
            </button>
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
