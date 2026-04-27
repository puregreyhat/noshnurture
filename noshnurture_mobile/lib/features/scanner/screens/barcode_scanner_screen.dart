import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../../core/models/inventory_item.dart';
import '../../../core/providers/inventory_provider.dart';
import '../../../core/services/gemini_vision_service.dart';
import '../../../core/utils/expiry_helper.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class BarcodeScannerScreen extends StatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen> {
  bool _processing = false;

  String? _extractBarcodeCode(String rawValue) {
    final raw = rawValue.trim();
    if (raw.isEmpty) return null;

    final matches = RegExp(r'\d{8,14}').allMatches(raw).toList();
    if (matches.isNotEmpty) {
      // Prefer the last hit because product URLs often end with the code.
      return matches.last.group(0);
    }

    if (RegExp(r'^\d{8,14}$').hasMatch(raw)) {
      return raw;
    }

    return null;
  }

  Future<Map<String, dynamic>?> _fetchProduct(String code) async {
    try {
      final url = Uri.parse(
        'https://world.openfoodfacts.org/api/v0/product/$code.json',
      );
      final res = await http.get(url);
      if (res.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(res.body);
        if (data['status'] == 1) {
          return data['product'] as Map<String, dynamic>?;
        }
      }
    } catch (e) {
      debugPrint('OpenFood fetch failed: $e');
    }
    return null;
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_processing) return;

    String? barcode;
    String? scannedPayload;
    for (final bc in capture.barcodes) {
      if (bc.rawValue != null && bc.rawValue!.isNotEmpty) {
        scannedPayload = bc.rawValue;
        barcode = _extractBarcodeCode(scannedPayload!);
        break;
      }
    }

    if (barcode == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Could not read a valid numeric barcode from this scan.',
          ),
        ),
      );
      return;
    }

    setState(() {
      _processing = true;
    });

    final product = await _fetchProduct(barcode);

    final name = product != null
        ? (product['product_name'] ??
              product['generic_name'] ??
              'Scanned product')
        : 'Unknown Product';
    final brand = product != null ? (product['brands'] ?? '') : '';
    final imageUrl = product != null ? product['image_url'] : null;

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            if (imageUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  imageUrl,
                  height: 120,
                  width: 120,
                  fit: BoxFit.cover,
                  errorBuilder: (c, e, s) =>
                      const Icon(Icons.fastfood, size: 80, color: Colors.grey),
                ),
              )
            else
              Container(
                height: 100,
                width: 100,
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.qr_code_scanner,
                  size: 50,
                  color: Colors.green.shade600,
                ),
              ),
            const SizedBox(height: 16),
            Text(
              name.toString(),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            if (brand.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  brand.toString(),
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                ),
              ),
            const SizedBox(height: 8),
            Text(
              'Barcode: $barcode',
              style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
            ),
            if (scannedPayload != null && scannedPayload != barcode)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Scanned payload: $scannedPayload',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                ),
              ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      setState(() => _processing = false);
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      final provider = context.read<InventoryProvider>();
                      final messenger = ScaffoldMessenger.of(context);
                      final sheetNavigator = Navigator.of(ctx);
                      final pageNavigator = Navigator.of(context);

                      final productName = name.toString().trim();
                      final aiShelfLifeDays =
                          await GeminiVisionService.estimateShelfLifeDays(
                            productName,
                          );
                      final computedExpiry = aiShelfLifeDays != null
                          ? DateTime.now().add(Duration(days: aiShelfLifeDays))
                          : ExpiryHelper.getSmartExpiry(productName);

                      final item = InventoryItem(
                        id: DateTime.now().toIso8601String(),
                        name: productName,
                        quantity: 1,
                        unit: 'pcs',
                        expiryDate: computedExpiry,
                        storageType: 'pantry',
                        status: 'fresh',
                      );
                      await provider.addItem(item);
                      if (!mounted) return;

                      final source = aiShelfLifeDays != null
                          ? 'AI estimated shelf life: $aiShelfLifeDays days'
                          : 'Used default shelf-life rules';
                      messenger.showSnackBar(SnackBar(content: Text(source)));
                      sheetNavigator.pop();
                      pageNavigator.pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Add to Inventory',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    ).whenComplete(() {
      if (mounted) setState(() => _processing = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Barcode'),
        backgroundColor: Colors.green.shade700,
      ),
      body: Stack(
        children: [
          MobileScanner(onDetect: _onDetect),
          if (_processing)
            const Align(
              alignment: Alignment.topCenter,
              child: LinearProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
