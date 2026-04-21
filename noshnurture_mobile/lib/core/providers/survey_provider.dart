import 'package:flutter/material.dart';

class SurveyProvider extends ChangeNotifier {
  int _currentStep = 0;
  bool _isLoading = false;

  int get currentStep => _currentStep;
  bool get isLoading => _isLoading;
  final int totalSteps = 4;

  // Form Data
  String firstName = '';
  String lastName = '';
  String userType = 'Homemaker';
  String householdSize = '2';
  double expiryForgetfulness = 1; // 0-3
  double cookingStress = 1; // 0-3
  bool wantsExpiryAlerts = false;
  bool wantsMultilingual = false;

  void setStep(int step) {
    _currentStep = step;
    notifyListeners();
  }

  void nextStep() {
    if (_currentStep < totalSteps - 1) {
      _currentStep++;
      notifyListeners();
    }
  }

  void previousStep() {
    if (_currentStep > 0) {
      _currentStep--;
      notifyListeners();
    }
  }

  Future<bool> submitSurvey() async {
    _isLoading = true;
    notifyListeners();

    try {
      await Future.delayed(const Duration(seconds: 2));
      return true;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
