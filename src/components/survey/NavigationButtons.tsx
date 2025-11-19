'use client';

import { motion } from 'framer-motion';

interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isLoading?: boolean;
  nextLabel?: string;
}

export default function NavigationButtons({
  onBack,
  onNext,
  isFirstStep,
  isLastStep,
  isLoading = false,
  nextLabel = 'Next',
}: NavigationButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex gap-4 mt-10 justify-center md:justify-end"
    >
      {!isFirstStep && (
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-full font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-500 transition-colors"
        >
          Back
        </motion.button>
      )}

      <motion.button
        onClick={onNext}
        disabled={isLoading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
      >
        {isLoading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            ⏳
          </motion.span>
        ) : (
          nextLabel
        )}
      </motion.button>
    </motion.div>
  );
}
