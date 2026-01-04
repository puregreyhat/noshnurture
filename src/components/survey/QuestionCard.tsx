'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface QuestionCardProps {
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
}

export default function QuestionCard({ title, subtitle, children }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
      className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-white/60 via-white/50 to-white/40 backdrop-blur-xl border border-white/60 shadow-lg hover:shadow-xl transition-all"
    >
      {/* Animated Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-gray-900 mb-2"
      >
        {title}
      </motion.h2>

      {/* Animated Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-gray-600 mb-6"
      >
        {subtitle}
      </motion.p>

      {/* Content with morphing animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
