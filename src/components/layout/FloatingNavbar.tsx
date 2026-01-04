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
  const [isNavbarVisible, setIsNavbarVisible] = useState(true); // Start visible
  const pathname = usePathname();
  const router = useRouter();


  // Auto-hide navbar on desktop - show only when mouse is near bottom
  React.useEffect(() => {
    let initialDisplayComplete = false;

    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const mouseY = e.clientY;
      const threshold = 200; // Show navbar when mouse is within 200px of bottom

      if (windowHeight - mouseY < threshold) {
        setIsNavbarVisible(true);
      } else {
        // Only hide if initial display period is complete
        if (initialDisplayComplete) {
          setIsNavbarVisible(false);
        }
      }
    };

    // Add mouse move listener immediately
    window.addEventListener('mousemove', handleMouseMove);

    // Show navbar for 3 seconds on mount, then allow auto-hide
    const initialTimer = setTimeout(() => {
      initialDisplayComplete = true;
      // Check current mouse position to decide if navbar should stay visible
      const currentMouseY = window.innerHeight; // Assume bottom if no movement yet
      if (currentMouseY > 200) {
        setIsNavbarVisible(false);
      }
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(initialTimer);
    };
  }, []);


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

      {/* MOBILE MENU - Full Screen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[#FDFBF7] z-[9998] flex flex-col p-6 md:hidden"
          >
            <div className="flex items-center justify-between mb-8 mt-4">
              <h2 className="text-2xl font-serif font-bold text-stone-800">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all ${active
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                      : "bg-white border border-stone-100 text-stone-600 hover:bg-stone-50"
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? "bg-white/20" : "bg-stone-100"
                      }`}>
                      <Icon size={24} className={active ? "text-white" : "text-emerald-700"} />
                    </div>
                    <span className="font-serif font-semibold text-lg">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-6 border-t border-stone-100 text-center text-stone-400 text-sm">
              <p>NoshNurture v1.0</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Action Button (Only visible when menu is closed) */}
      <div className="md:hidden">
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9990] w-16 h-16 bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-100 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Menu"
          >
            <Menu size={28} />
          </motion.button>
        )}
      </div>

      {/* Floating Dock - Bottom Center (Desktop) - macOS Style */}
      <AnimatePresence>
        {isNavbarVisible && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 900, damping: 30 }}
            className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]"
          >
            <DockContainer menuItems={menuItems} pathname={pathname} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// macOS Dock Container Component
function DockContainer({ menuItems, pathname }: { menuItems: any[], pathname: string }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="relative">
      {/* Main Dock Container with Glass Morphism */}
      <div className="relative bg-white/30 backdrop-blur-2xl rounded-[20px] px-3 py-2 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.3)] before:absolute before:inset-0 before:rounded-[20px] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none">
        {/* Separator Line */}
        <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-stone-300/50 to-transparent" />

        {/* Icons Container */}
        <div className="flex items-end gap-1.5 pt-0.5">
          {menuItems.map((item, index) => (
            <DockIcon
              key={item.path}
              item={item}
              active={pathname === item.path}
              index={index}
              hoveredIndex={hoveredIndex}
              setHoveredIndex={setHoveredIndex}
              totalItems={menuItems.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual Dock Icon with Reflection and Magnification
function DockIcon({
  item,
  active,
  index,
  hoveredIndex,
  setHoveredIndex,
  totalItems
}: {
  item: any,
  active: boolean,
  index: number,
  hoveredIndex: number | null,
  setHoveredIndex: (index: number | null) => void,
  totalItems: number
}) {
  const Icon = item.icon;
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate scale based on distance from hovered icon
  const getScale = () => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);

    if (distance === 0) return 1.4; // Hovered icon
    if (distance === 1) return 1.2; // Adjacent icons
    if (distance === 2) return 1.1; // Second-level neighbors
    return 1; // Far icons
  };

  const getYOffset = () => {
    if (hoveredIndex === null) return 0;
    const distance = Math.abs(index - hoveredIndex);

    if (distance === 0) return -12;
    if (distance === 1) return -6;
    if (distance === 2) return -3;
    return 0;
  };

  const scale = getScale();
  const yOffset = getYOffset();

  return (
    <Link href={item.path}>
      <div
        className="relative inline-flex flex-col items-center cursor-pointer px-1"
        onMouseEnter={() => {
          setHoveredIndex(index);
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setShowTooltip(false);
        }}
      >
        {/* Icon with Magnification */}
        <motion.div
          animate={{
            scale,
            y: yOffset
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
          className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all duration-200 ${active ? 'bg-emerald-600 shadow-lg shadow-emerald-200/50' : 'bg-white/90 backdrop-blur-sm border border-stone-200/50 shadow-sm hover:shadow-md'}`}
          style={{
            transformOrigin: 'bottom center'
          }}
        >
          <Icon
            className={active ? 'text-white' : 'text-stone-600'}
            size={20}
          />
        </motion.div>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-14 bg-stone-800/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg z-[10000]"
            >
              {item.label}
              {/* Tooltip arrow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-800/90 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}
