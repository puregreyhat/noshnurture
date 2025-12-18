'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ShoppingCart,
  Plus,
  Trash2,
  ChefHat,
  TrendingDown,
  X,
  Check,
  Download
} from 'lucide-react';
import Loading from '@/components/Loading';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface ShoppingListItem {
  id: string;
  item_name: string;
  quantity: string;
  unit: string;
  added_from: 'recipe' | 'low_stock' | 'manual';
  recipe_id?: string;
  created_at: string;
}

interface LowStockItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
}

export default function ShoppingListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: () => { },
    isDangerous: false,
  });

  // Form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [addingItem, setAddingItem] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Fetch shopping list
  const fetchShoppingList = async () => {
    try {
      const response = await fetch('/api/shopping-list');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching shopping list:', error);
      toast.error('Failed to load shopping list');
    } finally {
      setLoading(false);
    }
  };

  // Fetch low-stock items
  const fetchLowStock = async () => {
    try {
      const response = await fetch('/api/shopping-list/low-stock');
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching low-stock items:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchShoppingList();
      fetchLowStock();
    }
  }, [user]);

  // --- Bulk Actions ---

  const handleClearAll = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Shopping List?',
      message: 'This will remove all items from your shopping list. This action cannot be undone.',
      isDangerous: true,
      action: async () => {
        try {
          const res = await fetch('/api/shopping-list?all=true', { method: 'DELETE' });
          if (res.ok) {
            setItems([]);
            setIsSelectionMode(false);
            setSelectedIds(new Set());
            toast.success('Shopping list cleared');
          } else {
            toast.error('Failed to clear list');
          }
        } catch (err) {
          console.error('Failed to clear list', err);
          toast.error('Error clearing list');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const ids = Array.from(selectedIds).join(',');
      const res = await fetch(`/api/shopping-list?ids=${ids}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter(i => !selectedIds.has(i.id)));
        setIsSelectionMode(false);
        setSelectedIds(new Set());
        toast.success('Selected items deleted');
      } else {
        toast.error('Failed to delete selected items');
      }
    } catch (err) {
      console.error('Failed to delete selected', err);
      toast.error('Error deleting items');
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
      if (next.size === 0) setIsSelectionMode(false);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // --- Long Press Logic ---
  const handleTouchStart = (id: string) => {
    const timer = setTimeout(() => {
      setIsSelectionMode(true);
      const next = new Set(selectedIds);
      next.add(id);
      setSelectedIds(next);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Add item to shopping list
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setAddingItem(true);
    try {
      const response = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: newItemName,
          quantity: newItemQuantity,
          unit: newItemUnit,
          added_from: 'manual',
        }),
      });

      if (response.ok) {
        await fetchShoppingList();
        setNewItemName('');
        setNewItemQuantity('1');
        setNewItemUnit('pcs');
        setShowAddModal(false);
        toast.success('Item added');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };

  // Delete item (single)
  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/shopping-list?id=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== itemId));
        toast.success('Item removed');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  // Add low-stock item to shopping list
  const handleAddLowStockItem = async (item: LowStockItem) => {
    try {
      const response = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: item.product_name,
          quantity: '1',
          unit: item.unit,
          added_from: 'low_stock',
        }),
      });

      if (response.ok) {
        await fetchShoppingList();
        setLowStockItems(lowStockItems.filter(ls => ls.id !== item.id));
        toast.success('Added low stock item');
      }
    } catch (error) {
      console.error('Error adding low-stock item:', error);
      toast.error('Failed to add item');
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    if (items.length === 0) return;
    setExporting(true);

    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Shopping List', 14, 22);

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

      // Table
      const tableData = items.map(item => [
        item.item_name,
        `${item.quantity} ${item.unit}`,
        item.added_from.replace('_', ' ') // prettier label
      ]);

      autoTable(doc, {
        head: [['Item', 'Qty', 'Source']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }, // emerald-500
        styles: { fontSize: 10, cellPadding: 3 },
      });

      doc.save('noshnurture-shopping-list.pdf');
      toast.success('PDF exported!');
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  // --- Rendering Helpers ---

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'recipe': return <ChefHat className="w-4 h-4" />;
      case 'low_stock': return <TrendingDown className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'recipe': return 'bg-amber-100 text-amber-800';
      case 'low_stock': return 'bg-orange-100 text-orange-800';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-['Poppins'] pb-24 pt-6 px-4">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        isDangerous={confirmDialog.isDangerous}
      />

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center border border-emerald-200/50">
              <ShoppingCart className="w-6 h-6 text-emerald-700" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-stone-800">
              Shopping List
            </h1>
          </div>
          <p className="text-stone-500 font-light">Manage your grocery shopping efficiently</p>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 justify-center flex-wrap">
          {isSelectionMode ? (
            <button
              onClick={handleBulkDelete}
              className="px-6 py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600 transition flex items-center gap-2 shadow-lg shadow-red-100 animate-in fade-in zoom-in"
            >
              <Trash2 className="w-5 h-5" />
              Delete Selected ({selectedIds.size})
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg shadow-emerald-100"
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button>

              <button
                onClick={handleExportPDF}
                disabled={exporting || items.length === 0}
                className="px-6 py-3 bg-white text-stone-600 border border-stone-200 rounded-2xl font-medium hover:bg-stone-50 hover:border-stone-300 transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                {exporting ? 'Exporting...' : 'Export'}
              </button>

              {items.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-6 py-3 bg-white text-red-500 border border-red-100 rounded-2xl font-medium hover:bg-red-50 hover:border-red-200 transition flex items-center gap-2 shadow-sm"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear All
                </button>
              )}

              {lowStockItems.length > 0 && (
                <button
                  onClick={() => setShowLowStockModal(true)}
                  className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-medium hover:bg-amber-600 transition flex items-center gap-2 shadow-lg shadow-amber-100"
                >
                  <TrendingDown className="w-5 h-5" />
                  Low Stock ({lowStockItems.length})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Shopping List Items */}
      <div className="max-w-4xl mx-auto">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-stone-400" />
            </div>
            <h3 className="text-xl font-serif font-semibold text-stone-600 mb-2">Your shopping list is empty</h3>
            <p className="text-stone-400">Add items manually or from recipes</p>
          </motion.div>
        ) : (
          <div className="grid gap-4 select-none">
            {isSelectionMode && (
              <div className="text-center text-sm text-stone-500 mb-2 animate-in fade-in">
                Tap items to select • Tap & hold to select more
              </div>
            )}
            <AnimatePresence>
              {items.map((item, index) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: isSelected ? 0.98 : 1,
                      backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                      borderColor: isSelected ? '#10B981' : '#F3F4F6'
                    }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    onMouseDown={() => handleTouchStart(item.id)}
                    onMouseUp={handleTouchEnd}
                    onTouchStart={() => handleTouchStart(item.id)}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => {
                      if (isSelectionMode) toggleSelection(item.id);
                    }}
                    className={`rounded-2xl p-5 shadow-sm border transition flex items-center justify-between cursor-pointer relative overflow-hidden ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2' : 'hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-center gap-4 flex-1 pointer-events-none">
                      {isSelectionMode && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'
                          }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      )}

                      <div className={`p-3 rounded-xl ${getSourceColor(item.added_from)}`}>
                        {getSourceIcon(item.added_from)}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-serif font-semibold text-stone-800 text-lg">{item.item_name}</h3>
                        <p className="text-sm text-stone-500">
                          Quantity: {item.quantity} {item.unit}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          Added from: {item.added_from.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    {!isSelectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-3 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition z-10"
                        title="Remove"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#FDFBF7] rounded-3xl shadow-2xl max-w-md w-full p-6 border border-stone-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold text-stone-800">Add Item</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-stone-100 rounded-full transition text-stone-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddItem}>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g., Tomatoes"
                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="text"
                          value={newItemQuantity}
                          onChange={(e) => setNewItemQuantity(e.target.value)}
                          placeholder="1"
                          className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Unit
                        </label>
                        <select
                          value={newItemUnit}
                          onChange={(e) => setNewItemUnit(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        >
                          <option value="pcs">pcs</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">l</option>
                          <option value="ml">ml</option>
                          <option value="dozen">dozen</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={addingItem}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                    >
                      {addingItem ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Add to List
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Low Stock Modal */}
      <AnimatePresence>
        {showLowStockModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLowStockModal(false)}
              className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#FDFBF7] rounded-3xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto border border-stone-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold text-stone-800">Low Stock Items</h2>
                  <button
                    onClick={() => setShowLowStockModal(false)}
                    className="p-2 hover:bg-stone-100 rounded-full transition text-stone-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100"
                    >
                      <div>
                        <h3 className="font-serif font-semibold text-stone-800">{item.product_name}</h3>
                        <p className="text-sm text-stone-500">
                          Only {item.quantity} {item.unit} left
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddLowStockItem(item)}
                        className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition shadow-md shadow-amber-100"
                        title="Add to shopping list"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
