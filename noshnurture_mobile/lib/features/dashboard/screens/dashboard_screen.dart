import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/models/inventory_item.dart';
import '../../../../core/models/recipe.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/inventory_provider.dart';
import '../../../../core/providers/recipe_provider.dart';
import '../../../../core/widgets/glass.dart';
import '../../recipes/screens/recipe_detail_screen.dart';
import '../../recipes/screens/recipes_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _daysUntilExpiry(DateTime expiryDate) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final expiry = DateTime(expiryDate.year, expiryDate.month, expiryDate.day);
    return expiry.difference(today).inDays;
  }

  String _effectiveStatus(InventoryItem item) {
    final daysUntilExpiry = _daysUntilExpiry(item.expiryDate);

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'expiring';

    final rawStatus = item.status.toLowerCase();
    if (rawStatus == 'expired') return 'expired';
    if (rawStatus == 'warning' ||
        rawStatus == 'caution' ||
        rawStatus == 'expiring') {
      return 'expiring';
    }

    return 'fresh';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final inventory = context.watch<InventoryProvider>();
    final recipeProvider = context.watch<RecipeProvider>();
    final displayName =
        (auth.userName != null && auth.userName!.trim().isNotEmpty)
        ? auth.userName!.trim()
        : ((auth.userEmail != null && auth.userEmail!.contains('@'))
              ? auth.userEmail!.split('@').first
              : 'there');

    return Scaffold(
      body: GlassBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _WelcomeSection(displayName: displayName),
                const SizedBox(height: 20),
                _buildPantrySnapshot(inventory),
                const SizedBox(height: 20),
                _buildRecipeSuggestions(context, recipeProvider),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPantrySnapshot(InventoryProvider inventory) {
    final recentItems = inventory.items.take(3).toList();
    if (recentItems.isEmpty) return const SizedBox.shrink();

    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionHeader(
            icon: Icons.shopping_basket,
            title: 'Pantry Snapshot',
          ),
          const SizedBox(height: 10),
          ...recentItems.map((item) {
            final effectiveStatus = _effectiveStatus(item);
            final statusColor = effectiveStatus == 'expired'
                ? const Color(0xFFB91C1C)
                : (effectiveStatus == 'expiring'
                      ? const Color(0xFFB45309)
                      : const Color(0xFF15803D));
            final statusBg = effectiveStatus == 'expired'
                ? Colors.red.shade50
                : (effectiveStatus == 'expiring'
                      ? Colors.orange.shade50
                      : Colors.green.shade50);
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${item.quantity} ${item.unit}',
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      effectiveStatus.toUpperCase(),
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildRecipeSuggestions(
    BuildContext context,
    RecipeProvider recipeProvider,
  ) {
    final rankedSuggestions = List<Recipe>.from(recipeProvider.recipes)
      ..sort(recipeProvider.compareRecipesByMatch);

    final suggestions = rankedSuggestions.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const _SectionHeader(
              icon: Icons.restaurant_menu,
              title: 'Recipe Suggestions',
            ),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const RecipesScreen()),
                );
              },
              child: const Text(
                'View All',
                style: TextStyle(
                  color: Colors.green,
                  fontWeight: FontWeight.w700,
                  fontSize: 17,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (suggestions.isEmpty)
          const Text('No recipes found', style: TextStyle(color: Colors.grey))
        else
          Column(
            children: suggestions.map((recipe) {
              final foundCount = recipeProvider.foundIngredientCount(recipe);
              final totalCount = recipeProvider.totalIngredientCount(recipe);

              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => RecipeDetailScreen(recipe: recipe),
                    ),
                  );
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: GlassCard(
                    borderRadius: BorderRadius.circular(16),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(14),
                            bottomLeft: Radius.circular(14),
                          ),
                          child: Image.network(
                            recipe.imageUrl,
                            width: 118,
                            height: 96,
                            fit: BoxFit.cover,
                            alignment: Alignment.center,
                            errorBuilder: (_, __, ___) => Container(
                              width: 118,
                              height: 96,
                              color: Colors.green.shade50,
                              alignment: Alignment.center,
                              child: Icon(
                                Icons.restaurant,
                                color: Colors.green.shade700,
                                size: 26,
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  recipe.title,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 17,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${recipe.prepTimeMins} mins • ${recipe.difficulty}',
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green.shade50,
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text(
                                    '$foundCount/$totalCount ingredients',
                                    style: TextStyle(
                                      color: Colors.green.shade700,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                if (recipe.tags.isNotEmpty)
                                  Text(
                                    recipe.tags.first,
                                    style: TextStyle(
                                      color: Colors.grey.shade600,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                        IconButton(
                          icon: Icon(
                            recipe.isBookmarked
                                ? Icons.bookmark
                                : Icons.bookmark_border,
                            color: Colors.green,
                          ),
                          onPressed: () =>
                              recipeProvider.toggleBookmark(recipe.id),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
      ],
    );
  }
}

class _WelcomeSection extends StatelessWidget {
  final String displayName;

  const _WelcomeSection({required this.displayName});

  @override
  Widget build(BuildContext context) {
    final greetingName = displayName.isNotEmpty ? displayName : 'there';
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hello, $greetingName',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 16,
                  color: Color(0xFF6B7280),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Welcome back 👋',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF111827),
                  height: 1.1,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        CircleAvatar(
          radius: 22,
          backgroundColor: const Color(0xFF16A34A),
          child: Text(
            greetingName[0].toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;

  const _SectionHeader({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.green),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}
