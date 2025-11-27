# Multi-Brand Ingredient Matching Implementation

## Summary
Fixed the recipe ingredient matching system to recognize product variants from different brands. Now "Everest Pav Bhaji Masala", "Suhana Pav Bhaji Masala", and "Shan Pav Bhaji Masala" all correctly match to the canonical ingredient "pav bhaji masala" when displaying in recipes.

## Problem
- Users had products like "Everest Pav Bhaji Masala" and "Suhana Pav Bhaji Masala" in inventory
- Recipe pages showed these as "missing ingredients" even though the user owned them
- The matching logic wasn't stripping brand names to find the base ingredient

## Solution

### 1. Enhanced Brand Name Stripping (`src/lib/ingredients/normalize.ts`)
- Expanded the descriptors/brands filtering set to include:
  - Common Indian food brands: `everest`, `suhana`, `shan`, `tamarind`, `tata`, `amul`, `aashirvaad`, `MDH`, `catch`, `eastern`, `spice`, `dabur`, `britannia`
  - Product descriptors: `organic`, `natural`, `premium`, `pure`, `extract`, `essence`, `powder`, `oil`
  
- Added logic to filter out brand names from tokenized ingredients
- Added two-word combination matching for compound ingredients like "pav bhaji"

**Example flow:**
```
Input: "Everest Pav Bhaji Masala"
↓ Tokenize: ["everest", "pav", "bhaji", "masala"]
↓ Filter brands: ["pav", "bhaji", "masala"]
↓ Check combinations: "pav bhaji" → Found in canonical!
↓ Output: "pav bhaji masala" ✓
```

### 2. Added Brand→Ingredient Mappings (`src/lib/ingredients/synonyms.ts`)
- Added explicit mappings for common brand products:
  - `"everest pav bhaji masala": "pav bhaji masala"`
  - `"suhana pav bhaji masala": "pav bhaji masala"`
  - `"shan pav bhaji masala": "pav bhaji masala"`
  - `"tata salt": "salt"`
  - `"aashirvaad salt": "salt"`

### 3. Expanded Canonical Ingredients List (`src/lib/ingredients/canonical.ts`)
- Added missing common Indian masalas:
  - `"pav bhaji masala"`
  - `"chaat masala"`
  - `"sambar powder"`
  - `"rasam powder"`
  - `"tandoori masala"`

## How It Works Now

When a recipe requires an ingredient like "pav bhaji masala":

1. **Recipe Ingredient Normalization:**
   - Input: "pav bhaji masala"
   - Output: "pav bhaji masala" (already canonical)

2. **Inventory Items Normalization:**
   - Input: "Everest Pav Bhaji Masala"
   - Tokenize: ["everest", "pav", "bhaji", "masala"]
   - Strip brand: ["pav", "bhaji", "masala"]
   - Match: "pav bhaji masala"
   - Output: "pav bhaji masala" ✓

   - Input: "Suhana Pav Bhaji Masala"
   - Same process → Output: "pav bhaji masala" ✓

3. **Comparison:**
   - Recipe requires: "pav bhaji masala"
   - User has: ["pav bhaji masala", "pav bhaji masala", "pav bhaji masala"] (from different brands)
   - Distance: 0 (exact match after normalization)
   - Result: "High match" ✅

## Files Modified

### 1. `src/lib/ingredients/normalize.ts`
- Enhanced `tokensToCandidate()` function with:
  - Brand name filtering
  - Two-word combination matching
  - Better meaningful token extraction

### 2. `src/lib/ingredients/synonyms.ts`
- Added brand→ingredient mappings
- Added pluralization mappings (salts → salt, sugars → sugar)

### 3. `src/lib/ingredients/canonical.ts`
- Added common Indian masalas to canonical list

### 4. `src/lib/__tests__/multi-brand-matching.test.ts` (New)
- Comprehensive test cases for multi-brand matching
- Tests verify all brand variants normalize to same canonical ingredient
- Tests verify Levenshtein distance is 0 between brand variants

## Test Coverage

The test suite validates:
- ✅ Everest Pav Bhaji Masala → pav bhaji masala
- ✅ Suhana Pav Bhaji Masala → pav bhaji masala
- ✅ Shan Pav Bhaji Masala → pav bhaji masala
- ✅ Tata Salt → salt
- ✅ Aashirvaad Salt → salt
- ✅ Cross-brand matching distance = 0
- ✅ Complex strings like "Everest Pav Bhaji Masala 100g" work correctly
- ✅ Descriptors like "organic", "premium", "pure" are stripped correctly

## Build Status
✅ Build succeeded with no errors
✅ All TypeScript checks pass
✅ Production build verified

## Benefits

1. **Better Match Accuracy:** Different brand variants are now recognized as the same ingredient
2. **Improved UX:** Users see accurate ingredient ownership percentages
3. **Scalable:** Easy to add new brands to the filtering list
4. **Maintainable:** Explicit mappings for manual override when needed
5. **Flexible:** Works with any number of brands for any ingredient

## Future Enhancements

1. Add more brand names to the filter list as users report them
2. Add fuzzy brand detection (first token is often brand name)
3. Machine learning-based brand detection
4. User-contributed brand mappings
5. Localization for different regions' common brands
