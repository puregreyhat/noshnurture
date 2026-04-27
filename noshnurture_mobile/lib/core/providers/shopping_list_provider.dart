import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/shopping_list_item.dart';
import '../models/inventory_item.dart';

class ShoppingListProvider extends ChangeNotifier {
  static const String _storageKey = 'shopping_list_items_v1';

  List<ShoppingListItem> _items = [];
  List<InventoryItem> _lowStockItems = [];
  final bool _isLoading = false;
  String? _error;

  List<ShoppingListItem> get items => _items;
  List<InventoryItem> get lowStockItems => _lowStockItems;
  bool get isLoading => _isLoading;
  String? get error => _error;

  ShoppingListProvider() {
    _loadStoredItems();
  }

  Future<void> _loadStoredItems() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);

      if (raw == null || raw.isEmpty) {
        _items = [];
      } else {
        final List<dynamic> decoded = json.decode(raw);
        _items = decoded
            .whereType<Map>()
            .map(
              (entry) => ShoppingListItem(
                id: entry['id']?.toString() ?? '',
                itemName: entry['itemName']?.toString() ?? '',
                quantity: entry['quantity']?.toString() ?? '1',
                unit: entry['unit']?.toString() ?? 'pcs',
                addedFrom: entry['addedFrom']?.toString() ?? 'manual',
                createdAt:
                    DateTime.tryParse(entry['createdAt']?.toString() ?? '') ??
                    DateTime.now(),
              ),
            )
            .toList();
      }
    } catch (_) {
      _items = [];
      _error = 'Failed to restore shopping list data.';
    }

    _lowStockItems = [
      InventoryItem(
        id: '99',
        name: 'Olive Oil',
        quantity: 1,
        unit: 'bottle',
        expiryDate: DateTime.now(),
        storageType: 'pantry',
        status: 'caution',
      ),
    ];

    notifyListeners();
  }

  Future<void> _persistItems() async {
    final prefs = await SharedPreferences.getInstance();
    final payload = _items
        .map(
          (item) => {
            'id': item.id,
            'itemName': item.itemName,
            'quantity': item.quantity,
            'unit': item.unit,
            'addedFrom': item.addedFrom,
            'createdAt': item.createdAt.toIso8601String(),
          },
        )
        .toList();
    await prefs.setString(_storageKey, json.encode(payload));
  }

  Future<void> addItem(
    String name,
    String qty,
    String unit,
    String from,
  ) async {
    _items.add(
      ShoppingListItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        itemName: name,
        quantity: qty,
        unit: unit,
        addedFrom: from,
        createdAt: DateTime.now(),
      ),
    );
    await _persistItems();
    notifyListeners();
  }

  Future<void> removeItem(String id) async {
    _items.removeWhere((item) => item.id == id);
    await _persistItems();
    notifyListeners();
  }

  Future<void> clearAll() async {
    _items.clear();
    await _persistItems();
    notifyListeners();
  }
}
