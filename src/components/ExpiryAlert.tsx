"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock } from "lucide-react";
import type { InventoryItemDB } from "@/lib/supabase-types";

interface ExpiryAlertProps {
  items: InventoryItemDB[];
}

export function ExpiryAlert({ items }: ExpiryAlertProps) {
  const [isOpen, setIsOpen] = useState(false);

  const calculateDaysUntilExpiry = (expiryDate: string): number => {
    if (!expiryDate) return 0;
    try {
      // Handle both DD/MM/YYYY and DD-MM-YYYY formats
      const separator = expiryDate.includes('/') ? '/' : '-';
      const [day, month, year] = expiryDate.split(separator).map(Number);

      const exp = new Date(year, month - 1, day);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      exp.setHours(0, 0, 0, 0);

      return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error('Error parsing expiry date:', expiryDate, e);
      return 0;
    }
  };

  // Get items expiring within 3 days (days_until_expiry = 0, 1, 2 or 3)
  // AND ensure we don't show expired items (days < 0)
  const expiringItems = items.map(item => ({
    ...item,
    days_until_expiry: calculateDaysUntilExpiry(item.expiry_date)
  })).filter((item) => {
    const d = item.days_until_expiry;
    return d >= 0 && d <= 3;
  });

  // Show alert only if there are expiring items
  useEffect(() => {
    // If there are expiring items and user hasn't dismissed the alert in this session, open it
    try {
      const dismissed = typeof window !== "undefined" ? sessionStorage.getItem("expiryAlertDismissed") : null;
      if (expiringItems.length > 0 && dismissed !== "true") {
        setIsOpen(true);
      }
    } catch {
      // sessionStorage may be unavailable in some environments; fall back to default behavior
      if (expiringItems.length > 0) setIsOpen(true);
    }
  }, [expiringItems.length]);

  if (expiringItems.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blur Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              try {
                if (typeof window !== "undefined") sessionStorage.setItem("expiryAlertDismissed", "true");
              } catch { }
              setIsOpen(false);
            }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Alert Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Items Expiring Soon!</h2>
                    <p className="text-orange-100 text-sm">Items expiring within 3 days</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {expiringItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {item.product_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span
                              className={`text-sm font-semibold ${item.days_until_expiry === 0
                                  ? "text-red-600"
                                  : item.days_until_expiry === 1
                                    ? "text-orange-600"
                                    : item.days_until_expiry === 2
                                      ? "text-yellow-600"
                                      : "text-amber-600"
                                }`}
                            >
                              {item.days_until_expiry === 0
                                ? "🔴 Expires Today"
                                : item.days_until_expiry === 1
                                  ? "🟠 Expires Tomorrow"
                                  : item.days_until_expiry === 2
                                    ? "🟡 Expires in 2 days"
                                    : `🟡 Expires in ${item.days_until_expiry} days`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {item.quantity}
                          </div>
                          <div className="text-xs text-gray-600 uppercase">
                            {item.unit || "unit"}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Info Message */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Use these items soon to avoid waste! Check your recipes.
                  </p>
                </div>
              </div>

              {/* Footer - centered buttons with equal widths */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      try {
                        const el = typeof document !== 'undefined' ? document.getElementById('recipe-suggestions') : null;
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } catch (e) {
                        // fallback: no-op
                      }
                      try {
                        if (typeof window !== "undefined") sessionStorage.setItem("expiryAlertDismissed", "true");
                      } catch { }
                      setIsOpen(false);
                    }}
                    className="inline-flex justify-center items-center w-full px-4 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-all"
                  >
                    View Recipe Suggestions
                  </button>

                  <Link
                    href="/inventory"
                    className="inline-flex justify-center items-center w-full px-4 py-2 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-all"
                  >
                    View Inventory
                  </Link>

                  <button
                    onClick={() => {
                      try {
                        if (typeof window !== "undefined") sessionStorage.setItem("expiryAlertDismissed", "true");
                      } catch { }
                      setIsOpen(false);
                    }}
                    className="inline-flex justify-center items-center w-full px-4 py-2 rounded-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
