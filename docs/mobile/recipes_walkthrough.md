# 🍽️ Recipes Feature Walkthrough

**Location:** `lib/features/recipes/screens/`

## 1. Where do the Recipes come from? (The API)
If the examiner asks about the API connection, point them to `lib/core/providers/recipe_provider.dart`.

*   **The Sugran API:** On line 22 of the provider, you define `_sugranApiUrl = 'https://sugran.vercel.app/api/recipes?limit=50'`.
*   **Fetching Logic:** The `fetchRecipes()` function uses the `http` package (`http.get`) to call this API.
*   **Parsing the JSON:** It takes the JSON response (`json.decode`), looks at the `results` array, and maps every item into a `Recipe` object in Dart. It handles missing data gracefully (e.g., if calories are missing, it defaults to 400).

---

## 2. `RecipesScreen`
This screen acts as a catalog of all available AI-generated or curated recipes.
*   **Grid Layout:** Displays recipe cards using a grid layout.
*   **Search/Filter:** Often includes logic to search by name or filter by tags (like "Vegan", "High Protein").
*   **Interaction:** Tapping a card routes the user to the `RecipeDetailScreen`.

## 2. `RecipeDetailScreen`
This is a highly dynamic and interactive screen that cross-references the recipe with your actual pantry.

### Key Logic & UI Components:
*   **SliverAppBar:** Provides the beautiful expanding/collapsing header image. Includes custom frosted glass buttons (`_glassIconButton`) for back navigation and bookmarking.
*   **Pantry Cross-referencing:**
    *   It uses `context.watch<RecipeProvider>()`.
    *   `foundCount` and `totalCount` are calculated by checking the recipe ingredients against the items in your `InventoryProvider`.
*   **Ingredients UI:**
    *   **Progress Bar:** Shows a visual indicator of how close you are to having all ingredients (e.g., 4 of 5 ingredients owned).
    *   **In Pantry vs Missing:** Dynamically generates lists showing exactly what you have (with green checkmarks) and what you are missing (with grey circles).
*   **Responsive Design:** Uses a `LayoutBuilder`. If the screen is wide (like on a tablet or web, `constraints.maxWidth > 900`), it displays the Ingredients and Instructions side-by-side using a `Row`. Otherwise, it stacks them vertically in a `Column`.
*   **Instructions parsing:** `_normalizeStepText` ensures each instruction step ends with proper punctuation.
