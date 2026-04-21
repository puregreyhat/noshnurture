class Recipe {
  final String id;
  final String title;
  final String imageUrl;
  final int prepTimeMins;
  final int calories;
  final String difficulty;
  final List<String> tags;
  final List<String> ingredients;
  final List<String> instructions;
  bool isBookmarked;

  Recipe({
    required this.id,
    required this.title,
    required this.imageUrl,
    required this.prepTimeMins,
    required this.calories,
    required this.difficulty,
    required this.tags,
    required this.ingredients,
    required this.instructions,
    this.isBookmarked = false,
  });
}
