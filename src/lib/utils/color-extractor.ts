/**
 * Intelligent "Monet" Engine for NoshNurture.
 * Extracts vibrant and food-accurate colors from recipe images.
 */

export interface ThemePalette {
  theme: string; // The vibrant dominant color (hex)
  accent: string; // A complementary or brighter version (hex)
  glow: string; // Low-opacity version for backgrounds (rgba)
}

const DEFAULT_PALETTE: ThemePalette = {
  theme: '#10b981', // Emerald 500
  accent: '#22d3ee', // Cyan 400
  glow: 'rgba(16, 185, 129, 0.2)',
};

/**
 * Smart Keyword Fallbacks based on Recipe Title.
 * Ensures the dashboard always has a relevant soul even if image extraction fails.
 */
function getFallbackPalette(title: string = ''): ThemePalette {
  const t = title.toLowerCase();
  
  // Browns: Desserts, Chocolates, Breads
  if (t.includes('chocolate') || t.includes('mousse') || t.includes('brownie') || t.includes('cake') || t.includes('bread') || t.includes('cookie')) {
    return { theme: '#78350f', accent: '#fbbf24', glow: 'rgba(120, 53, 15, 0.2)' };
  }
  
  // Reds: Pizza, Tomato, Strawberry, Pasta Sauce
  if (t.includes('pizza') || t.includes('tomato') || t.includes('strawberry') || t.includes('cherry') || t.includes('marinara') || t.includes('sauce') || t.includes('spicy')) {
    return { theme: '#ef4444', accent: '#f87171', glow: 'rgba(239, 68, 68, 0.2)' };
  }
  
  // Greens: Salads, Pesto, Spinach, Veggies
  if (t.includes('salad') || t.includes('green') || t.includes('pesto') || t.includes('spinach') || t.includes('veggie') || t.includes('kale')) {
    return DEFAULT_PALETTE;
  }
  
  // Ambers/Yellows: Curry, Lemon, Pasta, Corn
  if (t.includes('curry') || t.includes('lemon') || t.includes('pasta') || t.includes('corn') || t.includes('soup') || t.includes('egg')) {
    return { theme: '#f59e0b', accent: '#fbbf24', glow: 'rgba(245, 158, 11, 0.2)' };
  }
  
  // Oranges: Salmon, Carrot, Pumpkin
  if (t.includes('salmon') || t.includes('carrot') || t.includes('pumpkin') || t.includes('sweet potato')) {
    return { theme: '#f97316', accent: '#fdba74', glow: 'rgba(249, 115, 22, 0.2)' };
  }

  return DEFAULT_PALETTE;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function getVibrancy(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const bri = max / 255;
  return sat * bri; // Balance saturation and brightness
}

export async function extractThemeColors(imageUrl: string, title: string = ''): Promise<ThemePalette> {
  const fallback = getFallbackPalette(title);
  if (!imageUrl) return fallback;

  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(fallback);

        const size = 100; // Better resolution for intelligence
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size).data;
        let bestColor = { r: 0, g: 0, b: 0 };
        let maxVibrance = -Infinity;

        // Intelligent sampling loop
        // Steps through a grid but weights the center more heavily (Gaussian-like)
        for (let y = 0; y < size; y += 10) {
          for (let x = 0; x < size; x += 10) {
            const i = (y * size + x) * 4;
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            
            // Filters
            const avg = (r + g + b) / 3;
            if (avg < 30 || avg > 240) continue; // Skip shadows and blown-out whites (plates)
            
            // Center Weighting (Higher weight for pixels closer to center)
            const distFromCenter = Math.sqrt(Math.pow(x - size/2, 2) + Math.pow(y - size/2, 2));
            const weight = 1 + (1 - (distFromCenter / (size/Math.sqrt(2)))); // 1.0 to 2.0
            
            const vibrance = getVibrancy(r, g, b) * weight;
            
            if (vibrance > maxVibrance) {
              maxVibrance = vibrance;
              bestColor = { r, g, b };
            }
          }
        }

        // If we didn't find any "good" color, use fallback
        if (maxVibrance === -Infinity) return resolve(fallback);

        const themeHex = rgbToHex(bestColor.r, bestColor.g, bestColor.b);
        
        // Smarter accent generation
        const accentColor = {
            r: Math.min(255, bestColor.r + 40),
            g: Math.min(255, bestColor.g + 40),
            b: Math.min(255, bestColor.b + 40)
        };
        const accentHex = rgbToHex(accentColor.r, accentColor.g, accentColor.b);
        
        resolve({
          theme: themeHex,
          accent: accentHex,
          glow: `rgba(${bestColor.r}, ${bestColor.g}, ${bestColor.b}, 0.2)`,
        });
      };

      img.onerror = () => resolve(fallback);
      img.src = imageUrl;
    });
  } catch (e) {
    return fallback;
  }
}
