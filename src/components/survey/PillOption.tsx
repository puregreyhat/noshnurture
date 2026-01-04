'use client';

import { motion } from 'framer-motion';

interface PillOptionProps {
  label: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
}

export default function PillOption({ label, icon, selected, onClick }: PillOptionProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
        selected
          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-400'
      }`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {label}
    </motion.button>
  );
}
