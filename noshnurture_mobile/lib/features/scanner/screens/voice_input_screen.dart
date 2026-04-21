import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../../../core/providers/inventory_provider.dart';
import '../../../core/models/inventory_item.dart';

class VoiceInputScreen extends StatefulWidget {
  const VoiceInputScreen({super.key});

  @override
  State<VoiceInputScreen> createState() => _VoiceInputScreenState();
}

class _VoiceInputScreenState extends State<VoiceInputScreen> {
  late stt.SpeechToText _speech;
  bool _available = false;
  bool _listening = false;
  String _text = '';

  @override
  void initState() {
    super.initState();
    _speech = stt.SpeechToText();
    _initSpeech();
  }

  Future<void> _initSpeech() async {
    final available = await _speech.initialize();
    setState(() {
      _available = available;
    });
  }

  void _startListening() {
    if (!_available) return;
    setState(() {
      _listening = true;
      _text = '';
    });
    _speech.listen(
      onResult: (val) {
        setState(() {
          _text = val.recognizedWords;
        });
      },
    );
  }

  void _stopListening() {
    _speech.stop();
    setState(() {
      _listening = false;
    });
  }

  void _parseAndAdd() async {
    final provider = context.read<InventoryProvider>();
    final parts = _text
        .split(RegExp(r',| and | & '))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
    for (final p in parts) {
      final item = InventoryItem(
        id: DateTime.now().toIso8601String(),
        name: p,
        quantity: 1,
        unit: 'pcs',
        expiryDate: DateTime.now().add(const Duration(days: 7)),
        storageType: 'pantry',
        status: 'fresh',
      );
      await provider.addItem(item);
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFDFBF7),
      appBar: AppBar(
        title: const Text('Voice Input'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (_text.isEmpty && !_listening)
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.purple.shade50,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.mic_none_rounded, 
                            size: 80, color: Colors.purple.shade500),
                      ),
                      const SizedBox(height: 32),
                      const Text(
                        'Speak Your Groceries',
                        style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'serif'),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.purple.shade100),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.02),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Try saying things like:',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            const SizedBox(height: 12),
                            _buildExamplePhrase('"I bought 2 liters of milk"'),
                            const SizedBox(height: 8),
                            _buildExamplePhrase('"Add 3 apples and some bananas"'),
                            const SizedBox(height: 8),
                            _buildExamplePhrase('"We need bread, eggs, and cheese"'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            if (_listening || _text.isNotEmpty)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const Spacer(),
                      if (_listening)
                        TweenAnimationBuilder(
                          tween: Tween<double>(begin: 1.0, end: 1.2),
                          duration: const Duration(milliseconds: 800),
                          builder: (context, double val, child) {
                            return Transform.scale(
                              scale: val,
                              child: Container(
                                padding: const EdgeInsets.all(32),
                                decoration: BoxDecoration(
                                  color: Colors.purple.shade100,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.mic_rounded, 
                                    size: 64, color: Colors.purple.shade600),
                              ),
                            );
                          },
                          onEnd: () {
                            if (mounted) setState(() {});
                          },
                        ),
                      const SizedBox(height: 48),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.purple.shade100),
                          boxShadow: [
                            BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 20,
                                offset: const Offset(0, 5))
                          ],
                        ),
                        child: Column(
                          children: [
                            Text(
                              _listening ? 'Listening...' : 'I heard:',
                              style: TextStyle(
                                  color: Colors.purple.shade300,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _text.isEmpty ? 'Waiting for voice...' : _text,
                              style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w500,
                                  height: 1.4),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                      const Spacer(flex: 2),
                    ],
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!_available)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 16.0),
                      child: Text('Speech recognition is unavailable on this device.',
                          style: TextStyle(color: Colors.red)),
                    ),
                  SizedBox(
                    width: double.infinity,
                    height: 64,
                    child: ElevatedButton.icon(
                      onPressed: _available
                          ? (_listening ? _stopListening : _startListening)
                          : null,
                      icon: Icon(
                        _listening ? Icons.stop_circle_rounded : Icons.mic_rounded,
                        size: 28,
                      ),
                      label: Text(_listening ? 'Stop Listening' : 'Tap to Speak',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _listening ? Colors.red.shade500 : Colors.purple.shade600,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        elevation: _listening ? 0 : 4,
                      ),
                    ),
                  ),
                  if (_text.isNotEmpty && !_listening) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: OutlinedButton(
                        onPressed: _text.trim().isEmpty ? null : _parseAndAdd,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.purple.shade700,
                          side: BorderSide(color: Colors.purple.shade600, width: 2),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text('Add Detected Items',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExamplePhrase(String text) {
    return Row(
      children: [
        Icon(Icons.format_quote_rounded, color: Colors.purple.shade300, size: 20),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text, style: TextStyle(color: Colors.grey.shade800, fontStyle: FontStyle.italic)),
        ),
      ],
    );
  }
}
