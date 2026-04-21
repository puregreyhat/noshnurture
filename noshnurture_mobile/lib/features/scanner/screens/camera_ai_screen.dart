import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/inventory_provider.dart';
import '../../../core/models/inventory_item.dart';

class CameraAiScreen extends StatefulWidget {
  const CameraAiScreen({super.key});

  @override
  State<CameraAiScreen> createState() => _CameraAiScreenState();
}

class _CameraAiScreenState extends State<CameraAiScreen> {
  final ImagePicker _picker = ImagePicker();
  bool _processing = false;
  int _step = 1; // 1: Front, 2: Expiry, 3: Review

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _expiryController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _expiryController.dispose();
    super.dispose();
  }

  Future<void> _captureFront() async {
    setState(() => _processing = true);
    final XFile? file = await _picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (file == null) {
      setState(() => _processing = false);
      return;
    }

    final inputImage = InputImage.fromFilePath(file.path);
    final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
    
    try {
      final RecognizedText recognizedText = await textRecognizer.processImage(inputImage);
      String bestName = '';
      if (recognizedText.blocks.isNotEmpty) {
        // Sort blocks by bounding box area descending to find the most prominent text
        final blocks = recognizedText.blocks.toList();
        blocks.sort((a, b) {
          final areaA = a.boundingBox.width * a.boundingBox.height;
          final areaB = b.boundingBox.width * b.boundingBox.height;
          return areaB.compareTo(areaA);
        });
        
        // Take the top 3 largest blocks
        final topBlocks = blocks.take(3).toList();
        
        // Find the top-most block in the original blocks list (usually brand)
        final sortedByY = List<TextBlock>.from(blocks)
          ..sort((a, b) => a.boundingBox.top.compareTo(b.boundingBox.top));
        final topMostBlock = sortedByY.isNotEmpty ? sortedByY.first : null;

        // Combine top blocks + top most block uniquely
        final selectedSet = <TextBlock>{...topBlocks};
        if (topMostBlock != null) {
          selectedSet.add(topMostBlock);
        }
        final selectedBlocks = selectedSet.toList();

        // Sort those selected blocks vertically (by their Y coordinate) to maintain reading order
        // If they are roughly on the same horizontal line, sort left-to-right
        selectedBlocks.sort((a, b) {
          final yDiff = a.boundingBox.top - b.boundingBox.top;
          if (yDiff.abs() < 40) { 
            return a.boundingBox.left.compareTo(b.boundingBox.left);
          }
          return yDiff.compareTo(0);
        });
        
        bestName = selectedBlocks.map((b) => b.text.replaceAll('\n', ' ').trim()).join(' ');
        
        // Fix common OCR anomalies like "IDARK" or consecutive spaces
        bestName = bestName.replaceAll('IDARK', 'DARK').replaceAll(RegExp(r'\s+'), ' ').trim();
      }
      _nameController.text = bestName;
    } catch (e) {
      debugPrint('Text extraction failed: $e');
    } finally {
      textRecognizer.close();
    }

    setState(() {
      _processing = false;
      _step = 2; // Move to Expiry step
    });
  }

  Future<void> _captureExpiry() async {
    setState(() => _processing = true);
    final XFile? file = await _picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (file == null) {
      setState(() => _processing = false);
      return;
    }

    final inputImage = InputImage.fromFilePath(file.path);
    final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
    
    try {
      final RecognizedText recognizedText = await textRecognizer.processImage(inputImage);
      String rawText = recognizedText.text;
      _expiryController.text = _extractBestDate(rawText);
    } catch (e) {
      debugPrint('Text extraction failed: $e');
    } finally {
      textRecognizer.close();
    }

    setState(() {
      _processing = false;
      _step = 3; // Move to Review step
    });
  }

  String _extractBestDate(String text) {
    // Regex to match dates like DD/MM/YY, DD/MMM/YY, YYYY-MM-DD
    final exp = RegExp(r'\b(\d{1,4}[/\.-](?:[A-Za-z]{3}|\d{1,2})[/\.-]\d{1,4})\b', caseSensitive: false);
    final matches = exp.allMatches(text);
    
    if (matches.isNotEmpty) {
      // Find the latest chronological date among all matches (Expiry is always > Mfg)
      DateTime? latestDate;
      String bestMatch = '';

      for (final match in matches) {
        final dateStr = match.group(1) ?? '';
        final parsed = _parseDate(dateStr);
        if (parsed != null) {
          if (latestDate == null || parsed.isAfter(latestDate)) {
            latestDate = parsed;
            bestMatch = dateStr;
          }
        }
      }
      if (bestMatch.isNotEmpty) return bestMatch;
      return matches.last.group(1) ?? '';
    }

    // Look for typical keywords if strict format not found
    final lines = text.split('\n');
    for (var l in lines) {
      final lower = l.toLowerCase();
      // Avoid matching generic warning sentences like "use within 2 months or expiry date"
      if (lower.contains('expiry date') && lower.contains('within')) continue;

      if (lower.contains('exp:') || lower.contains('exp.') || lower.contains('use by') || lower.contains('best before') || lower.startsWith('exp ') || lower.startsWith('mfg ')) {
        return l.trim();
      }
    }
    return '';
  }

  DateTime? _parseDate(String dateStr) {
    try {
      // Normalize text months to numbers
      String normalizedDate = dateStr.toUpperCase();
      const monthMap = {'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'};
      
      monthMap.forEach((key, value) {
        normalizedDate = normalizedDate.replaceAll(key, value);
      });

      final clean = normalizedDate.replaceAll(RegExp(r'[^\d/.-]'), '');
      final parts = clean.split(RegExp(r'[/\.-]'));
      if (parts.length >= 3) {
        int d = int.parse(parts[0]);
        int m = int.parse(parts[1]);
        int y = int.parse(parts[2]);
        if (y < 100) y += 2000;
        // Basic safety check for valid month/day ranges
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
           return DateTime(y, m, d);
        }
      }
    } catch (_) {}
    return null;
  }

  void _addItem() async {
    final provider = context.read<InventoryProvider>();
    final parsedExpiry = _parseDate(_expiryController.text);
    
    final item = InventoryItem(
      id: DateTime.now().toIso8601String(),
      name: _nameController.text.isNotEmpty ? _nameController.text : 'Scanned Product',
      quantity: 1,
      unit: 'pcs',
      expiryDate: parsedExpiry ?? DateTime.now().add(const Duration(days: 7)),
      storageType: 'pantry',
      status: 'fresh',
    );
    await provider.addItem(item);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFDFBF7),
      appBar: AppBar(
        title: const Text('AI Product Scan'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_step == 1) _buildStep1()
                    else if (_step == 2) _buildStep2()
                    else if (_step == 3) _buildStep3(),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: _buildBottomButton(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep1() {
    return Column(
      children: [
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: Colors.green.shade50, shape: BoxShape.circle),
          child: Icon(Icons.shopping_bag_outlined, size: 80, color: Colors.green.shade600),
        ),
        const SizedBox(height: 32),
        const Text('Step 1: Front of Product',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'serif')),
        const SizedBox(height: 16),
        const Text(
          'Capture the front label so we can identify the product name and brand.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.black87, fontSize: 16),
        ),
        const SizedBox(height: 32),
        if (_processing) const CircularProgressIndicator(color: Colors.green),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      children: [
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: Colors.orange.shade50, shape: BoxShape.circle),
          child: Icon(Icons.date_range_rounded, size: 80, color: Colors.orange.shade600),
        ),
        const SizedBox(height: 32),
        const Text('Step 2: Expiry Date',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'serif')),
        const SizedBox(height: 16),
        const Text(
          'Capture the back or side where the expiration date is printed. Dates can be anywhere!',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.black87, fontSize: 16),
        ),
        const SizedBox(height: 32),
        if (_processing) const CircularProgressIndicator(color: Colors.orange),
      ],
    );
  }

  Widget _buildStep3() {
    return Column(
      children: [
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: Colors.blue.shade50, shape: BoxShape.circle),
          child: Icon(Icons.fact_check_outlined, size: 80, color: Colors.blue.shade600),
        ),
        const SizedBox(height: 32),
        const Text('Review Details',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'serif')),
        const SizedBox(height: 24),
        TextField(
          controller: _nameController,
          decoration: InputDecoration(
            labelText: 'Product Name',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _expiryController,
          decoration: InputDecoration(
            labelText: 'Expiry Date (Text or DD/MM/YYYY)',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Edit any incorrect text before adding to your inventory.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildBottomButton() {
    if (_processing) return const SizedBox.shrink();

    if (_step == 1) {
      return SizedBox(
        width: double.infinity,
        height: 54,
        child: ElevatedButton.icon(
          onPressed: _captureFront,
          icon: const Icon(Icons.camera_alt_rounded),
          label: const Text('Capture Front', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green.shade600,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
      );
    } else if (_step == 2) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton.icon(
              onPressed: _captureExpiry,
              icon: const Icon(Icons.center_focus_strong_rounded),
              label: const Text('Capture Expiry Date', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange.shade600,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () {
              setState(() => _step = 3); // Skip straight to review
            },
            child: const Text('Skip Expiry Scan', style: TextStyle(color: Colors.grey, fontSize: 16)),
          )
        ],
      );
    } else {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton.icon(
              onPressed: _addItem,
              icon: const Icon(Icons.add_task_rounded),
              label: const Text('Add to Inventory', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade600,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () {
              setState(() {
                _step = 1;
                _nameController.clear();
                _expiryController.clear();
              });
            },
            child: const Text('Restart Scan', style: TextStyle(color: Colors.grey, fontSize: 16)),
          )
        ],
      );
    }
  }
}
