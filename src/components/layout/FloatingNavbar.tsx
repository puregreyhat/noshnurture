"use client";
import React, { useState } from "react";
import { Home, Package, QrCode, Settings, Menu, X, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<React.ElementType | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Package, label: "Inventory", path: "/inventory" },
    { icon: ShoppingCart, label: "Shopping List", path: "/shopping-list" },
    { icon: QrCode, label: "Scan", path: "/scanner" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    setSelectedIcon(item.icon);
    setIsMorphing(true);
    setIsOpen(false);

    // Morph animation duration
    setTimeout(() => {
      router.push(item.path);
      setTimeout(() => {
        setIsMorphing(false);
        setSelectedIcon(null);
      }, 300);
    }, 600);
  };

  // Hide on auth and survey pages
  if (pathname === '/auth' || pathname === '/login' || pathname === '/signup' || pathname === '/survey') {
    return null;
  }

  return (
    <>
      {/* Morphing Overlay */}
      <AnimatePresence>
        {isMorphing && selectedIcon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-white flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 4, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              className="text-emerald-600"
            >
              {React.createElement(selectedIcon, { size: 80 })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* MOBILE MENU - Bottom Right */}
      <div className="md:hidden">
        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 z-[9999] w-16 h-16 bg-emerald-600 rounded-full shadow-2xl flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Backdrop */}
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-[9998]"
          />
        )}

        {/* Menu Panel */}
        {isOpen && (
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[9998] p-6 pb-8">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      active
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      active ? "bg-white/20" : "bg-white"
                    }`}>
                      <Icon size={20} className={active ? "text-white" : "text-emerald-600"} />
                    </div>
                    <span className="font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Dock - Bottom Center (Desktop) */}
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-full px-6 py-3 flex items-center gap-3 border border-gray-200">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;

            return (
              <Link key={item.path} href={item.path}>
                <div className="relative group">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      active
                        ? "bg-emerald-600 shadow-lg"
                        : "bg-gray-100 hover:bg-emerald-50"
                    }`}
                  >
                    <Icon
                      size={22}
                      className={active ? "text-white" : "text-gray-600 group-hover:text-emerald-600"}
                    />
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
