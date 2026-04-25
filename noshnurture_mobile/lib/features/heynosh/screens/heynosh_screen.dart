import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:ui';
import '../../../../core/providers/heynosh_provider.dart';
import '../../../../core/providers/inventory_provider.dart';

class HeyNoshScreen extends StatefulWidget {
  const HeyNoshScreen({super.key});

  @override
  _HeyNoshScreenState createState() => _HeyNoshScreenState();
}

class _HeyNoshScreenState extends State<HeyNoshScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _inputController = TextEditingController();
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: false);
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
    // Dynamically retrieve InventoryProvider to allow HeyNosh to execute CRUD events locally
    final inventoryProvider = context.read<InventoryProvider>();
    await context.read<HeyNoshProvider>().submitQuery(text, inventoryProvider);
  }

  @override
  Widget build(BuildContext context) {
    final heynosh = context.watch<HeyNoshProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFFDFBF7), // Warm creamy background
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20),
              child: Row(
                children: [
                  const Text(
                    'HeyNosh',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1F2937),
                      letterSpacing: -0.5,
                    ),
                  ),
                  const Spacer(),
                  Icon(Icons.more_horiz, color: Colors.grey.shade400),
                ],
              ),
            ),
            
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Pulse Animation Mic
                  SizedBox(
                    height: 240,
                    width: 240,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        if (heynosh.isSpeaking || heynosh.isLoading)
                           AnimatedBuilder(
                             animation: _pulseController,
                             builder: (context, child) {
                               return Stack(
                                  alignment: Alignment.center,
                                  children: [
                                     _buildRing(_pulseController.value, heynosh.isLoading),
                                     _buildRing((_pulseController.value + 0.5) % 1.0, heynosh.isLoading),
                                  ]
                               );
                             }
                           ),
                        
                        // Center Mic Button
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF1E293B).withOpacity(0.06),
                                blurRadius: 24,
                                offset: const Offset(0, 12),
                              )
                            ]
                          ),
                          child: Icon(
                            heynosh.isSpeaking ? Icons.graphic_eq : Icons.mic_rounded,
                            size: 40,
                            color: heynosh.isSpeaking ? const Color(0xFFD97706) : const Color(0xFF475569),
                          ),
                        )
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 48),
                  
                  // Text Output
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32.0),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: Text(
                        heynosh.aiResponse.isNotEmpty
                            ? '"${heynosh.aiResponse}"'
                            : heynosh.isLoading
                            ? "I'm thinking about that..."
                            : "How can I help you in the kitchen today?",
                        key: ValueKey('${heynosh.aiResponse}_${heynosh.isLoading}'),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: heynosh.aiResponse.isNotEmpty || heynosh.isLoading
                              ? const Color(0xFF111827)
                              : const Color(0xFF94A3B8),
                          fontSize: heynosh.aiResponse.isNotEmpty ? 22 : 18,
                          fontWeight: heynosh.aiResponse.isNotEmpty
                              ? FontWeight.w600
                              : FontWeight.w400,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Input Form
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF1E293B).withOpacity(0.04),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    )
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _inputController,
                        style: const TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.w500),
                        decoration: InputDecoration(
                          hintText: "Type or say 'Add 2 apples'...",
                          hintStyle: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.normal),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                        ),
                        onSubmitted: (_) => _handleSubmit(),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: GestureDetector(
                        onTap: _handleSubmit,
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: const BoxDecoration(
                            color: Color(0xFF475569),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRing(double progress, bool isLoading) {
    final size = 100 + (progress * 140);
    final opacity = 1.0 - progress;
    final color = isLoading ? Colors.blueAccent : const Color(0xFFD97706); // Warm Amber
    
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: color.withOpacity(opacity * 0.5),
          width: 2,
        ),
        color: color.withOpacity(opacity * 0.1),
      ),
    );
  }
}
