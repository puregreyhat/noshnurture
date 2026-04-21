class ShoppingListItem {
  final String id;
  final String itemName;
  final String quantity;
  final String unit;
  final String addedFrom; // 'recipe', 'low_stock', 'manual'
  final DateTime createdAt;

  ShoppingListItem({
    required this.id,
    required this.itemName,
    required this.quantity,
    required this.unit,
    required this.addedFrom,
    required this.createdAt,
  });
}
