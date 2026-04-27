"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

interface ThreeDScrollerProps {
  frameCount: number;
  baseUrl: string; // e.g., "/frames/ezgif-frame-"
  extension: string; // e.g., ".png"
  targetRef?: React.RefObject<HTMLElement | null>;
}

export const ThreeDScroller: React.FC<ThreeDScrollerProps> = ({
  frameCount,
  baseUrl,
  extension,
  targetRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);

  // Scroll tracking with optional target
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });
  
  // Create a spring for smoother frame transitions
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Map scroll progress (0-1) to frame index (1-frameCount)
  const frameIndex = useTransform(smoothProgress, [0, 1], [1, frameCount]);

  // Handle Resize and Canvas Resolution (DPR)
  useEffect(() => {
    const handleResize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        
        // Ensure smoothing is high-quality after resize
        const context = canvas.getContext("2d");
        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload images
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let count = 0;

    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        const frameNum = i.toString().padStart(3, '0');
        img.src = `${baseUrl}${frameNum}${extension}`;
        img.onload = () => {
            count++;
            setLoadedCount(count);
            if (count === frameCount) {
                setImages(loadedImages);
            }
        };
        loadedImages[i] = img; // Keep index consistent with i
    }
  }, [frameCount, baseUrl, extension]);

  // Draw frame on canvas when frameIndex changes
  useEffect(() => {
    const render = () => {
        const canvas = canvasRef.current;
        if (!canvas || images.length === 0) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const currentFrame = Math.floor(frameIndex.get());
        const img = images[currentFrame];

        if (img && img.complete) {
            // "Cover" scaling logic
            const canvasAspect = canvas.width / canvas.height;
            const imgAspect = img.width / img.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (canvasAspect > imgAspect) {
                drawWidth = canvas.width;
                drawHeight = canvas.width / imgAspect;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            } else {
                drawWidth = canvas.height * imgAspect;
                drawHeight = canvas.height;
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
    };

    const unsubscribe = frameIndex.on("change", render);
    render();
    return () => unsubscribe();
  }, [frameIndex, images]);

  // Fade out as we scroll away
  const opacity = useTransform(scrollYProgress, [0.8, 1], [1, 0]);

  return (
    <motion.div 
        style={{ opacity }}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
      />
      
      {loadedCount < frameCount && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-50">
          <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
              initial={{ width: 0 }}
              animate={{ width: `${(loadedCount / frameCount) * 100}%` }}
            />
          </div>
          <p className="mt-6 text-stone-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Syncing Experience {Math.round((loadedCount / frameCount) * 100)}%
          </p>
        </div>
      )}
    </motion.div>
  );
};
