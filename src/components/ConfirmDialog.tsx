'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
              {/* Decorative gradient orbs */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl ${isDangerous ? 'bg-amber-300/30' : 'bg-emerald-300/30'
                }`} />
              <div className={`absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl ${isDangerous ? 'bg-orange-300/20' : 'bg-teal-300/20'
                }`} />

              {/* Header */}
              <div className={`relative z-10 p-6 border-b ${isDangerous
                  ? 'border-amber-100 bg-gradient-to-br from-amber-50/80 to-orange-50/80'
                  : 'border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-teal-50/80'
                } backdrop-blur-sm`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {isDangerous && (
                      <div className="p-2 bg-amber-100 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-amber-700" />
                      </div>
                    )}
                    <h2 className={`text-2xl font-serif font-bold ${isDangerous ? 'text-amber-900' : 'text-emerald-900'
                      }`}>
                      {title}
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onCancel}
                    className="text-stone-400 hover:text-stone-600 transition-colors p-1"
                    disabled={isLoading}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 p-6 bg-white/60 backdrop-blur-sm">
                <p className="text-stone-700 text-base leading-relaxed font-light">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="relative z-10 flex gap-3 px-6 pb-6 bg-white/60 backdrop-blur-sm">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-700 font-bold hover:bg-stone-50 hover:border-stone-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${isDangerous
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200'
                    }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    confirmText
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
