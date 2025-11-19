'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface EmojiSliderProps {
  value: number;
  onChange: (value: number) => void;
  emojis: string[];
  labels?: string[];
}

export default function EmojiSlider({ value, onChange, emojis, labels }: EmojiSliderProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center gap-2">
        {emojis.map((emoji, index) => (
          <motion.button
            key={index}
            onClick={() => onChange(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
            className={`text-4xl md:text-5xl transition-all ${
              value === index ? 'scale-125' : 'scale-100 opacity-60'
            }`}
          >
            {emoji}
          </motion.button>
        ))}
      </div>

      {labels && (
        <motion.div
          className="flex justify-between text-xs md:text-sm text-gray-500 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {labels.map((label, index) => (
            <span key={index} className={value === index ? 'text-green-600 font-bold' : ''}>
              {label}
            </span>
          ))}
        </motion.div>
      )}

      <div className="flex justify-center mt-6">
        <motion.div
          className="text-sm font-semibold text-gray-700 bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-full"
          key={value}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
        >
          Selected: {labels?.[value] || `Level ${value + 1}`}
        </motion.div>
      </div>
    </div>
  );
}
