"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Search, Filter, Trash2, Clock } from "lucide-react";
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
  const [longPressedItem, setLongPressedItem] = useState<string | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

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
        .order('expiry_date', { ascending: true });

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

  const calculateDaysUntilExpiry = (expiryDate: string): number => {
    if (!expiryDate) return 0;
    try {
      // Handle both DD/MM/YYYY and DD-MM-YYYY formats
      const separator = expiryDate.includes('/') ? '/' : '-';
      const [day, month, year] = expiryDate.split(separator).map(Number);

      const exp = new Date(year, month - 1, day);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      exp.setHours(0, 0, 0, 0);

      return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error('Error parsing expiry date:', expiryDate, e);
      return 0;
    }
  };

  const getStatusFromDays = (days: number): 'fresh' | 'caution' | 'warning' | 'expired' => {
    if (days < 0) return 'expired';
    if (days <= 3) return 'warning';
    if (days <= 7) return 'caution';
    return 'fresh';
  };

  // Group items by product name and sum quantities
  const groupedInventory = inventoryItems.reduce((acc, item) => {
    const existing = acc.find(i => i.product_name === item.product_name);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      // Calculate dynamic values
      const days = calculateDaysUntilExpiry(item.expiry_date);
      const status = getStatusFromDays(days);

      acc.push({
        ...item,
        days_until_expiry: days,
        status: status
      });
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

  // Long press handlers for mobile
  const handleTouchStart = (itemId: string) => {
    const timer = setTimeout(() => {
      setLongPressedItem(itemId);
    }, 500); // 500ms long press duration
    setPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleTouchMove = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24 font-['Poppins']">
      {/* Header */}
      <div className="bg-[#FDFBF7] py-12 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-100/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <Package className="w-8 h-8 text-emerald-700" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-stone-800">Pantry</h1>
          </motion.div>
          <p className="text-stone-600 font-light max-w-xl">
            Manage your food items, track expiry dates, and reduce waste with your smart kitchen assistant.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 -mt-8 relative z-20">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-stone-100">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all bg-stone-50 text-stone-800 placeholder-stone-400"
              />
            </div>

            {/* Filter */}
            <div className="relative flex-shrink-0">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-12 pr-10 py-3 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none appearance-none bg-stone-50 text-stone-800 cursor-pointer transition-all font-medium min-w-[160px] hover:bg-stone-100"
              >
                <option value="all">All Items</option>
                <option value="fresh">Fresh</option>
                <option value="caution">Caution</option>
                <option value="warning">Warning</option>
                <option value="expired">Expired</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-100">
            <div className="text-center p-3 rounded-xl bg-stone-50">
              <div className="text-2xl font-serif font-bold text-stone-700">{groupedInventory.length}</div>
              <div className="text-xs text-stone-500 uppercase tracking-wider font-medium">Total Items</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-50/50">
              <div className="text-2xl font-serif font-bold text-emerald-700">
                {groupedInventory.filter(i => i.status === 'fresh').length}
              </div>
              <div className="text-xs text-emerald-600 uppercase tracking-wider font-medium">Fresh</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50/50">
              <div className="text-2xl font-serif font-bold text-amber-600">
                {groupedInventory.filter(i => i.status === 'warning' || i.status === 'caution').length}
              </div>
              <div className="text-xs text-amber-600 uppercase tracking-wider font-medium">Expiring Soon</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-50/50">
              <div className="text-2xl font-serif font-bold text-red-600">
                {groupedInventory.filter(i => i.status === 'expired').length}
              </div>
              <div className="text-xs text-red-600 uppercase tracking-wider font-medium">Expired</div>
            </div>
          </div>
        </div>

        {/* Inventory Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white border border-stone-100 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 border-dashed">
            <div className="inline-block p-4 bg-stone-50 rounded-full mb-4">
              <Package className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-stone-500 text-lg font-medium">
              {searchQuery ? "No items match your search" : "Your pantry is empty"}
            </p>
            {!searchQuery && (
              <p className="text-stone-400 text-sm mt-1">Scan a receipt or barcode to get started!</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, idx) => {
              const statusConfig = {
                expired: { bg: 'bg-white', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
                warning: { bg: 'bg-white', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
                caution: { bg: 'bg-white', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
                fresh: { bg: 'bg-white', border: 'border-stone-100', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700' },
              };

              const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.fresh;

              const isLongPressed = longPressedItem === item.id;

              return (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.05,
                    ease: "easeOut"
                  }}
                  className={`relative rounded-2xl border ${config.border} ${config.bg} p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden`}
                  onTouchStart={() => handleTouchStart(item.id!)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  onClick={() => {
                    // Close long press menu if clicking elsewhere
                    if (longPressedItem && longPressedItem !== item.id) {
                      setLongPressedItem(null);
                    }
                  }}
                >
                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${config.badge}`}>
                    {item.status === 'fresh' ? 'Fresh' : item.status}
                  </div>

                  {/* Content */}
                  <h3 className="font-serif font-bold text-stone-800 text-lg mb-2 pr-16 leading-tight">
                    {item.product_name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-stone-50 border border-stone-100 rounded text-xs font-medium text-stone-600">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="px-2 py-0.5 bg-stone-50 border border-stone-100 rounded text-xs font-medium text-stone-600">
                        {item.storage_type}
                      </span>
                    </div>

                    <p className={`text-sm font-medium ${config.text} flex items-center gap-1.5`}>
                      <Clock className="w-3.5 h-3.5" />
                      {item.days_until_expiry < 0
                        ? `Expired ${Math.abs(item.days_until_expiry)} days ago`
                        : item.days_until_expiry === 0
                          ? 'Expires today!'
                          : `${item.days_until_expiry} days left`}
                    </p>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] px-2 py-1 bg-stone-50 border border-stone-100 rounded-md text-stone-500 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons - Show on long press (mobile) or hover (desktop) */}
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isLongPressed ? 1 : 0,
                      height: isLongPressed ? 'auto' : 0,
                      marginTop: isLongPressed ? 8 : 0
                    }}
                    transition={{ duration: 0.2 }}
                    className="md:hidden overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditDialog({ isOpen: true, item });
                          setLongPressedItem(null);
                        }}
                        className="py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id!);
                          setLongPressedItem(null);
                        }}
                        className="py-2 bg-red-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </motion.div>

                  {/* Desktop buttons - Show on hover */}
                  <div className="hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-3 border-t border-stone-50">
                    <button
                      onClick={() => setEditDialog({ isOpen: true, item })}
                      className="flex-1 py-1.5 bg-stone-50 hover:bg-emerald-50 hover:text-emerald-700 text-stone-600 rounded-lg transition-colors text-xs font-medium border border-stone-200 hover:border-emerald-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id!)}
                      className="flex-1 py-1.5 bg-stone-50 hover:bg-red-50 hover:text-red-700 text-stone-600 rounded-lg transition-colors text-xs font-medium border border-stone-200 hover:border-red-200 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
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
