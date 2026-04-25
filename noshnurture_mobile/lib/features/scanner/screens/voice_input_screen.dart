import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../../../core/providers/inventory_provider.dart';
import '../../../core/models/inventory_item.dart';
import '../../../core/utils/voice_parser.dart';

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
  List<InventoryItem> _detectedItems = [];

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
      _detectedItems.clear();
    });
    _speech.listen(
      onResult: (val) {
        setState(() {
          _text = val.recognizedWords;
          if (val.finalResult) {
            _parseDetectedItems();
          }
        });
      },
    );
  }

  void _stopListening() async {
    await _speech.stop();
    setState(() {
      _listening = false;
      _parseDetectedItems();
    });
  }

  void _parseDetectedItems() {
    if (_text.trim().isNotEmpty) {
      _detectedItems = VoiceParser.parse(_text);
    }
  }

  void _addDetectedItems() async {
    final provider = context.read<InventoryProvider>();
    for (final item in _detectedItems) {
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
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 400),
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0.0, 0.1),
                      end: Offset.zero,
                    ).animate(animation),
                    child: child,
                  ),
                ),
                child: _buildMainContent(),
              ),
            ),
            _buildBottomControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildMainContent() {
    // State 1: Idle
    if (_text.isEmpty && !_listening) {
      return SingleChildScrollView(
        key: const ValueKey('idle'),
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
      );
    }
    
    // State 2: Listening or Processing
    if (_detectedItems.isEmpty || _listening) {
      return Padding(
        key: const ValueKey('listening'),
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
      );
    }

    // State 3: Detected Items Display
    return Column(
      key: const ValueKey('detected'),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
          child: Row(
            children: [
              Icon(Icons.check_circle_outline, color: Colors.purple.shade600),
              const SizedBox(width: 8),
              const Text(
                'Detected Items',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _detectedItems.length,
            itemBuilder: (context, index) {
              final item = _detectedItems[index];
              final days = item.expiryDate.difference(DateTime.now()).inDays;
              return Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.purple.shade100),
                ),
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  leading: CircleAvatar(
                    backgroundColor: Colors.purple.shade50,
                    child: Text('${item.quantity}', style: TextStyle(color: Colors.purple.shade700, fontWeight: FontWeight.bold)),
                  ),
                  title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  subtitle: Text('${item.unit} • Auto-Expires in $days days'),
                  trailing: IconButton(
                    icon: Icon(Icons.remove_circle_outline, color: Colors.red.shade300),
                    onPressed: () {
                      setState(() {
                        _detectedItems.removeAt(index);
                        if (_detectedItems.isEmpty) _text = ''; // Reset if empty
                      });
                    },
                  ),
                ),
              );
            },
          ),
        ),
      ],
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

  Widget _buildBottomControls() {
    return Padding(
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
          
          if (_detectedItems.isNotEmpty && !_listening) ...[
            SizedBox(
              width: double.infinity,
              height: 58,
              child: ElevatedButton.icon(
                onPressed: _detectedItems.isEmpty ? null : _addDetectedItems,
                icon: const Icon(Icons.add_task_rounded),
                label: Text('Confirm & Add ${_detectedItems.length} Items',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.purple.shade600,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton.icon(
                onPressed: _startListening,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Try Again'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.purple.shade700,
                  side: BorderSide(color: Colors.purple.shade200),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ] else ...[
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
          ]
        ],
      ),
    );
  }
}
