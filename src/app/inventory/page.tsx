"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Search, Filter, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { InventoryItemDB } from "@/lib/supabase-types";
import { useAuth } from "@/contexts/AuthContext";
import { ExpiryAlert } from "@/components/ExpiryAlert";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import EditInventoryDialog from "@/components/EditInventoryDialog";

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItemDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; itemId: string; itemName: string }>({
    isOpen: false,
    itemId: '',
    itemName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<{ isOpen: boolean; item: any | null }>({ isOpen: false, item: null });

  // Fetch inventory from Supabase
  useEffect(() => {
    fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_consumed', false)
        .order('days_until_expiry', { ascending: true });

      if (error) {
        console.error('Error fetching inventory:', error);
      } else {
        setInventoryItems(data || []);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group items by product name and sum quantities
  const groupedInventory = inventoryItems.reduce((acc, item) => {
    const existing = acc.find(i => i.product_name === item.product_name);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as InventoryItemDB[]);

  // Filter items
  const filteredItems = groupedInventory.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "fresh" && item.status === "fresh") ||
      // Treat 'caution' as including 'warning' as well — items expiring soon should appear in caution
      (filterStatus === "caution" && (item.status === "caution" || item.status === "warning")) ||
      // Keep 'warning' as a specific narrower view if user selects it explicitly
      (filterStatus === "warning" && item.status === "warning") ||
      (filterStatus === "expired" && item.status === "expired");
    
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    const item = groupedInventory.find(i => i.id === id);
    setDeleteConfirmation({
      isOpen: true,
      itemId: id,
      itemName: item?.product_name || 'this item',
    });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', deleteConfirmation.itemId);
      
      if (error) {
        console.error('Failed to delete item:', error.message);
      } else {
        fetchInventory(); // Refresh list
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ isOpen: false, itemId: '', itemName: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-12 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <Package className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Complete Inventory</h1>
          </motion.div>
          <p className="text-emerald-100">
            Manage all your food items in one place
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-emerald-300 focus:border-emerald-500 focus:outline-none transition-all bg-white text-gray-800 placeholder-gray-600"
              />
            </div>

            {/* Filter */}
            <div className="relative flex-shrink-0">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-2xl border-2 border-emerald-300 focus:border-emerald-500 focus:outline-none appearance-none bg-white text-gray-800 cursor-pointer transition-all font-medium min-w-[160px] hover:border-emerald-400"
              >
                <option value="all">All Items</option>
                <option value="fresh">Fresh</option>
                <option value="caution">Caution</option>
                <option value="warning">Warning</option>
                <option value="expired">Expired</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{groupedInventory.length}</div>
              <div className="text-xs text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {groupedInventory.filter(i => i.status === 'fresh').length}
              </div>
              <div className="text-xs text-gray-600">Fresh</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {groupedInventory.filter(i => i.status === 'warning' || i.status === 'caution').length}
              </div>
              <div className="text-xs text-gray-600">Expiring Soon</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {groupedInventory.filter(i => i.status === 'expired').length}
              </div>
              <div className="text-xs text-gray-600">Expired</div>
            </div>
          </div>
        </div>

        {/* Inventory Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading inventory...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {searchQuery ? "No items match your search" : "Your inventory is empty"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, idx) => {
              const statusConfig = {
                expired: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-500' },
                warning: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-500' },
                caution: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-500' },
                fresh: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-500' },
              };

              const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.fresh;

              return (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, scale: 0.85, rotateY: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  whileHover={{ scale: 1.05, translateY: -8, rotateZ: 1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: idx * 0.05,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                  className={`relative rounded-2xl border-2 ${config.border} ${config.bg} p-5 shadow-lg hover:shadow-2xl transition-all group`}
                >
                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 w-3 h-3 ${config.badge} rounded-full shadow-md`} />

                  {/* Content */}
                  <h3 className="font-bold text-gray-900 text-lg mb-2 pr-6">
                    {item.product_name}
                  </h3>
                  
                  <div className="space-y-1 mb-4">
                    <p className="text-sm text-gray-700 font-semibold">
                      {item.quantity} {item.unit}
                    </p>
                    <p className={`text-sm font-medium ${config.text}`}>
                      {item.days_until_expiry < 0 
                        ? `Expired ${Math.abs(item.days_until_expiry)} days ago`
                        : item.days_until_expiry === 0
                        ? 'Expires today!'
                        : `${item.days_until_expiry} days left`}
                    </p>
                    <p className="text-xs text-gray-600">
                      Storage: {item.storage_type}
                    </p>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-white/70 rounded-full text-gray-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(item.id!)}
                    className="w-full mt-2 py-2 bg-white/70 hover:bg-red-500 hover:text-white text-gray-700 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  {/* Edit Button */}
                  <button
                    onClick={() => setEditDialog({ isOpen: true, item })}
                    className="w-full mt-2 py-2 bg-white/70 hover:bg-emerald-600 hover:text-white text-gray-700 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100"
                  >
                    Edit
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <EditInventoryDialog
        isOpen={editDialog.isOpen}
        onClose={() => setEditDialog({ isOpen: false, item: null })}
        item={editDialog.item}
        onSaved={() => fetchInventory()}
      />
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteConfirmation.itemName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, itemId: '', itemName: '' })}
      />
    </div>
  );
}
