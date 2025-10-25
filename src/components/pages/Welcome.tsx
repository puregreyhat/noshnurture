"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, ChevronDown } from "lucide-react";

export default function WelcomeSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const opacity = Math.max(1 - scrollY / 300, 0);
  const translateY = Math.min(scrollY / 2, 100);

  // Smooth scroll handler
  const handleScrollDown = () => {
    const nextSection = document.getElementById("content-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        style={{ opacity, transform: `translateY(${translateY}px)` }}
        transition={{ duration: 0.4 }}
        className="relative h-screen sm:h-[90vh] bg-gradient-to-b from-emerald-700 via-emerald-600 to-emerald-500 flex items-center justify-center p-8 rounded-b-[3rem] shadow-2xl overflow-hidden z-10"
      >
        {/* Subtle background texture overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/green-gobbler.png')]"
        ></motion.div>

        {/* Main Content */}
        <div className="text-center relative z-10 font-['Poppins']">
          <motion.h1
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-6xl sm:text-7xl font-extrabold text-white mb-4 drop-shadow-lg flex justify-center items-center gap-3"
          >
            Welcome!
            
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg sm:text-xl text-emerald-100"
          >
            Here’s your personalized summary and today’s sustainability snapshot.
          </motion.p>

          {/* Floating Leaf Animation */}
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="mt-10 mx-auto w-fit"
          >
            <Leaf size={80} className="text-white drop-shadow-md" />
          </motion.div>

          {/* Scroll Indicator */}
           <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="mt-16 flex justify-center items-center text-white font-light tracking-wider text-lg cursor-pointer"
            onClick={handleScrollDown}
            >
            <span>Scroll Down</span>
            <ChevronDown size={36} className="text-white ml-2" />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
