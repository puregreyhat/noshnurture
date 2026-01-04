/**
 * BRAND MATCHING TEST CASES
 * 
 * This documents the expected behavior for multi-brand ingredient matching.
 * All variants from different brands should normalize to the same canonical ingredient.
 */

import { describe, it, expect } from 'vitest';
import { normalizeIngredientName, levenshtein } from '@/lib/ingredients/normalize';

describe('Multi-Brand Ingredient Matching', () => {
  describe('Pav Bhaji Masala (multiple brands)', () => {
    it('should normalize Everest Pav Bhaji Masala to pav bhaji masala', async () => {
      const result = await normalizeIngredientName('Everest Pav Bhaji Masala', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('pav bhaji masala');
    });

    it('should normalize Suhana Pav Bhaji Masala to pav bhaji masala', async () => {
      const result = await normalizeIngredientName('Suhana Pav Bhaji Masala', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('pav bhaji masala');
    });

    it('should normalize Shan Pav Bhaji Masala to pav bhaji masala', async () => {
      const result = await normalizeIngredientName('Shan Pav Bhaji Masala', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('pav bhaji masala');
    });

    it('should normalize plain pav bhaji masala to pav bhaji masala', async () => {
      const result = await normalizeIngredientName('pav bhaji masala', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('pav bhaji masala');
    });
  });

  describe('Salt (multiple brands)', () => {
    it('should normalize Tata Salt to salt', async () => {
      const result = await normalizeIngredientName('Tata Salt', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('salt');
    });

    it('should normalize Aashirvaad Salt to salt', async () => {
      const result = await normalizeIngredientName('Aashirvaad Salt', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('salt');
    });

    it('should normalize plain salt to salt', async () => {
      const result = await normalizeIngredientName('salt', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('salt');
    });
  });

  describe('Garam Masala (multiple brands)', () => {
    it('should normalize Everest Garam Masala to garam masala', async () => {
      const result = await normalizeIngredientName('Everest Garam Masala', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('garam masala');
    });

    it('should normalize MDH Garam Masala to garam masala', async () => {
      const result = await normalizeIngredientName('MDH Garam Masala', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('garam masala');
    });
  });

  describe('Chili Powder (multiple brands)', () => {
    it('should normalize Everest Chili Powder to chili powder', async () => {
      const result = await normalizeIngredientName('Everest Chili Powder', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('chili powder');
    });

    it('should normalize red chili powder to chili powder', async () => {
      const result = await normalizeIngredientName('red chili powder', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('chili powder');
    });
  });

  describe('Cross-brand distance checks', () => {
    it('Everest and Suhana pav bhaji masala should have distance 0', async () => {
      const norm1 = await normalizeIngredientName('Everest Pav Bhaji Masala', { prefer: 'fuzzy' });
      const norm2 = await normalizeIngredientName('Suhana Pav Bhaji Masala', { prefer: 'fuzzy' });
      const dist = levenshtein(norm1.toLowerCase(), norm2.toLowerCase());
      expect(dist).toBe(0);
    });

    it('Tata and Aashirvaad salt should have distance 0', async () => {
      const norm1 = await normalizeIngredientName('Tata Salt', { prefer: 'fuzzy' });
      const norm2 = await normalizeIngredientName('Aashirvaad Salt', { prefer: 'fuzzy' });
      const dist = levenshtein(norm1.toLowerCase(), norm2.toLowerCase());
      expect(dist).toBe(0);
    });
  });

  describe('Complex ingredient strings', () => {
    it('should handle "Everest Pav Bhaji Masala 100g" correctly', async () => {
      const result = await normalizeIngredientName('Everest Pav Bhaji Masala 100g', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('pav bhaji masala');
    });

    it('should handle "organic garam masala powder" correctly', async () => {
      const result = await normalizeIngredientName('organic garam masala powder', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('garam masala');
    });

    it('should handle "premium pure turmeric powder" correctly', async () => {
      const result = await normalizeIngredientName('premium pure turmeric powder', { prefer: 'fuzzy' });
      expect(result.toLowerCase()).toBe('turmeric');
    });
  });

  describe('Recipe ingredient matching workflow', () => {
    it('inventory brand variants should match recipe ingredient requirement', async () => {
      // Simulate: Recipe requires "pav bhaji masala"
      const recipeIngredient = 'pav bhaji masala';
      const recipeNorm = await normalizeIngredientName(recipeIngredient, { prefer: 'fuzzy' });

      // Simulate: User has three different brands
      const inventoryItems = [
        'Everest Pav Bhaji Masala',
        'Suhana Pav Bhaji Masala',
        'Shan Pav Bhaji Masala'
      ];

      for (const item of inventoryItems) {
        const itemNorm = await normalizeIngredientName(item, { prefer: 'fuzzy' });
        const dist = levenshtein(recipeNorm.toLowerCase(), itemNorm.toLowerCase());
        
        // All should have distance 0 (exact match after normalization)
        expect(dist).toBe(0);
      }
    });
  });
});
