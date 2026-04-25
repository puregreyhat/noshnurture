import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../../core/models/recipe.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/recipe_provider.dart';
import '../../../../core/widgets/glass.dart';
import '../../recipes/screens/recipe_detail_screen.dart';
import '../../recipes/screens/recipes_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.88);
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final recipeProvider = context.watch<RecipeProvider>();
    final displayName = (auth.userName != null && auth.userName!.trim().isNotEmpty)
        ? auth.userName!.trim()
        : ((auth.userEmail != null && auth.userEmail!.contains('@'))
            ? auth.userEmail!.split('@').first
            : 'there');

    return Scaffold(
      body: GlassBackground(
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 32, 20, 24),
                sliver: SliverToBoxAdapter(
                  child: _buildAnimatedChild(
                    index: 0,
                    child: _WelcomeSection(displayName: displayName),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: _buildAnimatedChild(
                  index: 1,
                  child: _buildRecipeCarousel(context, recipeProvider),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                sliver: SliverToBoxAdapter(
                  child: _buildAnimatedChild(
                    index: 2,
                    child: _buildExploreMoreButton(context),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAnimatedChild({required int index, required Widget child}) {
    final delay = index * 0.2;
    final animation = CurvedAnimation(
      parent: _animController,
      curve: Interval(delay, 1.0, curve: Curves.easeOutCubic),
    );

    return SlideTransition(
      position: Tween<Offset>(begin: const Offset(0.0, 0.1), end: Offset.zero).animate(animation),
      child: FadeTransition(
        opacity: animation,
        child: child,
      ),
    );
  }

  Widget _buildRecipeCarousel(BuildContext context, RecipeProvider recipeProvider) {
    final rankedSuggestions = List<Recipe>.from(recipeProvider.recipes)
      ..sort(recipeProvider.compareRecipesByMatch);

    final suggestions = rankedSuggestions.take(6).toList();

    if (suggestions.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 24),
        child: Text('Add items to your pantry to see magic here!', style: TextStyle(color: Colors.grey)),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: _SectionHeader(
            icon: Icons.auto_awesome_rounded,
            title: 'Curated for you',
            subtitle: 'Stunning meals using your ingredients',
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 440,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (idx) {
              setState(() => _currentPage = idx);
            },
            physics: const BouncingScrollPhysics(),
            itemCount: suggestions.length,
            itemBuilder: (context, index) {
              final recipe = suggestions[index];
              return _buildRecipeCardAnimated(context, recipe, index, recipeProvider);
            },
          ),
        ),
        const SizedBox(height: 24),
        // Page Indicators
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            suggestions.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              height: 8,
              width: _currentPage == index ? 24 : 8,
              decoration: BoxDecoration(
                color: _currentPage == index ? Colors.orange.shade400 : Colors.orange.shade100,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRecipeCardAnimated(BuildContext context, Recipe recipe, int index, RecipeProvider provider) {
    return AnimatedBuilder(
      animation: _pageController,
      builder: (context, child) {
        double value = 1.0;
        if (_pageController.position.haveDimensions) {
          value = _pageController.page! - index;
          value = (1 - (value.abs() * 0.15)).clamp(0.0, 1.0);
        }
        return Center(
          child: Transform.scale(
            scale: Curves.easeOut.transform(value),
            child: child,
          ),
        );
      },
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => RecipeDetailScreen(recipe: recipe)),
          );
        },
        child: Container(
          width: 320,
          height: 440,
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1E293B).withOpacity(0.06), // Very soft shadow
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Stack(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Top section: Clean unobstructed image
                    Expanded(
                      child: Image.network(
                        recipe.imageUrl,
                        fit: BoxFit.cover,
                        alignment: Alignment.center,
                        errorBuilder: (_, __, ___) => Container(
                          color: const Color(0xFFFAF9F6),
                          child: const Icon(Icons.restaurant, color: Color(0xFFE2E2E2), size: 64),
                        ),
                      ),
                    ),
                    // Bottom section: Elegant white card
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (recipe.tags.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Text(
                                recipe.tags.first.toUpperCase(),
                                style: const TextStyle(
                                  color: Color(0xFFD97706), // Warm amber tag
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ),
                          Text(
                            recipe.title,
                            style: const TextStyle(
                              color: Color(0xFF111827), // Deep charcoal
                              fontWeight: FontWeight.w800,
                              fontSize: 22,
                              height: 1.2,
                              letterSpacing: -0.3,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 16),
                          // Stats Row
                          Row(
                            children: [
                              Icon(Icons.timer_outlined, color: Colors.grey.shade400, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                '${recipe.prepTimeMins}m',
                                style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                              const SizedBox(width: 16),
                              Icon(Icons.local_fire_department_outlined, color: Colors.grey.shade400, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                recipe.difficulty,
                                style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                              const Spacer(),
                              // Elegant Bookmark
                              GestureDetector(
                                onTap: () => provider.toggleBookmark(recipe.id),
                                child: Icon(
                                  recipe.isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
                                  color: recipe.isBookmarked ? const Color(0xFFD97706) : Colors.grey.shade400,
                                  size: 26,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildExploreMoreButton(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (_) => const RecipesScreen()));
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade300, width: 1),
        ),
        child: const Center(
          child: Text(
            'Explore All Recipes',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF374151), // Sleek grey
              letterSpacing: -0.3,
            ),
          ),
        ),
      ),
    );
  }
}

class _WelcomeSection extends StatelessWidget {
  final String displayName;

  const _WelcomeSection({required this.displayName});

  @override
  Widget build(BuildContext context) {
    final greetingName = displayName.isNotEmpty ? displayName : 'beautiful';
    
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Good morning, $greetingName.',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.2,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Let\'s create magic ✨',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1F2937),
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        CircleAvatar(
          radius: 24,
          backgroundColor: const Color(0xFFE2E8F0),
          child: Text(
            greetingName[0].toUpperCase(),
            style: const TextStyle(
              color: Color(0xFF475569),
              fontWeight: FontWeight.w800,
              fontSize: 22,
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
  final String subtitle;

  const _SectionHeader({required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9), // clean off-grey
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 20, color: const Color(0xFF475569)),
            ),
            const SizedBox(width: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 20, 
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
                color: Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: Text(
            subtitle,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
