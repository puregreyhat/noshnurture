import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/providers/survey_provider.dart';
import 'package:go_router/go_router.dart';

class SurveyScreen extends StatefulWidget {
  const SurveyScreen({super.key});

  @override
  _SurveyScreenState createState() => _SurveyScreenState();
}

class _SurveyScreenState extends State<SurveyScreen> {
  final PageController _pageController = PageController();

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SurveyProvider(),
      child: Builder(
        builder: (context) {
          final provider = context.watch<SurveyProvider>();

          return Scaffold(
            backgroundColor: const Color(0xFFFDFBF7),
            appBar: AppBar(
              backgroundColor: const Color(0xFFFDFBF7),
              elevation: 0,
              leading: provider.currentStep > 0
                  ? IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.black87),
                      onPressed: () {
                        provider.previousStep();
                        _pageController.previousPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      },
                    )
                  : const SizedBox.shrink(),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(4.0),
                child: LinearProgressIndicator(
                  value: (provider.currentStep + 1) / provider.totalSteps,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Colors.green.shade600,
                  ),
                ),
              ),
            ),
            body: SafeArea(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildWelcomeStep(context, provider),
                  _buildProfileStep(context, provider),
                  _buildAssessmentStep(context, provider),
                  _buildNeedsStep(context, provider),
                ],
              ),
            ),
            bottomNavigationBar: Padding(
              padding: const EdgeInsets.all(24.0),
              child: ElevatedButton(
                onPressed: provider.isLoading
                    ? null
                    : () async {
                        if (provider.currentStep < provider.totalSteps - 1) {
                          provider.nextStep();
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        } else {
                          final success = await provider.submitSurvey();
                          if (success && mounted) {
                            context.go('/dashboard');
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Survey Completed! Welcome to NoshNurture!',
                                ),
                              ),
                            );
                          }
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green.shade600,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: provider.isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(
                        provider.currentStep == provider.totalSteps - 1
                            ? 'Submit & Finish'
                            : 'Continue',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildWelcomeStep(BuildContext context, SurveyProvider provider) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('🌱', style: TextStyle(fontSize: 80)),
          const SizedBox(height: 32),
          const Text(
            'Welcome to NoshNurture!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              fontFamily: 'serif',
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Help us personalize your kitchen experience by answering a few quick questions.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
          const SizedBox(height: 48),
          TextField(
            decoration: InputDecoration(
              hintText: 'First Name',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
            ),
            onChanged: (val) => provider.firstName = val,
          ),
        ],
      ),
    );
  }

  Widget _buildProfileStep(BuildContext context, SurveyProvider provider) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Tell us about yourself 👤',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              fontFamily: 'serif',
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'Who are you?',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: ['Homemaker', 'Working Woman', 'Student', 'Other'].map((
              type,
            ) {
              final isSelected = provider.userType == type;
              return GestureDetector(
                onTap: () {
                  provider.userType = type;
                  provider.notifyListeners();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.green.shade50 : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isSelected
                          ? Colors.green.shade600
                          : Colors.grey.shade300,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Text(
                    type,
                    style: TextStyle(
                      color: isSelected
                          ? Colors.green.shade700
                          : Colors.black87,
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 32),
          const Text(
            'Household Size',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: provider.householdSize,
                isExpanded: true,
                items: ['1', '2', '3', '4', '5+']
                    .map(
                      (sz) => DropdownMenuItem(
                        value: sz,
                        child: Text('$sz people'),
                      ),
                    )
                    .toList(),
                onChanged: (val) {
                  if (val != null) {
                    provider.householdSize = val;
                    provider.notifyListeners();
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssessmentStep(BuildContext context, SurveyProvider provider) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Kitchen Habits 📊',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              fontFamily: 'serif',
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'How often do you forget expiry dates?',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          Slider(
            value: provider.expiryForgetfulness,
            min: 0,
            max: 3,
            divisions: 3,
            activeColor: Colors.amber.shade500,
            label: _getEmojiLabel(provider.expiryForgetfulness),
            onChanged: (val) {
              provider.expiryForgetfulness = val;
              provider.notifyListeners();
            },
          ),
          const SizedBox(height: 32),
          const Text(
            'Cooking Stress Level?',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          Slider(
            value: provider.cookingStress,
            min: 0,
            max: 3,
            divisions: 3,
            activeColor: Colors.orange.shade500,
            label: _getEmojiLabel(provider.cookingStress),
            onChanged: (val) {
              provider.cookingStress = val;
              provider.notifyListeners();
            },
          ),
        ],
      ),
    );
  }

  String _getEmojiLabel(double val) {
    if (val == 0) return '😊 Never';
    if (val == 1) return '😅 Sometimes';
    if (val == 2) return '😓 Often';
    return '😭 Very Often';
  }

  Widget _buildNeedsStep(BuildContext context, SurveyProvider provider) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'What features do you need? 🎯',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              fontFamily: 'serif',
            ),
          ),
          const SizedBox(height: 32),
          SwitchListTile(
            title: const Text(
              'Expiry Alerts',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: const Text('Get notified before food expires'),
            value: provider.wantsExpiryAlerts,
            activeThumbColor: Colors.green.shade600,
            onChanged: (val) {
              provider.wantsExpiryAlerts = val;
              provider.notifyListeners();
            },
          ),
          SwitchListTile(
            title: const Text(
              'Multilingual Recipes',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: const Text(
              'View cooking instructions in other languages',
            ),
            value: provider.wantsMultilingual,
            activeThumbColor: Colors.green.shade600,
            onChanged: (val) {
              provider.wantsMultilingual = val;
              provider.notifyListeners();
            },
          ),
        ],
      ),
    );
  }
}
