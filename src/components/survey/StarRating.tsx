'use client';

import { motion } from 'framer-motion';

interface StarRatingProps {
  rating: number;
  onRate: (rating: number) => void;
  featureName: string;
}

export default function StarRating({ rating, onRate, featureName }: StarRatingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl mb-3 border border-green-100"
    >
      <span className="font-semibold text-gray-800">{featureName}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            onClick={() => onRate(star)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="transition-colors"
          >
            <motion.span
              className={`text-2xl transition-colors ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
              animate={{
                scale: star <= rating ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              {star <= rating ? '⭐' : '☆'}
            </motion.span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
