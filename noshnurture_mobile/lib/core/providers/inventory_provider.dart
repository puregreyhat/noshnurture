import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/inventory_item.dart';

class InventoryProvider extends ChangeNotifier {
  List<InventoryItem> _items = [];
  bool _isLoading = false;
  String? _error;
  String? _activeUserId;

  List<InventoryItem> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get totalItems => _items.length;
  int get freshItems =>
      _items.where((i) => _effectiveStatus(i) == 'fresh').length;
  int get expiringSoon =>
      _items.where((i) => _effectiveStatus(i) == 'expiring').length;
  int get expiredItems =>
      _items.where((i) => _effectiveStatus(i) == 'expired').length;

  String _effectiveStatus(InventoryItem item) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final expiry = DateTime(
      item.expiryDate.year,
      item.expiryDate.month,
      item.expiryDate.day,
    );
    final daysUntilExpiry = expiry.difference(today).inDays;

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'expiring';

    final rawStatus = item.status.toLowerCase();
    if (rawStatus == 'expired') return 'expired';
    if (rawStatus == 'expiring' ||
        rawStatus == 'warning' ||
        rawStatus == 'caution') {
      return 'expiring';
    }

    return 'fresh';
  }

  final String _baseUrl =
      'https://baokvmahvfdsexpmasvz.supabase.co/rest/v1/inventory_items';
  final String _anonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhb2t2bWFodmZkc2V4cG1hc3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjAyMjksImV4cCI6MjA3NjYzNjIyOX0.1lipYYH9vxGOrCwNRdiCKe3IimuYqbfgj9TdIQVFKHI';

  InventoryProvider() {
    fetchInventory();
  }

  Future<void> setActiveUser(String? userId) async {
    if (_activeUserId == userId) return;
    _activeUserId = userId;
    await fetchInventory();
  }

  Future<void> fetchInventory() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = _activeUserId ?? prefs.getString('user_id');
      final authToken = prefs.getString('auth_token') ?? _anonKey;

      if (userId == null || userId.isEmpty) {
        _items = [];
        _error = 'No active user session. Please sign in again.';
        _isLoading = false;
        notifyListeners();
        return;
      }

      String queryUrl =
          '$_baseUrl?is_consumed=eq.false&select=*&order=expiry_date.asc';
      queryUrl += '&user_id=eq.$userId';

      final response = await http.get(
        Uri.parse(queryUrl),
        headers: {
          'apikey': _anonKey,
          'Authorization': 'Bearer $authToken',
          'Prefer': 'return=representation',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        _items = data.map((json) => InventoryItem.fromJson(json)).toList();
      } else {
        _error = 'Failed to load inventory: ${response.statusCode}';
        debugPrint('Inventory fetch error body: ${response.body}');
      }
    } catch (e) {
      _error = 'Network error connecting to data source.';
      debugPrint(e.toString());
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addItem(InventoryItem item) async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = _activeUserId ?? prefs.getString('user_id');
      final authToken = prefs.getString('auth_token') ?? _anonKey;

      if (userId == null || userId.isEmpty) {
        _error = 'No active user session. Please sign in again.';
        return;
      }

      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {
          'apikey': _anonKey,
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: json.encode({
          'user_id': userId,
          'product_name': item.name,
          'quantity': item.quantity,
          'unit': item.unit,
          'expiry_date': item.expiryDate.toIso8601String(),
          'status': item.status,
          'storage_type': item.storageType,
          'is_consumed': false,
        }),
      );
      if (response.statusCode == 201) {
        await fetchInventory(); // Refresh full sync
      }
    } catch (e) {
      debugPrint('Failed to add: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateItem(InventoryItem item) async {
    _isLoading = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final authToken = prefs.getString('auth_token') ?? _anonKey;

      final response = await http.patch(
        Uri.parse('$_baseUrl?id=eq.${item.id}'),
        headers: {
          'apikey': _anonKey,
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: json.encode({
          'product_name': item.name,
          'quantity': item.quantity,
          'unit': item.unit,
          'expiry_date': item.expiryDate.toIso8601String(),
          'status': item.status,
          'storage_type': item.storageType,
        }),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        await fetchInventory();
      } else {
        debugPrint(
          'Failed to update: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      debugPrint('Failed to update: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteItem(String id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final authToken = prefs.getString('auth_token') ?? _anonKey;

      await http.delete(
        Uri.parse('$_baseUrl?id=eq.$id'),
        headers: {'apikey': _anonKey, 'Authorization': 'Bearer $authToken'},
      );
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to delete: $e');
    }
  }
}
