import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/providers/recipe_provider.dart';
import '../../../../core/widgets/glass.dart';
import 'recipe_detail_screen.dart';

class RecipesScreen extends StatefulWidget {
  const RecipesScreen({super.key});

  @override
  _RecipesScreenState createState() => _RecipesScreenState();
}

class _RecipesScreenState extends State<RecipesScreen> {
  int _selectedTabIndex = 0; // 0 for Discover, 1 for Bookmarked
  String _searchQuery = '';
  final Set<String> _selectedCuisines = {};

  Future<void> _openCuisineFilterSheet(List<String> cuisineOptions) async {
    final tempSelected = Set<String>.from(_selectedCuisines);
    var cuisineSearchQuery = '';

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final filteredCuisines = cuisineOptions.where((cuisine) {
              final q = cuisineSearchQuery.trim().toLowerCase();
              if (q.isEmpty) return true;
              return cuisine.toLowerCase().contains(q);
            }).toList();

            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.8,
              ),
              decoration: const BoxDecoration(
                color: Color(0xFFFFFCF5),
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 44,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'Choose cuisines',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: TextField(
                          onChanged: (value) {
                            setSheetState(() => cuisineSearchQuery = value);
                          },
                          decoration: InputDecoration(
                            hintText: 'Search cuisine...',
                            hintStyle: TextStyle(color: Colors.grey.shade500),
                            prefixIcon: const Icon(Icons.search),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: filteredCuisines.isEmpty
                            ? Center(
                                child: Text(
                                  'No cuisine found',
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                              )
                            : ListView.builder(
                                itemCount: filteredCuisines.length,
                                itemBuilder: (context, index) {
                                  final cuisine = filteredCuisines[index];
                                  final isSelected = tempSelected.contains(
                                    cuisine,
                                  );

                                  return InkWell(
                                    onTap: () {
                                      setSheetState(() {
                                        if (isSelected) {
                                          tempSelected.remove(cuisine);
                                        } else {
                                          tempSelected.add(cuisine);
                                        }
                                      });
                                    },
                                    borderRadius: BorderRadius.circular(12),
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: isSelected
                                            ? Colors.green.shade50
                                            : Colors.white,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: isSelected
                                              ? Colors.green.shade300
                                              : Colors.grey.shade300,
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              cuisine,
                                              style: TextStyle(
                                                fontWeight: isSelected
                                                    ? FontWeight.w700
                                                    : FontWeight.w500,
                                                color: Colors.black87,
                                              ),
                                            ),
                                          ),
                                          Checkbox(
                                            value: isSelected,
                                            activeColor: Colors.green.shade600,
                                            onChanged: (_) {
                                              setSheetState(() {
                                                if (isSelected) {
                                                  tempSelected.remove(cuisine);
                                                } else {
                                                  tempSelected.add(cuisine);
                                                }
                                              });
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setSheetState(() => tempSelected.clear());
                              },
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size.fromHeight(48),
                                side: BorderSide(color: Colors.grey.shade400),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: const Text('Clear all'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                setState(() {
                                  _selectedCuisines
                                    ..clear()
                                    ..addAll(tempSelected);
                                });
                                Navigator.pop(sheetContext);
                              },
                              style: ElevatedButton.styleFrom(
                                minimumSize: const Size.fromHeight(48),
                                backgroundColor: Colors.green.shade600,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: const Text(
                                'Done',
                                style: TextStyle(fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RecipeProvider>();
    final recipesBase = _selectedTabIndex == 0
        ? provider.recipes
        : provider.bookmarkedRecipes;
    final sortedRecipes = List.of(recipesBase)
      ..sort(provider.compareRecipesByMatch);

    final cuisineOptions = <String>{};
    for (final recipe in sortedRecipes) {
      for (final t in recipe.tags) {
        final tag = t.trim();
        if (tag.isNotEmpty) cuisineOptions.add(tag);
      }
    }

    final query = _searchQuery.trim().toLowerCase();
    final recipesToShow = sortedRecipes.where((recipe) {
      final matchesCuisine =
          _selectedCuisines.isEmpty ||
          recipe.tags.any(
            (tag) => _selectedCuisines.any(
              (selected) => selected.toLowerCase() == tag.toLowerCase(),
            ),
          );

      if (!matchesCuisine) return false;
      if (query.isEmpty) return true;

      final inTitle = recipe.title.toLowerCase().contains(query);
      final inTags = recipe.tags.any(
        (tag) => tag.toLowerCase().contains(query),
      );
      final inIngredients = recipe.ingredients.any(
        (ing) => ing.toLowerCase().contains(query),
      );
      return inTitle || inTags || inIngredients;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Recipes',
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 24,
            fontFamily: 'serif',
          ),
        ),
      ),
      body: GlassBackground(
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedTabIndex = 0),
                        child: GlassCard(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          borderRadius: BorderRadius.circular(16),
                          tint: _selectedTabIndex == 0
                              ? Colors.green.shade600.withOpacity(0.82)
                              : Colors.white.withOpacity(0.58),
                          child: Center(
                            child: Text(
                              'Discover',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: _selectedTabIndex == 0
                                    ? Colors.white
                                    : Colors.grey.shade600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedTabIndex = 1),
                        child: GlassCard(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          borderRadius: BorderRadius.circular(16),
                          tint: _selectedTabIndex == 1
                              ? Colors.green.shade600.withOpacity(0.82)
                              : Colors.white.withOpacity(0.58),
                          child: Center(
                            child: Text(
                              'Saved',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: _selectedTabIndex == 1
                                    ? Colors.white
                                    : Colors.grey.shade600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: GlassCard(
                        borderRadius: BorderRadius.circular(14),
                        child: TextField(
                          onChanged: (value) {
                            setState(() => _searchQuery = value);
                          },
                          decoration: InputDecoration(
                            hintText: 'Search recipes or ingredients...',
                            hintStyle: TextStyle(color: Colors.grey.shade500),
                            prefixIcon: const Icon(Icons.search),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    GestureDetector(
                      onTap: () {
                        final sortedCuisines = cuisineOptions.toList()
                          ..sort(
                            (a, b) =>
                                a.toLowerCase().compareTo(b.toLowerCase()),
                          );
                        _openCuisineFilterSheet(sortedCuisines);
                      },
                      child: GlassCard(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        tint: _selectedCuisines.isEmpty
                            ? Colors.white.withOpacity(0.58)
                            : Colors.green.shade50.withOpacity(0.7),
                        child: Row(
                          children: [
                            Icon(
                              Icons.tune,
                              size: 18,
                              color: _selectedCuisines.isEmpty
                                  ? Colors.black87
                                  : Colors.green.shade700,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _selectedCuisines.isEmpty
                                  ? 'Cuisine'
                                  : '${_selectedCuisines.length} selected',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: _selectedCuisines.isEmpty
                                    ? Colors.black87
                                    : Colors.green.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: recipesToShow.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.bookmark_border,
                              size: 48,
                              color: Colors.grey.shade400,
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'No recipes found',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.black54,
                              ),
                            ),
                            const Text(
                              'Try exploring and saving some recipes!',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: recipesToShow.length,
                        itemBuilder: (context, index) {
                          final recipe = recipesToShow[index];
                          final foundCount = provider.foundIngredientCount(
                            recipe,
                          );
                          final totalCount = provider.totalIngredientCount(
                            recipe,
                          );

                          return GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      RecipeDetailScreen(recipe: recipe),
                                ),
                              );
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 24),
                              child: GlassCard(
                                borderRadius: BorderRadius.circular(24),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Stack(
                                      children: [
                                        ClipRRect(
                                          borderRadius:
                                              const BorderRadius.vertical(
                                                top: Radius.circular(24),
                                              ),
                                          child: Image.network(
                                            recipe.imageUrl,
                                            height: 180,
                                            width: double.infinity,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) =>
                                                Container(
                                                  height: 180,
                                                  width: double.infinity,
                                                  color: Colors.green.shade50,
                                                  alignment: Alignment.center,
                                                  child: Icon(
                                                    Icons.restaurant_menu,
                                                    color:
                                                        Colors.green.shade700,
                                                    size: 36,
                                                  ),
                                                ),
                                          ),
                                        ),
                                        Positioned(
                                          top: 12,
                                          left: 12,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 5,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.white.withOpacity(
                                                0.95,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(999),
                                            ),
                                            child: Text(
                                              '$foundCount/$totalCount found',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700,
                                                color: foundCount > 0
                                                    ? Colors.green.shade700
                                                    : Colors.grey.shade600,
                                              ),
                                            ),
                                          ),
                                        ),
                                        Positioned(
                                          top: 12,
                                          right: 12,
                                          child: GestureDetector(
                                            onTap: () => provider
                                                .toggleBookmark(recipe.id),
                                            child: Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: const BoxDecoration(
                                                color: Colors.white,
                                                shape: BoxShape.circle,
                                              ),
                                              child: Icon(
                                                recipe.isBookmarked
                                                    ? Icons.bookmark
                                                    : Icons.bookmark_border,
                                                color: Colors.green.shade600,
                                                size: 20,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(16.0),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            recipe.title,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 20,
                                              fontFamily: 'serif',
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              Icon(
                                                Icons.access_time,
                                                size: 16,
                                                color: Colors.grey.shade600,
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                '${recipe.prepTimeMins} mins',
                                                style: TextStyle(
                                                  color: Colors.grey.shade600,
                                                  fontSize: 13,
                                                ),
                                              ),
                                              const SizedBox(width: 16),
                                              Icon(
                                                Icons.local_fire_department,
                                                size: 16,
                                                color: Colors.orange.shade400,
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                '${recipe.calories} kcal',
                                                style: TextStyle(
                                                  color: Colors.grey.shade600,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 12),
                                          Wrap(
                                            spacing: 8,
                                            children: recipe.tags
                                                .take(3)
                                                .map(
                                                  (tag) => Container(
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                          horizontal: 10,
                                                          vertical: 4,
                                                        ),
                                                    decoration: BoxDecoration(
                                                      color:
                                                          Colors.green.shade50,
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            8,
                                                          ),
                                                    ),
                                                    child: Text(
                                                      tag,
                                                      style: TextStyle(
                                                        color: Colors
                                                            .green
                                                            .shade700,
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                )
                                                .toList(),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
