class InventoryItem {
  final String id;
  final String name;
  final int quantity;
  final String unit;
  final DateTime expiryDate;
  final String storageType; // 'pantry', 'fridge', 'freezer'
  final String status; // 'fresh', 'expiring', 'expired'

  InventoryItem({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unit,
    required this.expiryDate,
    required this.storageType,
    required this.status,
  });
  static DateTime _parseDate(dynamic dateVal) {
    if (dateVal == null) return DateTime.now();
    String s = dateVal.toString();
    try {
      return DateTime.parse(s);
    } catch (e) {
      if (s.contains('-')) {
        final parts = s.split('-');
        if (parts.length == 3) {
          int? y, m, d;
          if (parts[2].length == 4) {
             y = int.tryParse(parts[2]);
             m = int.tryParse(parts[1]);
             d = int.tryParse(parts[0]);
          } else if (parts[0].length == 4) {
             y = int.tryParse(parts[0]);
             m = int.tryParse(parts[1]);
             d = int.tryParse(parts[2]);
          }
          if (y != null && m != null && d != null) {
            return DateTime(y, m, d);
          }
        }
      }
      return DateTime.now(); 
    }
  }

  factory InventoryItem.fromJson(Map<String, dynamic> json) {
    int parsedQty = 1;
    if (json['quantity'] != null) {
      if (json['quantity'] is num) {
        parsedQty = (json['quantity'] as num).toInt();
      } else {
        parsedQty = int.tryParse(json['quantity'].toString()) ?? 1;
      }
    }

    return InventoryItem(
      id: json['id']?.toString() ?? '',
      name: (json['product_name']?.toString() ?? json['name']?.toString() ?? 'Unknown Item'),
      quantity: parsedQty,
      unit: json['unit']?.toString() ?? 'pcs',
      expiryDate: _parseDate(json['expiry_date']),
      storageType: json['storage_type']?.toString() ?? 'fridge',
      status: json['status']?.toString() ?? 'fresh',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'quantity': quantity,
      'unit': unit,
      'expiry_date': expiryDate.toIso8601String(),
      'storage_type': storageType,
      'status': status,
    };
  }
}
