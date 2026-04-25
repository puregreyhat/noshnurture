import 'package:flutter/material.dart';
import '../network/api_client.dart';
import '../providers/inventory_provider.dart';
import '../utils/voice_parser.dart';

class HeyNoshProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  
  bool _isLoading = false;
  bool _isSpeaking = false;
  String _aiResponse = '';
  String? _error;

  bool get isLoading => _isLoading;
  bool get isSpeaking => _isSpeaking;
  String get aiResponse => _aiResponse;
  String? get error => _error;

  Future<void> submitQuery(String query, InventoryProvider inventoryProvider) async {
    if (query.trim().isEmpty) return;

    _isLoading = true;
    _aiResponse = '';
    _error = null;
    notifyListeners();

    try {
      // 1. Intercept CRUD Intents locally
      final lowerQ = query.toLowerCase();
      if (lowerQ.startsWith('add') || 
          lowerQ.startsWith('buy') || 
          lowerQ.startsWith('i bought') ||
          lowerQ.startsWith('we need') ||
          lowerQ.startsWith('get')) {
        
        final detectedItems = VoiceParser.parse(query);
        
        if (detectedItems.isNotEmpty) {
          int count = 0;
          for (final item in detectedItems) {
            await inventoryProvider.addItem(item);
            count++;
          }
          
          _isLoading = false;
          final plural = count > 1 ? 's' : '';
          _aiResponse = "I have successfully added $count item$plural to your inventory list!";
          _isSpeaking = true;
          notifyListeners();

          await Future.delayed(const Duration(seconds: 4));
          _isSpeaking = false;
          notifyListeners();
          return;
        }
      }

      // 2. Simulated/Real API Fallback for complex queries
      await Future.delayed(const Duration(seconds: 2));

      _isLoading = false;
      _aiResponse = "I have checked your inventory. We have tomatoes expiring soon!";
      _isSpeaking = true;
      notifyListeners();

      // Simulate TTS speaking duration
      await Future.delayed(const Duration(seconds: 3));
      
      _isSpeaking = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _isSpeaking = false;
      _error = e.toString();
      _aiResponse = "Sorry, I had trouble connecting to the network.";
      notifyListeners();
    }
  }
}
