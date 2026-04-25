import '../models/inventory_item.dart';
import 'expiry_helper.dart';

class VoiceParser {
  static List<InventoryItem> parse(String text) {
    if (text.trim().isEmpty) return [];

    // Clean up typical command prefixes
    String lower = text.toLowerCase()
        .replaceAll('add', '')
        .replaceAll('buy', '')
        .replaceAll('i bought', '')
        .replaceAll('we need', '')
        .replaceAll('get', '');

    // Convert word-numbers into digits so the parser regex can catch them
    lower = _convertWordNumbersToDigits(lower);

    // Split by conjunctions
    final parts = lower
        .split(RegExp(r',| and | & '))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    List<InventoryItem> items = [];

    for (final p in parts) {
      // Regex to find things like "2 L of milk", "5 apples", "1 packet of something"
      final match = RegExp(r'^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s*(?:of\s+)?(.+)$').firstMatch(p);

      String name = p;
      int quantity = 1;
      String unit = 'pcs';

      if (match != null) {
        quantity = double.parse(match.group(1) ?? '1').ceil();
        String rawUnitOrNamePart = (match.group(2) ?? '').trim();
        String remainderName = (match.group(3) ?? '').trim();
        
        // Check if rawUnitOrNamePart is a standard unit
        if (['l', 'liters', 'liter', 'ml', 'kg', 'g', 'grams', 'kilos', 'packets', 'packet', 'box', 'boxes', 'pcs', 'pieces', 'dozen'].contains(rawUnitOrNamePart.toLowerCase())) {
          unit = rawUnitOrNamePart;
          name = remainderName;
        } else {
          // If it's not a standard unit, the "unit" might just be part of the name
          name = '$rawUnitOrNamePart $remainderName'.trim();
        }
      }

      items.add(
        InventoryItem(
          id: DateTime.now().toIso8601String() + p, // Unique ID
          name: _capitalize(name),
          quantity: quantity,
          unit: unit,
          expiryDate: ExpiryHelper.getSmartExpiry(name),
          storageType: 'fridge',
          status: 'fresh',
        ),
      );
    }
    return items;
  }

  static String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s.substring(0, 1).toUpperCase() + s.substring(1);
  }

  static String _convertWordNumbersToDigits(String input) {
    final map = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
      'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
      'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
      'eighteen': '18', 'nineteen': '19', 'twenty': '20',
      'a dozen': '12', 'half a dozen': '6', 'a couple of': '2',
      // We purposefully do not map "a" or "an" aggressively as they might cause false substitutions internally,
      // but 'a' at the very beginning of quantity contexts could be 1. It's safe to leave out for now.
    };

    String res = input;
    final sortedKeys = map.keys.toList()..sort((a, b) => b.length.compareTo(a.length));
    
    for (final key in sortedKeys) {
      res = res.replaceAll(RegExp(r'\b' + key + r'\b', caseSensitive: false), map[key]!);
    }
    return res;
  }
}
