import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/models/inventory_item.dart';
import '../../../core/providers/inventory_provider.dart';
import '../../../core/utils/expiry_helper.dart';

class ManualEntryScreen extends StatefulWidget {
  const ManualEntryScreen({super.key});

  @override
  State<ManualEntryScreen> createState() => _ManualEntryScreenState();
}

class _ManualEntryScreenState extends State<ManualEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController(text: '1');
  DateTime _expiry = DateTime.now().add(const Duration(days: 7));
  final String _unit = 'pcs';
  String _storage = 'pantry';

  @override
  void dispose() {
    _nameCtrl.dispose();
    _qtyCtrl.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final provider = context.read<InventoryProvider>();
    final item = InventoryItem(
      id: DateTime.now().toIso8601String(),
      name: _nameCtrl.text.trim(),
      quantity: int.tryParse(_qtyCtrl.text) ?? 1,
      unit: _unit,
      expiryDate: _expiry,
      storageType: _storage,
      status: 'fresh',
    );
    await provider.addItem(item);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manual Entry')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(labelText: 'Product name'),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              TextFormField(
                controller: _qtyCtrl,
                decoration: const InputDecoration(labelText: 'Quantity'),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Text('Expiry: '),
                  TextButton(
                    onPressed: () async {
                      final d = await showDatePicker(
                        context: context,
                        initialDate: _expiry,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(
                          const Duration(days: 3650),
                        ),
                      );
                      if (d != null) setState(() => _expiry = d);
                    },
                    child: Text('${_expiry.toLocal()}'.split(' ')[0]),
                  ),
                  const Spacer(),
                  Tooltip(
                    message: "Auto-predict expiry from name",
                    child: IconButton(
                      icon: const Icon(Icons.auto_awesome, color: Colors.amber),
                      onPressed: () {
                        if (_nameCtrl.text.trim().isNotEmpty) {
                          setState(() {
                            _expiry = ExpiryHelper.getSmartExpiry(_nameCtrl.text.trim());
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                           const SnackBar(content: Text('Expiry date auto-predicted!'), duration: Duration(seconds: 2))
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Text('Storage: '),
                  const SizedBox(width: 8),
                  DropdownButton<String>(
                    value: _storage,
                    items: const [
                      DropdownMenuItem(value: 'pantry', child: Text('Pantry')),
                      DropdownMenuItem(value: 'fridge', child: Text('Fridge')),
                      DropdownMenuItem(
                        value: 'freezer',
                        child: Text('Freezer'),
                      ),
                    ],
                    onChanged: (v) {
                      if (v != null) setState(() => _storage = v);
                    },
                  ),
                ],
              ),
              const Spacer(),
              ElevatedButton(onPressed: _submit, child: const Text('Add Item')),
            ],
          ),
        ),
      ),
    );
  }
}
