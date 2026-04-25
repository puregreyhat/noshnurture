import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../../../core/providers/inventory_provider.dart';
import '../../../core/models/inventory_item.dart';
import '../../../core/utils/expiry_helper.dart';
import '../../../core/services/gemini_vision_service.dart';

class BillUploadScreen extends StatefulWidget {
  const BillUploadScreen({super.key});

  @override
  State<BillUploadScreen> createState() => _BillUploadScreenState();
}

class _BillUploadScreenState extends State<BillUploadScreen> {
  final ImagePicker _picker = ImagePicker();
  List<String> _lines = [];
  final List<String> _selected = [];
  bool _loading = false;

  Future<void> _pickAndProcess() async {
    setState(() {
      _loading = true;
      _lines = [];
    });
    final XFile? file = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (file == null) {
      setState(() => _loading = false);
      return;
    }

    final inputImage = InputImage.fromFilePath(file.path);
    final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
    
    final extracted = <String>[];
    try {
      final RecognizedText recognizedText = await textRecognizer.processImage(inputImage);
      
      // Pass the entire raw OCR string to Gemini to cleanly extract only actual groceries
      final String rawBillText = recognizedText.text;
      
      final aiFilteredItems = await GeminiVisionService.extractGroceryItemsFromText(rawBillText);
      
      if (aiFilteredItems.isNotEmpty) {
        extracted.addAll(aiFilteredItems);
      } else {
        extracted.add('No edible grocery items found by AI.');
      }
    } catch (e) {
      extracted.add('Text extraction failed: $e');
    } finally {
      textRecognizer.close();
    }

    setState(() {
      _lines = extracted;
      _selected.clear();
      _loading = false;
    });
  }

  void _addSelected() async {
    final provider = context.read<InventoryProvider>();
    for (final s in _selected) {
      final item = InventoryItem(
        id: DateTime.now().toIso8601String(),
        name: s,
        quantity: 1,
        unit: 'pcs',
        expiryDate: ExpiryHelper.getSmartExpiry(s),
        storageType: 'fridge',
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
        title: const Text('Upload Receipt'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 350),
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0.0, 0.05),
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
    if (_loading) {
      return const Center(
        key: ValueKey('loading'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: Colors.blue),
            SizedBox(height: 16),
            Text('Scanning receipt with AI...'),
          ],
        ),
      );
    }

    if (_lines.isEmpty) {
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
                color: Colors.blue.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.receipt_long_rounded, 
                  size: 80, color: Colors.blue.shade600),
            ),
            const SizedBox(height: 32),
            const Text(
              'Extract Items from Bills',
              style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'serif'),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.blue.shade100),
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
                  _buildInstructionStep('1', 'Tap "Pick Receipt" below'),
                  const SizedBox(height: 12),
                  _buildInstructionStep('2', 'Select a clear photo of your bill'),
                  const SizedBox(height: 12),
                  _buildInstructionStep('3', 'AI will scan and extract the list'),
                  const SizedBox(height: 12),
                  _buildInstructionStep('4', 'Check the items to add to inventory'),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      key: const ValueKey('results'),
      padding: const EdgeInsets.all(16.0),
      itemCount: _lines.length,
      itemBuilder: (ctx, idx) {
        final line = _lines[idx];
        final isSelected = _selected.contains(line);
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          color: isSelected ? Colors.blue.shade50 : Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: isSelected 
                  ? Colors.blue.shade300 
                  : Colors.grey.shade200,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: CheckboxListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            title: Text(line, 
                style: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected ? Colors.blue.shade900 : Colors.black87)),
            controlAffinity: ListTileControlAffinity.leading,
            activeColor: Colors.blue.shade600,
            checkColor: Colors.white,
            value: isSelected,
            onChanged: (v) {
              setState(() {
                if (v == true) {
                  _selected.add(line);
                } else {
                  _selected.remove(line);
                }
              });
            },
          ),
        );
      },
    );
  }

  Widget _buildBottomControls() {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_lines.isEmpty)
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: _loading ? null : _pickAndProcess,
                icon: const Icon(Icons.image_search_rounded),
                label: const Text('Pick Receipt Image',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue.shade600,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          if (_lines.isNotEmpty) ...[
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 54,
                    child: OutlinedButton.icon(
                      onPressed: _loading ? null : _pickAndProcess,
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Rescan'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.blue.shade700,
                        side: BorderSide(color: Colors.blue.shade200),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: SizedBox(
                    height: 54,
                    child: ElevatedButton.icon(
                      onPressed: _selected.isEmpty ? null : _addSelected,
                      icon: const Icon(Icons.add_task_rounded),
                      label: Text('Add ${_selected.length} Items',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue.shade600,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: Colors.grey.shade300,
                        disabledForegroundColor: Colors.grey.shade500,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInstructionStep(String number, String text) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            shape: BoxShape.circle,
          ),
          child: Text(
            number,
            style: TextStyle(
              color: Colors.blue.shade800,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(text, style: const TextStyle(color: Colors.black87)),
        ),
      ],
    );
  }
}
