import 'package:flutter_test/flutter_test.dart';
import 'package:noshnurture_mobile/core/models/inventory_item.dart';
import 'package:noshnurture_mobile/core/models/recipe.dart';
import 'package:noshnurture_mobile/core/providers/recipe_provider.dart';

void main() {
  group('RecipeProvider ingredient matching', () {
    test(
      'matches brand-prefixed pantry ingredient to canonical recipe ingredient',
      () {
        final provider = RecipeProvider();
        provider.applyInventoryContext([
          InventoryItem(
            id: '1',
            name: 'Aashirvaad Besan',
            quantity: 1,
            unit: 'kg',
            expiryDate: DateTime.now().add(const Duration(days: 30)),
            storageType: 'pantry',
            status: 'fresh',
          ),
        ]);

        expect(provider.isIngredientOwned('besan'), isTrue);
      },
    );

    test('matches chilli/chili synonym', () {
      final provider = RecipeProvider();
      provider.applyInventoryContext([
        InventoryItem(
          id: '1',
          name: 'red chilli powder',
          quantity: 1,
          unit: 'pack',
          expiryDate: DateTime.now().add(const Duration(days: 30)),
          storageType: 'pantry',
          status: 'fresh',
        ),
      ]);

      expect(provider.isIngredientOwned('chili powder'), isTrue);
    });

    test('computes found and missing counts correctly', () {
      final provider = RecipeProvider();
      provider.applyInventoryContext([
        InventoryItem(
          id: '1',
          name: 'Aashirvaad Besan',
          quantity: 1,
          unit: 'kg',
          expiryDate: DateTime.now().add(const Duration(days: 30)),
          storageType: 'pantry',
          status: 'fresh',
        ),
        InventoryItem(
          id: '2',
          name: 'sugar',
          quantity: 1,
          unit: 'kg',
          expiryDate: DateTime.now().add(const Duration(days: 30)),
          storageType: 'pantry',
          status: 'fresh',
        ),
      ]);

      final recipe = Recipe(
        id: 'r1',
        title: 'Besan Ladoo',
        imageUrl: '',
        prepTimeMins: 10,
        calories: 100,
        difficulty: 'Easy',
        tags: const ['indian'],
        ingredients: const ['besan', 'sugar', 'ghee'],
        instructions: const ['Mix and cook'],
      );

      expect(provider.foundIngredientCount(recipe), 2);
      expect(provider.totalIngredientCount(recipe), 3);
      expect(provider.missingIngredients(recipe), contains('ghee'));
    });
  });
}
