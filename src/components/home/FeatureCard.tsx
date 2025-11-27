"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="bg-white border border-stone-100 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />

      <div className="relative z-10">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors duration-300">
          <Icon className="w-6 h-6 text-emerald-700 group-hover:text-white transition-colors duration-300" />
        </div>
        <h3 className="text-xl font-serif font-bold text-stone-800 mb-3">{title}</h3>
        <p className="text-stone-500 leading-relaxed font-light">{description}</p>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
