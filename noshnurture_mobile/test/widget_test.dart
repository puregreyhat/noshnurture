import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:noshnurture_mobile/main.dart';
import 'package:noshnurture_mobile/core/providers/auth_provider.dart';
import 'package:noshnurture_mobile/core/providers/inventory_provider.dart';
import 'package:noshnurture_mobile/core/providers/heynosh_provider.dart';
import 'package:noshnurture_mobile/core/providers/shopping_list_provider.dart';
import 'package:noshnurture_mobile/core/providers/recipe_provider.dart';

void main() {
  testWidgets('NoshNurture Application Core Framework Boots successfully', (WidgetTester tester) async {
    // Build our app and trigger a frame with requisite state providers injected
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(create: (_) => InventoryProvider()),
          ChangeNotifierProvider(create: (_) => HeyNoshProvider()),
          ChangeNotifierProvider(create: (_) => ShoppingListProvider()),
          ChangeNotifierProvider(create: (_) => RecipeProvider()),
        ],
        child: const NoshNurtureApp(),
      ),
    );

    // Verify that the foundational MaterialApp is correctly spun up by the GoRouter wrapper.
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
