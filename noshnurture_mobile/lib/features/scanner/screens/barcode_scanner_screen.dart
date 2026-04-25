import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../../core/models/inventory_item.dart';
import '../../../core/providers/inventory_provider.dart';
import '../../../core/utils/expiry_helper.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class BarcodeScannerScreen extends StatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen> {
  String? _scanned;
  bool _processing = false;

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

    // Use a Set to grab the first unique valid barcode
    String? barcode;
    for (final bc in capture.barcodes) {
      if (bc.rawValue != null && bc.rawValue!.isNotEmpty) {
        barcode = bc.rawValue;
        break;
      }
    }
    
    if (barcode == null) return;

    setState(() {
      _processing = true;
      _scanned = barcode;
    });

    final product = await _fetchProduct(barcode);

    final name = product != null
        ? (product['product_name'] ?? product['generic_name'] ?? 'Scanned product')
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
                  errorBuilder: (c, e, s) => const Icon(Icons.fastfood, size: 80, color: Colors.grey),
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
                child: Icon(Icons.qr_code_scanner, size: 50, color: Colors.green.shade600),
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      final provider = context.read<InventoryProvider>();
                      final item = InventoryItem(
                        id: DateTime.now().toIso8601String(),
                        name: name.toString(),
                        quantity: 1,
                        unit: 'pcs',
                        expiryDate: ExpiryHelper.getSmartExpiry(name.toString()),
                        storageType: 'pantry',
                        status: 'fresh',
                      );
                      await provider.addItem(item);
                      if (mounted) Navigator.of(ctx).pop();
                      if (mounted) Navigator.of(context).pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Add to Inventory', style: TextStyle(fontWeight: FontWeight.bold)),
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
