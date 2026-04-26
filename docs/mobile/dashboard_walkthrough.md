# 🏠 Dashboard Feature Walkthrough

**Location:** `lib/features/dashboard/screens/dashboard_screen.dart`

This is the homepage of the app. It's designed to look premium and dynamic.

## Key Concepts to Explain in Viva

### 1. Animations (`AnimationController`)
*   The screen implements `SingleTickerProviderStateMixin` to allow frame-by-frame animations.
*   **`_animController`:** Runs over 1400 milliseconds.
*   **`_buildAnimatedChild`:** Wraps elements in a `SlideTransition` and `FadeTransition`. It uses the `index` variable to stagger the animations (delay = index * 0.2). This creates the cascading "waterfall" effect when the screen loads.

### 2. Layout Structure
*   Uses a `CustomScrollView` with `SliverPadding` and `SliverToBoxAdapter`. This allows for highly customizable scrolling layouts compared to a standard `ListView`.

### 3. The Recipe Carousel (`_buildRecipeCarousel`)
*   **AI Integration:** It fetches recipes from `RecipeProvider`.
*   **Smart Sorting:** `rankedSuggestions = List<Recipe>.from(recipeProvider.recipes)..sort(recipeProvider.compareRecipesByMatch);`
    *   This logic (inside the provider) sorts recipes so that meals you have the most ingredients for show up first.
*   **PageView Controller:** Uses a `PageView.builder` to swipe left/right between cards. `_currentPage` state updates the little dot indicators below the cards.
*   **Card Animation (`_buildRecipeCardAnimated`):** Uses an `AnimatedBuilder` to scale down cards that are slightly off-screen, giving it a 3D rotating cover-flow effect.

### 4. Navigation
*   Clicking "Explore More" uses standard Flutter navigation `Navigator.push(context, MaterialPageRoute(...))` instead of `go_router` because it's navigating deeper into a sub-stack rather than a top-level route.
