"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Package, QrCode, Settings, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function FloatingNavbar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Package, label: "Inventory", path: "/inventory" },
    { icon: QrCode, label: "Scan", path: "/scanner" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const isActive = (path: string) => pathname === path;

  // Hide navbar if user is not authenticated or on auth pages
  if (!user || pathname === '/auth' || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <>
      {/* Floating Menu Button - Bottom Right */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-8 right-8 z-50 md:hidden"
      >
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-2xl flex items-center justify-center text-white hover:shadow-emerald-500/50 transition-all"
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-7 h-7" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="w-7 h-7" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Expanded Menu Items */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Menu Items */}
            <div className="fixed bottom-28 right-8 z-50 flex flex-col gap-4 md:hidden">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <motion.div
                    key={item.path}
                    initial={{ scale: 0, x: 100, opacity: 0 }}
                    animate={{ scale: 1, x: 0, opacity: 1 }}
                    exit={{ scale: 0, x: 100, opacity: 0 }}
                    transition={{
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                  >
                    <Link
                      href={item.path}
                      onClick={() => setIsExpanded(false)}
                      className="group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, x: -10 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-4 ${
                          active
                            ? "bg-gradient-to-r from-emerald-600 to-green-600"
                            : "bg-white/90 hover:bg-white"
                        } backdrop-blur-xl shadow-xl rounded-full pr-6 pl-4 py-3 transition-all border-2 ${
                          active ? "border-emerald-400" : "border-transparent"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            active
                              ? "bg-white/20"
                              : "bg-gradient-to-br from-emerald-100 to-green-100"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              active ? "text-white" : "text-emerald-600"
                            }`}
                          />
                        </div>
                        <span
                          className={`font-semibold text-sm whitespace-nowrap ${
                            active ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {item.label}
                        </span>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Dock - Bottom Center (Desktop) */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 20 }}
        className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-white/80 backdrop-blur-2xl shadow-2xl rounded-full px-6 py-3 flex items-center gap-2 border border-gray-200/50">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative group`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      active
                        ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/50"
                        : "bg-gray-100 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        active ? "text-white" : "text-gray-600 group-hover:text-emerald-600"
                      }`}
                    />
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                      {item.label}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
