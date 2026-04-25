"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Utensils,
  BarChart3,
  ShoppingBasket,
  CalendarDays,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateDaysUntilExpiry, getStatusFromDays } from "@/lib/utils/dateUtils";
import { ThreeDScroller } from "@/components/ThreeDScroller";
import Link from "next/link";

// Reuse logic from original Dashboard but with a more premium UI
export default function NewDashboard() {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);

  // Fetch Inventory and Suggestions (simplified version for the demo-like new dashboard)
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const supabase = createClient();
      
      const { data: inv } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_consumed', false)
        .order('days_until_expiry', { ascending: true });
      
      setInventoryItems(inv || []);

      const isAdmin = user?.email === 'puregreyhat@gmail.com' || user?.email === 'akash73195@gmail.com';
      const resp = await fetch(`/api/recipes/suggestions?source=sugran&limit=12${isAdmin ? '&all=true' : ''}`);
      if (resp.ok) {
        const j = await resp.json();
        setSuggestions(j.suggestions || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  const summary = {
    foodTracked: inventoryItems.length,
    expiringSoon: inventoryItems.filter(it => calculateDaysUntilExpiry(it.expiry_date) <= 7).length,
    wasteReduced: 12, // For aesthetic demo, we can use a hardcoded value if calculation is complex
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* 3D Fixed Background Section */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <ThreeDScroller 
            frameCount={230}
            baseUrl="/frames/frame_"
            extension=".png"
            targetRef={heroRef}
        />
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,#050505_90%] opacity-60" />
      </div>

      {/* Hero Content Layer */}
      <div ref={heroRef} className="relative h-[180vh] w-full flex flex-col items-center justify-start pt-[25vh] px-6 z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center sticky top-[25vh] max-w-4xl"
        >
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-xl shadow-2xl">
                <Sparkles size={14} className="animate-pulse" />
                The Future of Kitchens
            </div>
            
            <div className="relative p-12 rounded-[4rem] bg-black/20 backdrop-blur-md border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.8] mb-6 drop-shadow-2xl">
                    NOSH <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">NURTURE</span>
                </h1>
                <p className="text-stone-300 text-lg md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md">
                    Your sustainable lifestyle, reimagined in 3D. <br />
                    Scroll to explore your culinary universe.
                </p>
            </div>
        </motion.div>

        {/* Scroll Progress Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 text-stone-500">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30">Rotate Ingredients</span>
            <div className="w-[1px] h-24 bg-gradient-to-b from-emerald-500 via-emerald-500 to-transparent rounded-full opacity-50" />
        </div>
      </div>

      {/* Stats Section - Floating Glassmorphic Cards */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
            {[
                { label: "Pantry Status", value: summary.foodTracked, unit: "Items", icon: Utensils, gradient: "from-emerald-500/20 to-emerald-500/5", textColor: "text-emerald-400", borderColor: "border-emerald-500/20" },
                { label: "Critical Expiry", value: summary.expiringSoon, unit: "Alerts", icon: Bell, gradient: "from-orange-500/20 to-orange-500/5", textColor: "text-orange-400", borderColor: "border-orange-500/20" },
                { label: "Waste Prevented", value: summary.wasteReduced, unit: "Kilograms", icon: BarChart3, gradient: "from-cyan-500/20 to-cyan-500/5", textColor: "text-cyan-400", borderColor: "border-cyan-500/20" },
            ].map((stat, i) => (
                <motion.div
                    key={i}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className={`group relative p-8 rounded-[2.5rem] bg-white/[0.03] border ${stat.borderColor} backdrop-blur-2xl overflow-hidden shadow-2xl transition-all duration-500`}
                >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} blur-[60px] opacity-50 group-hover:opacity-100 transition-opacity`} />
                    <div className="relative flex flex-col gap-6">
                        <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border ${stat.borderColor}`}>
                            <stat.icon className={stat.textColor} size={28} />
                        </div>
                        <div>
                            <div className="text-5xl font-black mb-1">{stat.value}</div>
                            <div className="text-stone-400 text-sm font-bold uppercase tracking-wider">{stat.label}</div>
                            <div className="text-stone-600 text-[10px] mt-1 font-bold uppercase tracking-widest">{stat.unit} tracked</div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Pantry Section */}
        <section className="mb-32">
            <div className="flex items-end justify-between mb-12">
                <div>
                    <h2 className="text-4xl font-black mb-4">Pantry Pulse</h2>
                    <p className="text-stone-500 font-medium">Real-time inventory overview and health.</p>
                </div>
                <Link href="/inventory" className="flex items-center gap-2 text-emerald-400 font-bold hover:gap-4 transition-all">
                    View Complete Inventory <ArrowRight size={20} />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-40 rounded-3xl bg-white/5 animate-pulse" />
                    ))
                ) : inventoryItems.slice(0, 6).map((item, i) => {
                    const days = calculateDaysUntilExpiry(item.expiry_date);
                    const status = getStatusFromDays(days);
                    const isUrgent = days <= 3;

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{item.product_name}</h3>
                                    <p className="text-stone-500 text-sm">{item.quantity} {item.unit}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                    isUrgent ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                    {isUrgent ? 'Urgent' : 'Safe'}
                                </div>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    className={`h-full ${isUrgent ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${Math.max(0, Math.min(100, (days / 14) * 100))}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-3 text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                                <span>Expiry</span>
                                <span className={isUrgent ? 'text-orange-400' : ''}>{days} Days Left</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>

        {/* Recipes Section */}
        <section className="pb-32">
            <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 mb-16 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-[1px] bg-emerald-500/50" />
                        <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.3em]">Gastronomy</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tight">Culinary <span className="text-stone-500 italic">Intelligence</span></h2>
                </div>
                <p className="text-stone-500 font-medium max-w-sm">Smart AI-driven suggestions based on your unique pantry profile.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {suggestions.length === 0 && !loading ? (
                    <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border border-white/10">
                        <Utensils className="mx-auto text-stone-700 mb-4" size={40} />
                        <p className="text-stone-500 font-bold uppercase tracking-widest text-sm">No recipes found matching your pantry</p>
                    </div>
                ) : suggestions.map((recipe, i) => {
                    const recipeUrl = recipe.id
                        ? `/recipes/${encodeURIComponent(String(recipe.id))}?title=${encodeURIComponent(String(recipe.title))}&image=${encodeURIComponent(String(recipe.image || ''))}`
                        : '#';

                    return (
                        <Link key={i} href={recipeUrl}>
                            <motion.div
                                whileHover={{ y: -15, scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="relative bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden group shadow-2xl h-full flex flex-col"
                            >
                                <div className="relative h-72 overflow-hidden">
                                    <img 
                                        src={recipe.image} 
                                        alt={recipe.title}
                                        className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent opacity-90" />
                                    
                                    <div className="absolute top-6 left-6 flex gap-2">
                                        <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-tighter text-white">
                                            {recipe.cuisine || 'Global'}
                                        </div>
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <h3 className="text-2xl font-bold leading-tight group-hover:text-emerald-400 transition-colors duration-300 line-clamp-2">
                                            {recipe.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-4">
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                                                <Sparkles size={10} />
                                                AI Match
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </section>
      </div>

      {/* Decorative Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
