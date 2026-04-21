class RecipeImageResolver {
  static final List<String> _placeholderHints = [
    'via.placeholder.com',
    'placehold.co',
    'dummyimage.com',
    'placeholder',
    'loremflickr.com',
  ];

  static String resolve({
    required String title,
    String? rawUrl,
    List<String>? tags,
  }) {
    final normalizedTitle = title.trim().toLowerCase();
    final normalizedTags = (tags ?? [])
        .map((t) => t.toLowerCase().trim())
        .toList();
    final cleanRaw = (rawUrl ?? '').trim();

    if (_isValidImageUrl(cleanRaw)) {
      return cleanRaw;
    }

    final mappedImage = _mappedRealImageForTitle(normalizedTitle);
    if (mappedImage != null) {
      return mappedImage;
    }

    final fallbackQuery = _fallbackQuery(normalizedTitle, normalizedTags);
    return _unsplashQueryUrl(fallbackQuery);
  }

  static bool _isValidImageUrl(String url) {
    if (url.isEmpty) return false;
    final lower = url.toLowerCase();
    if (!(lower.startsWith('http://') || lower.startsWith('https://'))) {
      return false;
    }
    return !_placeholderHints.any(lower.contains);
  }

  static String? _mappedRealImageForTitle(String title) {
    if (title.contains('banana ice cream')) {
      return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80';
    }
    if (title.contains('chocolate mousse')) {
      return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80';
    }
    if (title.contains('ice cream')) {
      return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80';
    }
    if (title.contains('mousse') || title.contains('cake')) {
      return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80';
    }
    if (title.contains('biryani')) {
      return 'https://images.unsplash.com/photo-1563379091339-03246963d29c?auto=format&fit=crop&w=1200&q=80';
    }
    if (title.contains('dal') || title.contains('curry')) {
      return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80';
    }
    if (title.contains('pasta')) {
      return 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80';
    }
    if (title.contains('pizza')) {
      return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80';
    }
    if (title.contains('burger')) {
      return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80';
    }
    if (title.contains('salad')) {
      return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80';
    }
    if (title.contains('soup')) {
      return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80';
    }
    return null;
  }

  static String _fallbackQuery(String title, List<String> tags) {
    final primary = title
        .replaceAll(RegExp(r'[^a-z0-9\s-]'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();

    if (primary.isNotEmpty) {
      return '${primary.replaceAll(' ', ',')},food,dish';
    }

    if (tags.isNotEmpty) {
      return '${tags.first.replaceAll(' ', ',')},food,dish';
    }

    return 'food,dish';
  }

  static String _unsplashQueryUrl(String query) {
    final safeQuery = query
        .replaceAll(RegExp(r'\s+'), ',')
        .replaceAll(RegExp(r'[^a-z0-9,\-]'), '');
    return 'https://source.unsplash.com/960x720/?$safeQuery';
  }
}
