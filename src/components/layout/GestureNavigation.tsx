"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Package, QrCode, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  angle: number; // degrees
}

export default function GestureNavigation() {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [altPressed, setAltPressed] = useState(false);
  const router = useRouter();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection (runs client-side)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const menuItems: MenuItem[] = [
    { icon: Home, label: "Home", path: "/", angle: 270 }, // Top (atan2 gives 270° or -90° for upward)
    { icon: Package, label: "Inventory", path: "/inventory", angle: 0 }, // Right (atan2 gives 0° for right)
    { icon: QrCode, label: "Scanner", path: "/scanner", angle: 90 }, // Bottom (atan2 gives 90° for down)
    { icon: Settings, label: "Settings", path: "/settings", angle: 180 }, // Left (atan2 gives 180° for left)
  ];

  // Desktop: Alt key detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !altPressed) {
        setAltPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && altPressed) {
        setAltPressed(false);
        if (isActive && selectedIndex !== null) {
          // Navigate on Alt release
          router.push(menuItems[selectedIndex].path);
          setIsActive(false);
          setSelectedIndex(null);
        } else {
          setIsActive(false);
          setSelectedIndex(null);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (altPressed) {
        if (!isActive) {
          // Show menu at current mouse position
          setPosition({ x: e.clientX, y: e.clientY });
          setIsActive(true);
        } else {
          // Calculate selected item based on VERTICAL mouse movement (vertical menu)
          const deltaY = e.clientY - position.y;
          const distance = Math.abs(deltaY);

          if (distance > 24) {
            // Map vertical movement to menu items (4 items)
            const itemHeight = 56; // px per tile
            let index = Math.floor((deltaY + itemHeight * 1.5) / itemHeight);
            index = Math.max(0, Math.min(3, index));
            setSelectedIndex(index);
          } else {
            setSelectedIndex(null);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [altPressed, isActive, position, selectedIndex, router]);

  // Mobile: 2-finger touch detection
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        // Calculate center point between two fingers
        const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        setPosition({ x, y });
        touchStartRef.current = { x, y };
        setIsActive(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isActive && touchStartRef.current) {
        e.preventDefault();
        // Calculate current center point
        const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        const deltaX = x - touchStartRef.current.x;
        const deltaY = y - touchStartRef.current.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 50) {
          // Map vertical movement to menu items for compact vertical menu on mobile
          const itemHeight = 64;
          let index = Math.floor((deltaY + 128) / itemHeight);
          index = Math.max(0, Math.min(3, index));
          setSelectedIndex(index);
        } else {
          setSelectedIndex(null);
        }
      }
    };

    const handleTouchEnd = () => {
      if (isActive && selectedIndex !== null) {
        router.push(menuItems[selectedIndex].path);
      }
      setIsActive(false);
      setSelectedIndex(null);
      touchStartRef.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isActive, selectedIndex, router]);

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
            style={{ pointerEvents: "none" }}
          />
          {/* Menu Bar Array */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed z-[101]"
            style={{
              left: position.x,
              top: position.y,
              transform: isMobile ? "translate(-50%, -110%)" : "translate(-50%, -120%)",
              pointerEvents: "none",
            }}
          >
            {/* Menu Container (vertical on all screens) */}
            <div className={`bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border-2 border-gray-200/50 p-2 flex flex-col gap-1.5`}>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = selectedIndex === index;

                return (
                  <motion.div
                    key={item.path}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 20 }}
                    className="relative"
                  >
                    <motion.div
                      animate={{
                        scale: isSelected ? 1.05 : 1,
                        x: isSelected ? 8 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className={`relative w-auto h-12 px-3 pr-4 flex-row items-center gap-2 rounded-xl transition-all ${
                        isSelected
                          ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl shadow-emerald-500/50"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-gray-700"}`} />
                      <span
                        className={`text-xs font-semibold ${isSelected ? "text-white" : "text-gray-700"}`}
                      >
                        {item.label}
                      </span>

                      {/* Active Indicator Dot */}
                      {isSelected && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute -right-1 w-2 h-2 rounded-full bg-white shadow-md"
                        />
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Instruction Tooltip */}
            {selectedIndex === null && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <div className="bg-gray-900/90 text-white text-xs px-4 py-2 rounded-lg shadow-xl">
                  {altPressed ? "Move mouse up/down to select" : "Swipe up/down to select"}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-2 h-2 bg-gray-900/90 rotate-45" />
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
