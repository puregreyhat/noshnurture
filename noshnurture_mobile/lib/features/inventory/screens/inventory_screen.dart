import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/inventory_provider.dart';
import '../../../../core/models/inventory_item.dart';
import '../../../../core/widgets/glass.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  _InventoryScreenState createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  String _searchQuery = '';
  String _filterStatus = 'all';

  int _daysUntilExpiry(DateTime expiryDate) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final expiry = DateTime(expiryDate.year, expiryDate.month, expiryDate.day);
    return expiry.difference(today).inDays;
  }

  String _effectiveStatus(InventoryItem item) {
    final daysUntilExpiry = _daysUntilExpiry(item.expiryDate);

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'expiring';

    final rawStatus = item.status.toLowerCase();
    if (rawStatus == 'expired') return 'expired';
    if (rawStatus == 'warning' ||
        rawStatus == 'caution' ||
        rawStatus == 'expiring') {
      return 'expiring';
    }

    return 'fresh';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<InventoryProvider>().fetchInventory();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final inventoryProvider = context.watch<InventoryProvider>();
    final allItems = inventoryProvider.items;

    final filteredItems = allItems.where((item) {
      final matchesSearch = item.name.toLowerCase().contains(
        _searchQuery.toLowerCase(),
      );
      final effectiveStatus = _effectiveStatus(item);
      final matchesFilter =
          _filterStatus == 'all' ||
          effectiveStatus == _filterStatus ||
          ((_filterStatus == 'caution' || _filterStatus == 'warning') &&
              effectiveStatus == 'expiring');
      return matchesSearch && matchesFilter;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: const [
            Icon(Icons.inventory_2_outlined, color: Colors.green, size: 28),
            SizedBox(width: 8),
            Text(
              'Pantry',
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.bold,
                fontSize: 24,
              ),
            ),
          ],
        ),
      ),
      body: GlassBackground(
        child: SafeArea(
          child: inventoryProvider.isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: Colors.green),
                )
              : SingleChildScrollView(
                  child: Column(
                    children: [
                      if (inventoryProvider.error != null)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.error_outline,
                                color: Colors.red,
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  inventoryProvider.error!,
                                  style: const TextStyle(
                                    color: Colors.red,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      _buildSearchAndFilter(),
                      _buildStats(inventoryProvider),
                      const SizedBox(height: 16),
                      filteredItems.isEmpty
                          ? _buildEmptyState()
                          : _buildInventoryGrid(
                              filteredItems,
                              scrollable: false,
                            ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.push('/scanner');
        },
        backgroundColor: Colors.green.shade600,
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showItemOptions(BuildContext context, InventoryItem item) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.edit, color: Colors.blue),
                  title: const Text('Edit Item (Hold in Next.js)'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _showEditItemDialog(context, item);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.delete, color: Colors.red),
                  title: const Text(
                    'Delete Item',
                    style: TextStyle(color: Colors.red),
                  ),
                  onTap: () {
                    Navigator.pop(ctx);
                    context.read<InventoryProvider>().deleteItem(item.id);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showEditItemDialog(BuildContext context, InventoryItem item) {
    final nameCtrl = TextEditingController(text: item.name);
    final qtyCtrl = TextEditingController(text: item.quantity.toString());
    final unitCtrl = TextEditingController(text: item.unit);
    final storageCtrl = TextEditingController(text: item.storageType);
    DateTime selectedDate = item.expiryDate;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text(
                'Edit Item',
                style: TextStyle(
                  fontFamily: 'serif',
                  fontWeight: FontWeight.bold,
                ),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Product name',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: qtyCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Quantity',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: unitCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Unit',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ListTile(
                      shape: RoundedRectangleBorder(
                        side: BorderSide(color: Colors.grey.shade400),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      title: Text(
                        'Expiry: ${selectedDate.toLocal().toString().split(' ')[0]}',
                      ),
                      trailing: const Icon(Icons.calendar_today),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: selectedDate,
                          firstDate: DateTime(2020),
                          lastDate: DateTime(2030),
                        );
                        if (picked != null) {
                          setState(() => selectedDate = picked);
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: storageCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Storage type',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                  ),
                  onPressed: () {
                    final updatedItem = InventoryItem(
                      id: item.id,
                      name: nameCtrl.text,
                      quantity: int.tryParse(qtyCtrl.text) ?? item.quantity,
                      unit: unitCtrl.text,
                      expiryDate: selectedDate,
                      storageType: storageCtrl.text,
                      status: item.status,
                    );
                    context.read<InventoryProvider>().updateItem(updatedItem);
                    Navigator.pop(ctx);
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildSearchAndFilter() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: GlassCard(
        padding: const EdgeInsets.all(16),
        borderRadius: BorderRadius.circular(24),
        child: Column(
          children: [
            TextField(
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                hintText: 'Search products...',
                filled: true,
                fillColor: Colors.grey.shade50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onChanged: (val) => setState(() => _searchQuery = val),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  value: _filterStatus,
                  icon: const Icon(Icons.filter_list),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('All Items')),
                    DropdownMenuItem(value: 'fresh', child: Text('Fresh')),
                    DropdownMenuItem(value: 'caution', child: Text('Caution')),
                    DropdownMenuItem(value: 'warning', child: Text('Warning')),
                    DropdownMenuItem(value: 'expired', child: Text('Expired')),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _filterStatus = val);
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStats(InventoryProvider provider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _StatCard(
            title: 'Total',
            value: provider.totalItems.toString(),
            color: Colors.grey,
          ),
          _StatCard(
            title: 'Fresh',
            value: provider.freshItems.toString(),
            color: Colors.green,
          ),
          _StatCard(
            title: 'Expiring',
            value: provider.expiringSoon.toString(),
            color: Colors.orange,
          ),
          _StatCard(
            title: 'Expired',
            value: provider.expiredItems.toString(),
            color: Colors.red,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return SizedBox(
      height: 260,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.kitchen, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No items match your search',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInventoryGrid(
    List<InventoryItem> items, {
    bool scrollable = true,
  }) {
    return GridView.builder(
      shrinkWrap: !scrollable,
      physics: scrollable
          ? const AlwaysScrollableScrollPhysics()
          : const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.35,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final effectiveStatus = _effectiveStatus(item);
        final daysUntilExpiry = _daysUntilExpiry(item.expiryDate);

        Color badgeBg = Colors.green.withOpacity(0.1);
        Color textCol = Colors.green.shade700;

        if (effectiveStatus == 'expired') {
          badgeBg = Colors.red.withOpacity(0.1);
          textCol = Colors.red.shade700;
        } else if (effectiveStatus == 'expiring') {
          badgeBg = Colors.orange.withOpacity(0.1);
          textCol = Colors.orange.shade700;
        }

        return InkWell(
          onLongPress: () => _showItemOptions(context, item),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: badgeBg, width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        item.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: Colors.black87,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: badgeBg,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        effectiveStatus.toUpperCase(),
                        style: TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          color: textCol,
                        ),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  '${item.quantity} ${item.unit}    ${item.storageType}',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 14, color: textCol),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        daysUntilExpiry < 0
                            ? 'Expired ${daysUntilExpiry.abs()} days ago'
                            : (daysUntilExpiry == 0
                                  ? 'Expires today'
                                  : '$daysUntilExpiry days left'),
                        style: TextStyle(
                          color: textCol,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final MaterialColor color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: (MediaQuery.of(context).size.width - 32 - 36) / 4,
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: color.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color.shade700,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: color.shade700,
            ),
          ),
        ],
      ),
    );
  }
}
