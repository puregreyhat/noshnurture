import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:speech_to_text/speech_to_text.dart' as stt;

void main() {
  runApp(const HeyNoshPhoneApp());
}

class HeyNoshPhoneApp extends StatelessWidget {
  const HeyNoshPhoneApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'HeyNosh Voice Link',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF16A34A),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF08111B),
      ),
      home: const VoiceBridgeScreen(),
    );
  }
}

class VoiceBridgeScreen extends StatefulWidget {
  const VoiceBridgeScreen({super.key});

  @override
  State<VoiceBridgeScreen> createState() => _VoiceBridgeScreenState();
}

class _VoiceBridgeScreenState extends State<VoiceBridgeScreen> {
  static const String _apiEndpoint =
      'https://noshnurture.vercel.app/api/heynosh';
  static const String _deviceToken = 'TEST_TOKEN_OR_USER_ID';

  final stt.SpeechToText _speech = stt.SpeechToText();
  final TextEditingController _manualInputController = TextEditingController();
  final ScrollController _logScrollController = ScrollController();

  final List<String> _serialLog = <String>[];

  bool _speechReady = false;
  bool _isListening = false;
  bool _isSending = false;
  String _heardText = '';
  String _replyText = '';
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _initSpeech();
    _appendLog('Boot: HeyNosh voice bridge ready');
  }

  @override
  void dispose() {
    _speech.stop();
    _manualInputController.dispose();
    _logScrollController.dispose();
    super.dispose();
  }

  Future<void> _initSpeech() async {
    final available = await _speech.initialize(
      onStatus: (status) {
        _appendLog('Mic status: $status');
      },
      onError: (error) {
        if (!mounted) {
          return;
        }
        _appendLog('Mic error: ${error.errorMsg}');
        setState(() {
          _speechReady = false;
          _isListening = false;
          _errorText = error.errorMsg;
        });
      },
    );

    if (!mounted) {
      return;
    }

    setState(() {
      _speechReady = available;
    });

    _appendLog(available ? 'Mic ready' : 'Mic unavailable on this device');
  }

  void _appendLog(String message) {
    if (!mounted) {
      return;
    }

    final timestamp = TimeOfDay.now().format(context);
    final entry = '[$timestamp] $message';
    debugPrint(entry);
    setState(() {
      _serialLog.add(entry);
      if (_serialLog.length > 80) {
        _serialLog.removeAt(0);
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_logScrollController.hasClients) {
        _logScrollController.animateTo(
          _logScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _startListening() async {
    if (!_speechReady || _isSending) {
      return;
    }

    setState(() {
      _errorText = null;
      _replyText = '';
      _heardText = '';
      _manualInputController.clear();
      _isListening = true;
    });

    _appendLog('Mic opened; speak your command');

    await _speech.listen(
      listenMode: stt.ListenMode.confirmation,
      onResult: (result) {
        if (!mounted) {
          return;
        }

        setState(() {
          _heardText = result.recognizedWords;
          _manualInputController.text = _heardText;
        });

        if (result.finalResult) {
          _appendLog('Heard: $_heardText');
        }
      },
    );
  }

  Future<void> _stopListeningAndSend() async {
    await _speech.stop();

    if (!mounted) {
      return;
    }

    setState(() {
      _isListening = false;
    });

    final text = _manualInputController.text.trim();
    if (text.isEmpty) {
      _appendLog('Nothing heard yet');
      return;
    }

    await _sendToHeyNosh(text);
  }

  Future<void> _sendToHeyNosh(String text) async {
    final query = text.trim();
    if (query.isEmpty || _isSending) {
      return;
    }

    setState(() {
      _isSending = true;
      _errorText = null;
      _replyText = '';
    });

    _appendLog('POST /api/heynosh -> $query');

    try {
      final response = await http.post(
        Uri.parse(_apiEndpoint),
        headers: <String, String>{
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_deviceToken',
        },
        body: jsonEncode(<String, dynamic>{'text': query}),
      );

      if (!mounted) {
        return;
      }

      _appendLog('HTTP ${response.statusCode}');

      if (response.body.isNotEmpty) {
        _appendLog('Raw: ${response.body}');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        String message = 'Request failed';
        try {
          final data = jsonDecode(response.body) as Map<String, dynamic>;
          message = (data['message'] ?? data['error'] ?? message).toString();
        } catch (_) {
          message = response.reasonPhrase ?? message;
        }

        setState(() {
          _errorText = message;
        });
        _appendLog('Error: $message');
        return;
      }

      String reply = '';
      try {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        reply = (data['text'] ?? data['response'] ?? data['message'] ?? '')
            .toString();
      } catch (_) {
        reply = response.body;
      }

      if (reply.isEmpty) {
        reply = 'No response text returned';
      }

      setState(() {
        _replyText = reply;
      });

      _appendLog('Reply: $reply');
    } catch (error) {
      if (!mounted) {
        return;
      }

      final message = error.toString();
      setState(() {
        _errorText = message;
      });
      _appendLog('Network error: $message');
    } finally {
      if (!mounted) {
        return;
      }

      setState(() {
        _isSending = false;
      });
    }
  }

  void _clearAll() {
    debugPrint('Serial monitor cleared');
    setState(() {
      _heardText = '';
      _replyText = '';
      _errorText = null;
      _manualInputController.clear();
      _serialLog.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final canSend =
        !_isSending && _manualInputController.text.trim().isNotEmpty;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: <Color>[
              Color(0xFF08111B),
              Color(0xFF0E1B2E),
              Color(0xFF13253B),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                _HeaderCard(
                  isListening: _isListening,
                  isSending: _isSending,
                  speechReady: _speechReady,
                ),
                const SizedBox(height: 16),
                Expanded(
                  flex: 4,
                  child: _MicCard(
                    heardText: _heardText,
                    replyText: _replyText,
                    errorText: _errorText,
                    controller: _manualInputController,
                    isListening: _isListening,
                    isSending: _isSending,
                    canSend: canSend,
                    onMicTap: _isListening
                        ? _stopListeningAndSend
                        : _startListening,
                    onSendTap: () =>
                        _sendToHeyNosh(_manualInputController.text),
                    onClearTap: _clearAll,
                    onTranscriptChanged: () => setState(() {}),
                  ),
                ),
                const SizedBox(height: 16),
                Expanded(
                  flex: 3,
                  child: _SerialMonitorCard(
                    lines: _serialLog,
                    controller: _logScrollController,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({
    required this.isListening,
    required this.isSending,
    required this.speechReady,
  });

  final bool isListening;
  final bool isSending;
  final bool speechReady;

  @override
  Widget build(BuildContext context) {
    final status = isSending
        ? 'Sending to HeyNosh'
        : isListening
        ? 'Listening to the phone mic'
        : speechReady
        ? 'Ready'
        : 'Mic not ready';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: const Color(0xFF0E1B2E).withOpacity(0.95),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF16A34A).withOpacity(0.18),
            ),
            child: const Icon(Icons.mic, color: Color(0xFF7CFFB0)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const Text(
                  'HeyNosh Voice Link',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  status,
                  style: TextStyle(color: Colors.white.withOpacity(0.68)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          _Badge(
            label: speechReady ? 'Mic ON' : 'Mic OFF',
            active: speechReady,
          ),
        ],
      ),
    );
  }
}

class _MicCard extends StatelessWidget {
  const _MicCard({
    required this.heardText,
    required this.replyText,
    required this.errorText,
    required this.controller,
    required this.isListening,
    required this.isSending,
    required this.canSend,
    required this.onMicTap,
    required this.onSendTap,
    required this.onClearTap,
    required this.onTranscriptChanged,
  });

  final String heardText;
  final String replyText;
  final String? errorText;
  final TextEditingController controller;
  final bool isListening;
  final bool isSending;
  final bool canSend;
  final VoidCallback onMicTap;
  final VoidCallback onSendTap;
  final VoidCallback onClearTap;
  final VoidCallback onTranscriptChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        color: const Color(0xFF0B1524).withOpacity(0.92),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  isListening ? 'Speak now' : 'Tap the mic, talk, then send',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              _Badge(
                label: isSending
                    ? 'Busy'
                    : isListening
                    ? 'Recording'
                    : 'Idle',
                active: isListening || isSending,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Center(
            child: GestureDetector(
              onTap: onMicTap,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: isListening ? 118 : 104,
                height: isListening ? 118 : 104,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: isListening
                        ? const <Color>[Color(0xFF22C55E), Color(0xFF16A34A)]
                        : const <Color>[Color(0xFF13253B), Color(0xFF0B1524)],
                  ),
                  boxShadow: <BoxShadow>[
                    BoxShadow(
                      color: const Color(
                        0xFF16A34A,
                      ).withOpacity(isListening ? 0.45 : 0.2),
                      blurRadius: isListening ? 30 : 16,
                      spreadRadius: isListening ? 2 : 0,
                    ),
                  ],
                ),
                child: Icon(
                  isListening ? Icons.stop_rounded : Icons.mic_rounded,
                  size: 46,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            maxLines: 2,
            style: const TextStyle(color: Colors.white),
            onChanged: (_) => onTranscriptChanged(),
            decoration: InputDecoration(
              labelText: 'Transcript',
              hintText: 'Your spoken text appears here',
              filled: true,
              fillColor: const Color(0xFF13253B),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: <Widget>[
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: canSend ? onSendTap : null,
                  icon: const Icon(Icons.send_rounded),
                  label: Text(isSending ? 'Sending...' : 'Send to HeyNosh'),
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton(
                onPressed: onClearTap,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: BorderSide(color: Colors.white.withOpacity(0.15)),
                ),
                child: const Text('Clear'),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _ResultBlock(
            title: 'Heard',
            value: heardText.isEmpty ? 'Waiting for speech...' : heardText,
          ),
          const SizedBox(height: 10),
          _ResultBlock(
            title: 'HeyNosh reply',
            value: replyText.isEmpty ? 'No reply yet' : replyText,
          ),
          if (errorText != null && errorText!.isNotEmpty) ...<Widget>[
            const SizedBox(height: 10),
            _ResultBlock(title: 'Error', value: errorText!, danger: true),
          ],
        ],
      ),
    );
  }
}

class _SerialMonitorCard extends StatelessWidget {
  const _SerialMonitorCard({required this.lines, required this.controller});

  final List<String> lines;
  final ScrollController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        color: const Color(0xFF050B12).withOpacity(0.95),
        border: Border.all(color: Colors.greenAccent.withOpacity(0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const Row(
            children: <Widget>[
              Icon(Icons.terminal_rounded, color: Color(0xFF86EFAC), size: 20),
              SizedBox(width: 8),
              Text(
                'Serial Monitor',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF09131D),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: lines.isEmpty
                  ? const Center(
                      child: Text(
                        'No logs yet',
                        style: TextStyle(color: Colors.white54),
                      ),
                    )
                  : ListView.builder(
                      controller: controller,
                      itemCount: lines.length,
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            lines[index],
                            style: const TextStyle(
                              color: Color(0xFFB7F7C7),
                              fontSize: 12,
                              height: 1.35,
                              fontFamily: 'monospace',
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ResultBlock extends StatelessWidget {
  const _ResultBlock({
    required this.title,
    required this.value,
    this.danger = false,
  });

  final String title;
  final String value;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: danger ? const Color(0xFF3A1111) : const Color(0xFF13253B),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: danger
              ? const Color(0xFFF87171)
              : Colors.white.withOpacity(0.04),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            title,
            style: TextStyle(
              color: danger ? const Color(0xFFFCA5A5) : Colors.white70,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.active});

  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: active
            ? const Color(0xFF16A34A).withOpacity(0.18)
            : Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: active
              ? const Color(0xFF4ADE80).withOpacity(0.3)
              : Colors.white.withOpacity(0.08),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: active ? const Color(0xFF86EFAC) : Colors.white70,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
