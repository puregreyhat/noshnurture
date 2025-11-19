'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  ChefHat, 
  TrendingDown,
  X,
  Check
} from 'lucide-react';
import Loading from '@/components/Loading';

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
  
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  
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
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setAddingItem(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/shopping-list?id=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
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
      }
    } catch (error) {
      console.error('Error adding low-stock item:', error);
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'recipe': return <ChefHat className="w-4 h-4" />;
      case 'low_stock': return <TrendingDown className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'recipe': return 'bg-orange-100 text-orange-700';
      case 'low_stock': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-24 pt-6 px-4">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <ShoppingCart className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Shopping List
            </h1>
          </div>
          <p className="text-gray-600">Manage your grocery shopping efficiently</p>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 justify-center flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
          
          {lowStockItems.length > 0 && (
            <button
              onClick={() => setShowLowStockModal(true)}
              className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition flex items-center gap-2 shadow-lg"
            >
              <TrendingDown className="w-5 h-5" />
              Low Stock ({lowStockItems.length})
            </button>
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
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Your shopping list is empty</h3>
            <p className="text-gray-500">Add items manually or from recipes</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${getSourceColor(item.added_from)}`}>
                      {getSourceIcon(item.added_from)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{item.item_name}</h3>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity} {item.unit}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Added from: {item.added_from.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Mark as purchased / Remove"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
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
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Add Item</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddItem}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g., Tomatoes"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="text"
                          value={newItemQuantity}
                          onChange={(e) => setNewItemQuantity(e.target.value)}
                          placeholder="1"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit
                        </label>
                        <select
                          value={newItemUnit}
                          onChange={(e) => setNewItemUnit(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Low Stock Items</h2>
                  <button
                    onClick={() => setShowLowStockModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-800">{item.product_name}</h3>
                        <p className="text-sm text-gray-500">
                          Only {item.quantity} {item.unit} left
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddLowStockItem(item)}
                        className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
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
