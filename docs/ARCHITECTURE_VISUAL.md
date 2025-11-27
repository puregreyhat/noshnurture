# Visual Architecture: Recipe Sorting & Filtering

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     NoshNuture Frontend                         │
│                   (Dashboard Component)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Cuisine Filter Buttons]                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Indian] [East Asian] [Italian] [European] [Intl]       │  │
│  │  (Orange = Selected, Gray = Unselected)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Recipe Cards - Sorted & Filtered]                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ 8/13 ingredients │  │ 7/10 ingredients │  │ 5/8 items   │  │
│  │ Appam with Stew  │  │ Paneer Biryani   │  │ Dosa        │  │
│  │ South Indian     │  │ Maharashtrian    │  │ South Ind.. │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘  │
│                                                                 │
│  (Only shows Indian cuisine due to filter)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         ↑
         │ fetch('/api/recipes/suggestions')
         │
┌─────────────────────────────────────────────────────────────────┐
│              NoshNuture Backend API Route                       │
│         (/api/recipes/suggestions - route.ts)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1] Get User's Inventory                                       │
│      ├─ Query Supabase: SELECT * FROM inventory_items          │
│      └─ Result: [Onion, Tomato, Potato, ...]                   │
│                                                                 │
│  [2] Generate Template Suggestions                              │
│      ├─ Run: generateSuggestions(items)                         │
│      ├─ Process:                                                │
│      │  - Curry Template → Added onion, tomato, carrot         │
│      │  - Stir-fry Template → Added carrot, beans              │
│      │  - Pasta Template → Skipped (no pasta in inventory)     │
│      └─ Result: 2-3 template recipes with:                      │
│         - title, cuisine, ingredients[]                         │
│         - score (based on expiring items)                       │
│         - matchedIngredientCount, totalTime                     │
│                                                                 │
│  [3] Fetch Sugran Recipes                                       │
│      ├─ POST to: https://sugran.vercel.app/api/recipes/search  │
│      ├─ Body: { inventory: ['Onion', 'Tomato', ...], limit: 12}│
│      └─ Response: 12 recipes with:                              │
│         - name, image_url, cuisine, ingredients[]              │
│         - matched: 5, missing: 8                                │
│                                                                 │
│  [4] Enhance Sugran Recipes                                     │
│      ├─ Extract cuisine from recipe.cuisine field              │
│      ├─ Or fallback: determineCuisineFromTitle(name)           │
│      ├─ Calculate:                                              │
│      │  - matchedIngredientCount = matched.length              │
│      │  - totalIngredientCount = matched + missing             │
│      └─ Add to recipes object                                   │
│                                                                 │
│  [5] Merge Both Sources                                         │
│      ├─ [...templateSuggestions, ...sugranRecipes]             │
│      ├─ Result: [3 templates + 12 sugran = 15 total]          │
│      └─ Example:                                                │
│         [                                                       │
│           { Curry, Indian, score:12, matched:6 },              │
│           { Appam, South Indian, matched:5 },                  │
│           { Dosa, South Indian, matched:8 },                   │
│           ...                                                   │
│         ]                                                       │
│                                                                 │
│  [6] Smart Sort (3-Tier)                                        │
│      ├─ Tier 1: Sort by matchedIngredientCount (DESC)          │
│      │  Result:                                                │
│      │  1. Dosa (8 ingredients)                                 │
│      │  2. Curry (6 ingredients)                                │
│      │  3. Appam (5 ingredients)                                │
│      │                                                          │
│      ├─ Tier 2: Same match? Sort by score (DESC)              │
│      │  (Only affects templates with expiring items)            │
│      │                                                          │
│      └─ Tier 3: Same score? Sort by totalTime (ASC)           │
│         (Only affects templates)                                │
│                                                                 │
│  [7] Slice & Return                                             │
│      ├─ Take first 12 recipes                                   │
│      └─ Return as JSON: { suggestions: [...] }                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         ↓
         │ Response with all recipes sorted by match
         │
┌─────────────────────────────────────────────────────────────────┐
│              Frontend: Apply Client-Side Filter                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Received from API: 12 sorted recipes                            │
│  ├─ Dosa (8/10) - South Indian                                  │
│  ├─ Curry (6/8) - Indian                                        │
│  ├─ Appam (5/13) - South Indian                                 │
│  ├─ Pasta (4/8) - Italian                                       │
│  └─ ... (8 more)                                                │
│                                                                 │
│  User clicks: [Indian] filter button                             │
│                                                                 │
│  Filter Logic:                                                  │
│  ```tsx                                                         │
│  .filter((recipe) => {                                          │
│    if (selectedCuisines.size === 0) return true;  // No filter │
│    return selectedCuisines.has(recipe.cuisine);                │
│  })                                                             │
│  ```                                                            │
│                                                                 │
│  Filtered Result (Indian & South Indian only):                  │
│  ├─ Dosa (8/10) - South Indian ✓                               │
│  ├─ Curry (6/8) - Indian ✓                                      │
│  └─ Appam (5/13) - South Indian ✓                              │
│                                                                 │
│  Result Display:                                                │
│  - Recipes still sorted by matched count                        │
│  - Only Indian/South Indian showing                             │
│  - Italian/European hidden                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Cuisine Detection Flow

```
Recipe Title
    ↓
    ├─ "Appam with Vegetable Stew"
    │  ↓
    │  Check patterns:
    │  - Contains "appam"? → Not in Indian patterns
    │  - Contains "sambar"? → No
    │  - ...
    │  ↓
    │  Fallback: Sugran has cuisine="South Indian"
    │  ✓ Use Sugran's cuisine
    │
    ├─ "Butter Paneer Masala"
    │  ↓
    │  Check patterns:
    │  - Contains "masala"? → YES!
    │  - Indian pattern matched
    │  ✓ cuisine = "Indian"
    │
    └─ "Spaghetti Aglio e Olio"
       ↓
       Check patterns:
       - Contains "pasta"? → NO
       - Contains "pizza"? → NO
       - ...
       ↓
       No pattern matched
       ✓ cuisine = "International" (default)
```

## Data Structure: Recipe Object

```javascript
// Template Suggestion (from NoshNuture)
{
  id: "curry-onion-tomato-carrot",
  title: "Carrot Curry",
  source: "template",
  cuisine: "Indian",                    // Added ✓
  image: "https://unsplash.com/...",
  ingredients: [
    { name: "onion", amount: "1 medium" },
    { name: "tomato", amount: "2" },
    { name: "carrot", amount: "2 cups" },
    // ... more ingredients
  ],
  usedIngredients: ["onion", "tomato", "carrot"],
  missingIngredients: ["garam masala", "turmeric"],
  instructions: ["Heat oil...", "Sauté...", ...],
  score: 12,                            // Template only
  totalTime: 25,                        // Template only
  matchedIngredientCount: 3,            // Added ✓
  totalIngredientCount: 8,              // Added ✓
}

// Sugran Suggestion (from External API)
{
  id: "sugran-b9e7e8d2-3f8e-4e2f-819d-51d5b190d17e",
  title: "Appam with Vegetable Stew",
  source: "sugran",
  cuisine: "South Indian",              // Extracted from API ✓
  image: "https://freepik.com/...",
  matched: 5,                           // From Sugran
  missing: 8,                           // From Sugran
  matchedIngredientCount: 5,            // Calculated ✓
  totalIngredientCount: 13,             // Calculated ✓
  // Sugran doesn't have: score, totalTime, instructions
}
```

## Sorting Algorithm Visualization

```
Input: Unsorted recipes
┌────────────────────────────────────────────┐
│ Recipe A: 6 ingredients matched, score: 10 │
│ Recipe B: 8 ingredients matched, score: 5  │
│ Recipe C: 6 ingredients matched, score: 15 │
│ Recipe D: 3 ingredients matched, score: 8  │
└────────────────────────────────────────────┘

Step 1: Sort by matchedIngredientCount (DESC)
┌────────────────────────────────────────────┐
│ Recipe B: 8 ← Highest match count          │
│ Recipe A: 6 ┐                              │
│ Recipe C: 6 ┤ Same match, needs tier 2     │
│ Recipe D: 3 └ Lowest match count           │
└────────────────────────────────────────────┘

Step 2: For ties, sort by score (DESC)
┌────────────────────────────────────────────┐
│ Recipe B: 8 matched, score: 5              │
│ Recipe C: 6 matched, score: 15 ← Higher    │
│ Recipe A: 6 matched, score: 10             │
│ Recipe D: 3 matched, score: 8              │
└────────────────────────────────────────────┘

Step 3: For remaining ties, sort by time (ASC)
┌────────────────────────────────────────────┐
│ Recipe B: 8 matched, score: 5              │
│ Recipe C: 6 matched, score: 15, time: 25   │
│ Recipe A: 6 matched, score: 10, time: 20   │ ← If tied
│ Recipe D: 3 matched, score: 8              │
└────────────────────────────────────────────┘

Final Output: B → C → A → D
```

## Filter Application Example

```
All 12 Recipes (Already Sorted by Match)
┌─────────────────────────┐
│ #1 Dosa (8/10) - S.Indian│
│ #2 Curry (6/8) - Indian │
│ #3 Appam (5/13) - S.Indian
│ #4 Pasta (4/8) - Italian│
│ #5 Noodles (3/6) - E.Asian
│ #6 Risotto (3/7) - Italian
│ #7 Stir-fry (2/5) - E.Asian
│ #8 Soup (2/6) - Intl   │
│ #9 Salad (1/4) - Intl  │
│ #10 Bread (1/3) - Intl │
│ #11 Rice (1/2) - Intl  │
│ #12 Tea (0/1) - Intl   │
└─────────────────────────┘

User Selects: Indian + East Asian
        ↓

Filter Logic:
if (selectedCuisines = {Indian, East Asian})
  keep if recipe.cuisine in selectedCuisines

        ↓

Filtered & Still Sorted
┌─────────────────────────┐
│ #1 Dosa (8/10) - S.Indian│ ✓
│ #2 Curry (6/8) - Indian │ ✓
│ #3 Appam (5/13) - S.Indian ✓
│ #5 Noodles (3/6) - E.Asian ✓
│ #7 Stir-fry (2/5) - E.Asian ✓
│
│ (Hidden: Italian, International) ✗
└─────────────────────────┘
```

## Key Points

✅ **Sorting happens server-side** (API) before sending to frontend
✅ **Filtering happens client-side** (browser) for instant UX
✅ **Both sources** (templates + Sugran) treated equally in sorting
✅ **Cuisine data** extracted from Sugran, inferred for templates
✅ **Match counts** calculated from both inventory & recipe data
✅ **No duplicate API calls** when filtering (already have all data)
