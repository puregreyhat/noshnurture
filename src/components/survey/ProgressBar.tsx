'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = ['Welcome', 'Your Name', 'Profile', 'Assessment', 'Features', 'Ratings', 'Feedback'];

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="fixed top-20 left-0 right-0 z-50 w-full px-6 py-4 bg-white/80 backdrop-blur border-b border-green-200/50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <motion.span 
            key={currentStep}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-green-700"
          >
            {stepLabels[currentStep - 1] || 'Step ' + currentStep}
          </motion.span>
          <span className="text-xs font-medium text-green-600">
            {currentStep} of {totalSteps}
          </span>
        </div>
        <div className="relative w-full h-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
}
