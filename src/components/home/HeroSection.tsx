"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroSection = () => {
    return (
        <div className="relative z-10 container mx-auto px-4 pt-20 pb-32 min-h-screen flex flex-col justify-center text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-50 border border-stone-200 shadow-sm mx-auto"
            >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-stone-600 tracking-wide uppercase text-xs">
                    Smart Food Inventory Management
                </span>
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-serif font-bold text-stone-800 tracking-tight mb-6"
            >
                Feed your family, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-amber-600">
                    not the bin.
                </span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-stone-600 mb-10 max-w-2xl mx-auto leading-relaxed font-light"
            >
                NoshNurture helps you track groceries, spot expiring items, and turn
                leftovers into delicious recipes — powered by smart AI suggestions.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
                <Link
                    href="/auth"
                    className="group relative px-8 py-4 bg-emerald-700 text-white font-medium rounded-full shadow-lg hover:bg-emerald-800 transition-all hover:shadow-emerald-900/20 hover:-translate-y-1 flex items-center gap-2 overflow-hidden"
                >
                    <span className="relative z-10">Get Started Free</span>
                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>


            </motion.div>

            {/* Floating Elements Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 5, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute top-1/4 left-10 md:left-1/4 w-24 h-24 bg-amber-50 rounded-full blur-xl opacity-60"
                />
                <motion.div
                    animate={{
                        y: [0, 20, 0],
                        rotate: [0, -5, 0],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                    className="absolute bottom-1/3 right-10 md:right-1/4 w-32 h-32 bg-emerald-50 rounded-full blur-xl opacity-60"
                />
            </div>
        </div>
    );
};

export default HeroSection;
