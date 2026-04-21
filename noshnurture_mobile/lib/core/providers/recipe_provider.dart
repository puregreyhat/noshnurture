import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/recipe.dart';
import '../models/inventory_item.dart';
import '../utils/recipe_image_resolver.dart';

class RecipeProvider extends ChangeNotifier {
  List<Recipe> _recipes = [];
  bool _isLoading = false;
  String? _error;
  List<String> _userIngredients = [];

  List<Recipe> get recipes => _recipes;
  List<Recipe> get bookmarkedRecipes =>
      _recipes.where((r) => r.isBookmarked).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;

  final String _sugranApiUrl = 'https://sugran.vercel.app/api/recipes?limit=50';
  final Map<String, String> _synonyms = {
    'chilli': 'chili',
    'mirch': 'chili',
    'garbanzo': 'chickpea',
    'dhania': 'coriander',
    'haldi': 'turmeric',
  };
  final Set<String> _ingredientStopWords = {
    'a',
    'an',
    'the',
    'of',
    'and',
    'or',
    'to',
    'for',
    'with',
    'cup',
    'cups',
    'tbsp',
    'tsp',
    'tablespoon',
    'tablespoons',
    'teaspoon',
    'teaspoons',
    'gram',
    'grams',
    'g',
    'kg',
    'ml',
    'l',
    'oz',
    'lb',
    'pinch',
    'slice',
    'slices',
    'small',
    'medium',
    'large',
    'fresh',
    'chopped',
    'diced',
    'minced',
    'organic',
    'natural',
    'premium',
    'pure',
    'extract',
    'essence',
    'powder',
    'pieces',
    'piece',
    // common brand names
    'aashirvaad',
    'tata',
    'everest',
    'mdh',
    'suhana',
    'shan',
    'catch',
    'eastern',
    'amul',
    'dabur',
    'britannia',
  };

  RecipeProvider() {
    fetchRecipes();
  }

  void toggleBookmark(String id) {
    final index = _recipes.indexWhere((r) => r.id == id);
    if (index != -1) {
      _recipes[index].isBookmarked = !_recipes[index].isBookmarked;
      notifyListeners();
    }
  }

  void applyInventoryContext(List<InventoryItem> pantryItems) {
    final newIngredients = pantryItems
        .map((item) => item.name.toLowerCase().trim())
        .toList();

    if (_userIngredients.length == newIngredients.length) {
      bool isDifferent = false;
      for (int i = 0; i < newIngredients.length; i++) {
        if (_userIngredients[i] != newIngredients[i]) {
          isDifferent = true;
          break;
        }
      }
      if (!isDifferent) return;
    }

    _userIngredients = newIngredients;
    if (_recipes.isNotEmpty) {
      _sortRecipesByContext();
      notifyListeners();
    }
  }

  void _sortRecipesByContext() {
    _recipes.sort(compareRecipesByMatch);
  }

  int compareRecipesByMatch(Recipe a, Recipe b) {
    if (_userIngredients.isEmpty) {
      return a.title.toLowerCase().compareTo(b.title.toLowerCase());
    }

    final foundA = foundIngredientCount(a);
    final totalA = totalIngredientCount(a);
    final foundB = foundIngredientCount(b);
    final totalB = totalIngredientCount(b);

    // Keep all 0/n recipes at the end when user pantry context exists.
    final hasAnyMatchA = foundA > 0 ? 1 : 0;
    final hasAnyMatchB = foundB > 0 ? 1 : 0;
    if (hasAnyMatchA != hasAnyMatchB) {
      return hasAnyMatchB.compareTo(hasAnyMatchA);
    }

    final completeA = totalA > 0 && foundA == totalA ? 1 : 0;
    final completeB = totalB > 0 && foundB == totalB ? 1 : 0;
    if (completeA != completeB) {
      return completeB.compareTo(completeA);
    }

    final missingA = (totalA - foundA).clamp(0, totalA);
    final missingB = (totalB - foundB).clamp(0, totalB);
    if (missingA != missingB) {
      return missingA.compareTo(missingB);
    }

    if (foundA != foundB) {
      return foundB.compareTo(foundA);
    }

    if (totalA != totalB) {
      return totalA.compareTo(totalB);
    }

    return a.title.toLowerCase().compareTo(b.title.toLowerCase());
  }

  Set<String> _normalizeIngredientTokens(String value) {
    final normalized = value
        .toLowerCase()
        .replaceAll(RegExp(r'\([^)]*\)'), ' ')
        .replaceAll(RegExp(r'[^a-z0-9\s]'), ' ')
        .replaceAll(RegExp(r'\b\d+(\.\d+)?\b'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();

    if (normalized.isEmpty) return <String>{};

    return normalized
        .split(' ')
        .map((token) => _synonyms[token.trim()] ?? token.trim())
        .where(
          (token) =>
              token.isNotEmpty &&
              token.length > 2 &&
              !_ingredientStopWords.contains(token),
        )
        .toSet();
  }

  String _canonicalizeIngredient(String value) {
    final tokens = _normalizeIngredientTokens(value).toList();
    if (tokens.isEmpty) return value.toLowerCase().trim();
    tokens.sort((a, b) => b.length.compareTo(a.length));
    return tokens.first;
  }

  bool _isIngredientMatched(String recipeIngredient) {
    final ingName = recipeIngredient.toLowerCase().trim();
    if (ingName.isEmpty) return false;

    final canonicalRecipe = _canonicalizeIngredient(ingName);
    final recipeTokens = _normalizeIngredientTokens(ingName);

    for (var invName in _userIngredients) {
      final inv = invName.toLowerCase().trim();
      if (inv.isEmpty) continue;

      final canonicalInv = _canonicalizeIngredient(inv);
      final inventoryTokens = _normalizeIngredientTokens(inv);

      if (inv == ingName) return true;
      if (canonicalInv == canonicalRecipe) return true;
      if (recipeTokens.isNotEmpty && inventoryTokens.isNotEmpty) {
        if (recipeTokens.intersection(inventoryTokens).isNotEmpty) {
          return true;
        }
      }

      final longerStr = ingName.length >= inv.length ? ingName : inv;
      final shorterStr = ingName.length < inv.length ? ingName : inv;
      if (longerStr.isEmpty) continue;

      final lengthRatio = shorterStr.length / longerStr.length;
      if (lengthRatio >= 0.6 &&
          (ingName.contains(inv) || inv.contains(ingName))) {
        return true;
      }
    }

    return false;
  }

  int foundIngredientCount(Recipe recipe) {
    if (recipe.ingredients.isEmpty) return 0;
    return recipe.ingredients.where(_isIngredientMatched).length;
  }

  int totalIngredientCount(Recipe recipe) => recipe.ingredients.length;

  bool isIngredientOwned(String ingredient) => _isIngredientMatched(ingredient);

  List<String> missingIngredients(Recipe recipe) {
    return recipe.ingredients
        .where((ing) => !_isIngredientMatched(ing))
        .toList();
  }

  String _normalizeIngredient(dynamic i) {
    if (i == null) return '';
    // If it's already a string, try to clean/template-fix it
    if (i is String) {
      final s = i.trim();

      // If the string is a JSON-encoded object, try decoding
      try {
        final parsed = json.decode(s);
        if (parsed is Map && parsed['name'] != null) {
          return parsed['name'].toString().trim();
        }
        if (parsed is String) return parsed.trim();
      } catch (_) {}

      // Handle template placeholders like "${i['name']}" or similar
      final tmpl = RegExp(r'\$\{([^}]+)\}');
      final m = tmpl.firstMatch(s);
      if (m != null) {
        var inner = m.group(1) ?? '';
        final cleaned = inner
            .replaceAll("[", "")
            .replaceAll("]", "")
            .replaceAll("'", "")
            .replaceAll('"', "");
        // Try to extract the final identifier, e.g. i['name'] -> name
        final parts = cleaned
            .split(RegExp(r'[^A-Za-z0-9_]+'))
            .where((p) => p.isNotEmpty)
            .toList();
        if (parts.isNotEmpty) return parts.last.trim();
        return inner.trim();
      }

      return s;
    }

    // If it's an object/map, prefer common keys
    if (i is Map) {
      return (i['name'] ?? i['label'] ?? i['text'] ?? '').toString().trim();
    }

    return i.toString().trim();
  }

  Future<void> fetchRecipes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await http.get(Uri.parse(_sugranApiUrl));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        final List<dynamic> results = data['results'] ?? [];

        _recipes = results.map((json) {
          final title = json['name'] ?? json['title'] ?? 'Unknown Recipe';
          final List<dynamic> ingrs = json['ingredients'] ?? [];
          final ingredients = ingrs
              .map((i) => _normalizeIngredient(i))
              .where((s) => s.isNotEmpty)
              .toList();

          final List<dynamic> stps = json['steps'] ?? [];
          final instructions = stps.map((s) => s.toString()).toList();

          final tagsRaw = json['tags'] as List<dynamic>?;
          final List<String> tags = tagsRaw != null && tagsRaw.isNotEmpty
              ? tagsRaw.map((e) => e.toString()).toList()
              : [json['cuisine']?.toString() ?? 'General'];

          return Recipe(
            id: json['id']?.toString() ?? '',
            title: title,
            imageUrl: RecipeImageResolver.resolve(
              title: title.toString(),
              rawUrl: (json['image_url'] ?? json['image'])?.toString(),
              tags: tags,
            ),
            prepTimeMins:
                (json['prep_time_minutes'] ?? json['readyInMinutes'] ?? 30)
                    is num
                ? (json['prep_time_minutes'] ?? json['readyInMinutes'] ?? 30)
                      .toInt()
                : int.tryParse(
                        (json['prep_time_minutes'] ??
                                json['readyInMinutes'] ??
                                30)
                            .toString(),
                      ) ??
                      30,
            calories: (json['calories'] ?? 400) is num
                ? (json['calories'] ?? 400).toInt()
                : int.tryParse((json['calories'] ?? 400).toString()) ?? 400,
            difficulty: 'Medium',
            tags: tags,
            ingredients: ingredients,
            instructions: instructions,
          );
        }).toList();

        _sortRecipesByContext(); // Auto-sort if we already got inventory injected!
      } else {
        _error = 'Failed to load recipes: ${response.statusCode}';
      }
    } catch (e) {
      _error = 'Network error fetching remote recipes.';
      debugPrint(e.toString());
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
