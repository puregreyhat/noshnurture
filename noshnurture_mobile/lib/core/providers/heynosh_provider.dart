import 'package:flutter/material.dart';
import '../network/api_client.dart';

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

  Future<void> submitQuery(String query) async {
    if (query.trim().isEmpty) return;

    _isLoading = true;
    _aiResponse = '';
    _error = null;
    notifyListeners();

    try {
      // TODO: Replace with real API call to /api/heynosh
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
