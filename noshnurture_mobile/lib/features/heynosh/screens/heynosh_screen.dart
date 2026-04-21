import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/providers/heynosh_provider.dart';
import '../../../../core/widgets/glass.dart';

class HeyNoshScreen extends StatefulWidget {
  const HeyNoshScreen({super.key});

  @override
  _HeyNoshScreenState createState() => _HeyNoshScreenState();
}

class _HeyNoshScreenState extends State<HeyNoshScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _inputController = TextEditingController();

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _inputController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    _inputController.clear();
    await context.read<HeyNoshProvider>().submitQuery(text);
  }

  @override
  Widget build(BuildContext context) {
    final heynosh = context.watch<HeyNoshProvider>();

    return Scaffold(
      body: GlassBackground(
        child: SafeArea(
          child: Stack(
            children: [
              // Background glowing orbs
              Positioned(
                top: MediaQuery.of(context).size.height * 0.1,
                left: MediaQuery.of(context).size.width * 0.1,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.greenAccent.withOpacity(
                      heynosh.isSpeaking ? 0.3 : 0.1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.greenAccent.withOpacity(
                          heynosh.isSpeaking ? 0.3 : 0.1,
                        ),
                        blurRadius: 100,
                        spreadRadius: 50,
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                bottom: MediaQuery.of(context).size.height * 0.2,
                right: MediaQuery.of(context).size.width * 0.1,
                child: Container(
                  width: 250,
                  height: 250,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.indigoAccent.withOpacity(
                      heynosh.isLoading ? 0.3 : 0.1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.indigoAccent.withOpacity(
                          heynosh.isLoading ? 0.3 : 0.1,
                        ),
                        blurRadius: 120,
                        spreadRadius: 60,
                      ),
                    ],
                  ),
                ),
              ),

              Column(
                children: [
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Visualizer avatar
                        AnimatedBuilder(
                          animation: _pulseAnimation,
                          builder: (context, child) {
                            return Transform.scale(
                              scale: heynosh.isSpeaking
                                  ? _pulseAnimation.value
                                  : 1.0,
                              child: Container(
                                width: 120,
                                height: 120,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.grey.shade900,
                                  border: Border.all(color: Colors.white12),
                                  boxShadow: heynosh.isSpeaking
                                      ? [
                                          BoxShadow(
                                            color: Colors.greenAccent
                                                .withOpacity(0.6),
                                            blurRadius: 30,
                                            spreadRadius: 5,
                                          ),
                                        ]
                                      : [],
                                ),
                                child: Center(
                                  child: heynosh.isLoading
                                      ? const CircularProgressIndicator(
                                          color: Colors.greenAccent,
                                        )
                                      : Icon(
                                          Icons.mic,
                                          size: 48,
                                          color: heynosh.isSpeaking
                                              ? Colors.greenAccent
                                              : Colors.grey,
                                        ),
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 48),
                        // AI Response Text
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24.0),
                          child: Text(
                            heynosh.aiResponse.isNotEmpty
                                ? '"${heynosh.aiResponse}"'
                                : heynosh.isLoading
                                ? "Thinking..."
                                : "Type your command to talk to HeyNosh",
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: heynosh.aiResponse.isNotEmpty
                                  ? Colors.white.withOpacity(0.9)
                                  : Colors.grey,
                              fontSize: heynosh.aiResponse.isNotEmpty ? 22 : 18,
                              fontWeight: heynosh.aiResponse.isNotEmpty
                                  ? FontWeight.w500
                                  : FontWeight.w300,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Input Form
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade900,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _inputController,
                              style: const TextStyle(color: Colors.white),
                              decoration: const InputDecoration(
                                hintText: "Ask HeyNosh about your inventory...",
                                hintStyle: TextStyle(color: Colors.grey),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                              ),
                              onSubmitted: (_) => _handleSubmit(),
                            ),
                          ),
                          Container(
                            margin: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.send, color: Colors.black),
                              onPressed: _handleSubmit,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.only(bottom: 24.0),
                    child: Text(
                      "Response is read out loud via device TTS.",
                      style: TextStyle(color: Colors.white38, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
