"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, ChevronDown, Sparkles } from "lucide-react";

export default function WelcomeSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const opacity = Math.max(1 - scrollY / 300, 0);
  const translateY = Math.min(scrollY / 2, 100);

  // Smooth scroll handler
  const handleScrollDown = () => {
    const nextSection = document.getElementById("content-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        style={{ opacity, transform: `translateY(${translateY}px)` }}
        transition={{ duration: 0.4 }}
        className="relative h-screen bg-[#FDFBF7] flex items-center justify-center p-8 rounded-b-[3rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden z-10 border-b border-stone-100"
      >
        {/* Animated Background Blobs - Warm & Organic */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-100/40 rounded-full blur-3xl mix-blend-multiply"
          />
          <motion.div
            animate={{
              x: [0, -50, 0],
              y: [0, 40, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-emerald-100/40 rounded-full blur-3xl mix-blend-multiply"
          />
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-stone-100/60 rounded-full blur-3xl mix-blend-multiply"
          />
        </div>

        {/* Subtle Grain Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/noise.png')]"></div>

        {/* Main Content */}
        <div className="text-center relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 inline-flex items-center justify-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-stone-200 shadow-sm"
          >
            <Sparkles className="text-amber-500 w-5 h-5 mr-2" />
            <span className="text-stone-600 font-medium tracking-wide text-sm uppercase">Sustainable Kitchen Companion</span>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-7xl md:text-8xl font-serif font-bold text-emerald-900 mb-8 tracking-tight leading-tight"
          >
            Nurture your <br />
            <span className="italic text-emerald-700">body & planet</span>
          </motion.h1>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-2xl text-stone-600 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Track your pantry, reduce waste, and discover delicious recipes with what you have.
          </motion.p>

          {/* Floating Leaf Animation - Organic */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
            transition={{
              scale: { duration: 0.6, delay: 0.6, type: "spring" },
              rotate: { repeat: Infinity, duration: 8, ease: "easeInOut" }
            }}
            className="mt-12 mx-auto w-fit p-6 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100"
          >
            <Leaf size={48} className="text-emerald-600" />
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 8, 0] }}
            transition={{
              opacity: { delay: 1, duration: 1 },
              y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
            }}
            className="mt-16 flex flex-col items-center justify-center text-stone-400 font-medium tracking-widest text-xs uppercase cursor-pointer hover:text-emerald-700 transition-colors"
            onClick={handleScrollDown}
          >
            <span className="mb-3">Explore Dashboard</span>
            <div className="w-8 h-12 border-2 border-stone-300 rounded-full flex justify-center p-1">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1 h-2 bg-stone-400 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
