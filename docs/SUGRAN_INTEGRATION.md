# Sugran Recipe Integration with Sorting & Filtering

## Overview
Integrated sorting and filtering for both template-based recipes (NoshNuture's own recipe templates) and Sugran recipes (from the external Sugran project). Both recipe sources now support cuisine-based filtering and intelligent sorting by ingredient match count.

## Integration Points

### 1. **Sugran API Response Structure**
The Sugran project returns recipes with the following metadata:
```json
{
  "recipe": {
    "id": "b9e7e8d2-3f8e-4e2f-819d-51d5b190d17e",
    "name": "Appam with Vegetable Stew",
    "cuisine": "South Indian",
    "image_url": "https://...",
    "ingredients": [...],
    "steps": [...],
    "calories": 400,
    "servings": 3,
    "prep_time_minutes": 480,
    "cook_time_minutes": 25,
    "tags": ["breakfast", "south-indian", "fermented", "coconut", "vegan"]
  },
  "matched": 5,        // Number of ingredients from user's inventory
  "missing": 8         // Number of ingredients user doesn't have
}
```

### 2. **NoshNuture API Processing** (`src/app/api/recipes/suggestions/route.ts`)

The API now:

#### a) **Extracts & Enriches Sugran Recipes**
```typescript
// Extract cuisine from Sugran recipe or infer from title
let cuisine = String((recipe.cuisine ?? '') as unknown).trim();
if (!cuisine) {
  cuisine = determineCuisineFromTitle(title);
}

// Calculate ingredient match counts
const matchedCount = Array.isArray(matched) ? matched.length : typeof matched === 'number' ? matched : 0;
const totalCount = matchedCount + missingCount;
```

#### b) **Unified Sorting Algorithm**
Recipes from both sources are sorted together:
```typescript
const merged = [...templateSuggestions, ...finalMapped]
  .sort((a, b) => {
    // 1. By matched ingredient count (desc) - recipes with max ingredients first
    const matchedCountDiff = bMatched - aMatched;
    if (matchedCountDiff !== 0) return matchedCountDiff;
    
    // 2. By score (desc) - prioritize recipes using expiring items
    const scoreDiff = bScore - aScore;
    if (scoreDiff !== 0) return scoreDiff;
    
    // 3. By time (asc) - prefer quicker recipes
    return aTime - bTime;
  })
  .slice(0, desiredCount);
```

#### c) **Cuisine Detection Fallback**
If a recipe doesn't have explicit cuisine metadata, it's inferred from the title:
```typescript
function determineCuisineFromTitle(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('curry') || titleLower.includes('masala') || 
      titleLower.includes('dosa') || titleLower.includes('idli')) {
    return 'Indian';
  }
  
  if (titleLower.includes('stir-fry') || titleLower.includes('fried rice')) {
    return 'East Asian';
  }
  
  // ... more patterns
  return 'International';
}
```

### 3. **Front-End Integration** (`src/components/pages/Dashboard.tsx`)

The Dashboard displays both recipe sources with unified filtering:

#### Recipe Card Display
```tsx
{/* Shows ingredient match count for both sources */}
<div className="absolute left-3 top-3">
  {typeof matchedIngredientCount === 'number' && typeof totalIngredientCount === 'number' ? (
    <div>Matched: {matchedIngredientCount}/{totalIngredientCount} ingredients</div>
  ) : null}
</div>
```

#### Cuisine Filter (works for all recipes)
```tsx
<div className="flex flex-wrap gap-2">
  {['Indian', 'East Asian', 'Italian', 'European', 'International'].map((cuisine) => (
    <button
      onClick={() => {
        const newSet = new Set(selectedCuisines);
        if (newSet.has(cuisine)) newSet.delete(cuisine);
        else newSet.add(cuisine);
        setSelectedCuisines(newSet);
      }}
      className={selectedCuisines.has(cuisine) ? 'bg-orange-600' : 'bg-gray-100'}
    >
      {cuisine}
    </button>
  ))}
</div>
```

#### Filter Application
```tsx
.filter((s) => {
  // Filter by selected cuisines (if none selected, show all)
  if (selectedCuisines.size === 0) return true;
  const sCuisine = (s as unknown as Record<string, unknown>).cuisine as string | undefined;
  return sCuisine && selectedCuisines.has(sCuisine);
})
```

## Data Flow

```
User's Inventory
    ↓
[NoshNuture API Route]
    ├─→ Generate Template Suggestions
    │   ├─ Sort by ingredient availability
    │   ├─ Add cuisine metadata
    │   └─ Calculate matched/total ingredients
    │
    ├─→ Fetch Sugran Recipes
    │   ├─ POST inventory to Sugran API
    │   ├─ Receive recipes with matched/missing counts
    │   ├─ Extract cuisine from recipe
    │   ├─ Calculate ingredient percentages
    │   └─ Add fallback cuisine detection
    │
    └─→ Merge & Sort Both Sources
        ├─ Primary sort: Matched ingredient count (desc)
        ├─ Secondary sort: Score/expiration priority (desc)
        └─ Tertiary sort: Cook time (asc)
         
              ↓
        [Return to Frontend]
        
              ↓
        [Dashboard Rendering]
        ├─ Show all recipes sorted by match
        ├─ Allow cuisine filtering
        ├─ Display ingredient match badges
        └─ Show recipe source (Template or Sugran)
```

## Example Scenarios

### Scenario 1: South Indian + Maharashtrian Mix
**User Filter**: Select "Indian" + "East Asian"
**Result**:
- Shows Appam with Vegetable Stew (South Indian) - 5/13 ingredients ✓
- Shows Sambar (South Indian) - 4/8 ingredients ✓
- Shows Paneer Biryani (Maharashtrian/Indian) - 7/12 ingredients ✓
- Hides Italian/European recipes

### Scenario 2: Maximum Match Priority
**Sorting (No filter applied)**:
1. Recipe with 10/12 ingredients matched (highest priority)
2. Recipe with 8/11 ingredients matched
3. Recipe with 7/10 ingredients matched
(Each secondary-sorted by expiring items, tertiary by cook time)

### Scenario 3: Mixed Recipe Sources
**Display**:
- Sugran's "Appam with Vegetable Stew" (5/13 ingredients) - Ranked #3
- NoshNuture Template: "Curry" with available veggies (6/8 ingredients) - Ranked #2
- Sugran's "Dosa" (8/10 ingredients) - Ranked #1 (most matches)

## Recipe Sources Comparison

| Aspect | NoshNuture Templates | Sugran Recipes |
|--------|---------------------|----------------|
| Generation | Rule-based templates | AI/ML suggestions |
| Ingredients | From user inventory | Curated recipe databases |
| Cuisine Data | Inferred from title | Explicit metadata |
| Preparation | 5-40 minutes | Variable |
| Instructions | Generic templates | Detailed steps |
| Customization | Simple structure | Full recipes with notes |

## API Endpoints

### `/api/recipes/suggestions`
```
GET /api/recipes/suggestions?source=sugran&all=false

Response:
{
  "suggestions": [
    {
      // Sugran recipes
      "id": "sugran-b9e7e8d2-3f8e-4e2f-819d-51d5b190d17e",
      "title": "Appam with Vegetable Stew",
      "source": "sugran",
      "cuisine": "South Indian",
      "image": "https://...",
      "matched": 5,
      "missing": 8,
      "matchedIngredientCount": 5,
      "totalIngredientCount": 13
    },
    {
      // NoshNuture templates
      "id": "curry-onion-tomato-carrot",
      "title": "Carrot Curry",
      "source": "template",  // implicit
      "cuisine": "Indian",
      "matchedIngredientCount": 6,
      "totalIngredientCount": 8,
      "score": 12,
      "totalTime": 25
    }
  ]
}
```

### Query Parameters
- `source=sugran` - Fetch from Sugran
- `source=template` - Only template suggestions (default)
- `all=true` - Return all available Sugran recipes (unpaginated)

## Environment Variables

Required in `.env.local` or Vercel environment:
```
SUGRAN_URL=https://sugran.vercel.app  # or local dev URL
```

## Features Enabled

✅ **Unified Sorting**: Both Sugran and template recipes sorted by ingredient match
✅ **Cuisine Filtering**: Filter across all recipe sources
✅ **Smart Detection**: Automatic cuisine detection from recipe title
✅ **Ingredient Visibility**: Show matched/total ingredient counts
✅ **Source Tracking**: Know which recipe came from Sugran vs Templates
✅ **Fallback**: If Sugran unavailable, template suggestions still work
✅ **Performance**: Client-side filtering (no extra API calls)

## Future Enhancements

1. **Dynamic Cuisine Extraction**: Use ML to detect cuisines from ingredients
2. **Hybrid Recipes**: Combine Sugran recipes with user's inventory items
3. **Recipe Rating**: Add user ratings for both sources
4. **Trending Recipes**: Track popular recipes from Sugran
5. **Dietary Filters**: Vegetarian/Vegan/Gluten-free across both sources
6. **Local Caching**: Cache Sugran recipes locally for offline access
7. **A/B Testing**: Compare template vs Sugran recipe success rates

## Troubleshooting

### Recipes not showing cuisine
**Cause**: Sugran API didn't return cuisine, and title didn't match patterns
**Solution**: Check `determineCuisineFromTitle()` function for the recipe name pattern

### All recipes showing "International"
**Cause**: Cuisine field is null/empty in Sugran response
**Solution**: Verify Sugran API is returning complete recipe data

### Sorting not working as expected
**Cause**: `matchedIngredientCount` not being set
**Solution**: Ensure Sugran API returns `matched` and `missing` fields

### Filter not applying to Sugran recipes
**Cause**: Recipe object doesn't have `cuisine` property
**Solution**: Check that enhancement step in API is running before frontend filtering
