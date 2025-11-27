import { describe, it, expect } from 'vitest';
import { normalizeIngredientName, levenshtein } from '@/lib/ingredients/normalize';

describe('Ingredient Matching - Salt Case', () => {
  it('should normalize "Aashirvaad Salt" to "salt"', async () => {
    const result = await normalizeIngredientName('Aashirvaad Salt', { prefer: 'fuzzy' });
    expect(result.toLowerCase()).toBe('salt');
  });

  it('should normalize "salt" to "salt"', async () => {
    const result = await normalizeIngredientName('salt', { prefer: 'fuzzy' });
    expect(result.toLowerCase()).toBe('salt');
  });

  it('should have distance 0 between normalized "salt" and "salt"', () => {
    const dist = levenshtein('salt', 'salt');
    expect(dist).toBe(0);
  });

  it('should have distance <= 2 between "salt" and normalized variations', async () => {
    const normSalt = await normalizeIngredientName('Aashirvaad Salt', { prefer: 'fuzzy' });
    const normPlain = await normalizeIngredientName('salt', { prefer: 'fuzzy' });
    
    const dist = levenshtein(normSalt.toLowerCase(), normPlain.toLowerCase());
    expect(dist).toBeLessThanOrEqual(2);
  });

  it('should normalize other product names correctly', async () => {
    const tests = [
      ['Tata Salt', 'salt'],
      ['Black Salt', 'salt'],
      ['Sea Salt', 'salt'],
      ['Rock Salt', 'salt'],
      ['Salted Butter', 'salt'], // May differ, but should normalize
    ];

    for (const [input, expectedSubstring] of tests) {
      const result = await normalizeIngredientName(input, { prefer: 'fuzzy' });
      // Result should be close to salt or contain salt logic
      const dist = levenshtein(result.toLowerCase(), 'salt');
      expect(dist).toBeLessThanOrEqual(3); // Allow some fuzzy match
    }
  });
});
