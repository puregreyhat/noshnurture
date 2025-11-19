"use client";
import React, { useState, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: any; // aggregated InventoryItemDB-like object
  onSaved?: () => void;
};

// Helper to convert DD-MM-YYYY to YYYY-MM-DD for date input
function convertToDateInputFormat(dateStr: string): string {
  if (!dateStr) return '';
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Convert DD-MM-YYYY to YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

// Helper to convert YYYY-MM-DD to DD-MM-YYYY for database
function convertToDbFormat(dateStr: string): string {
  if (!dateStr) return '';
  // If already in DD-MM-YYYY format, return as is
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  // Convert YYYY-MM-DD to DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }
  return dateStr;
}

export function EditInventoryDialog({ isOpen, onClose, item, onSaved }: Props) {
  const [productName, setProductName] = useState(item?.product_name || '');
  const [quantity, setQuantity] = useState<number>(item?.quantity ?? 1);
  const [unit, setUnit] = useState(item?.unit || 'pcs');
  const [category, setCategory] = useState(item?.category || 'other');
  const [expiryDate, setExpiryDate] = useState<string>(convertToDateInputFormat(item?.expiry_date || ''));
  const [storageType, setStorageType] = useState(item?.storage_type || 'refrigerator');
  const [tags, setTags] = useState<string>((item?.tags || []).join(', '));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setProductName(item.product_name || '');
      setQuantity(item.quantity || 1);
      setUnit(item.unit || 'pcs');
      setCategory(item.category || 'other');
      setExpiryDate(convertToDateInputFormat(item.expiry_date || ''));
      setStorageType(item.storage_type || 'refrigerator');
      setTags((item.tags || []).join(', '));
    }
  }, [item]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body = {
        product_name: productName,
        quantity,
        unit,
        category,
        expiry_date: convertToDbFormat(expiryDate),
        storage_type: storageType,
        tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        // indicate we want to replace all existing rows for this product name
        replace_all: true,
      };

      const res = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to update item');
      onSaved && onSaved();
      onClose();
    } catch (e) {
      console.error('Save failed', e);
      alert('Failed to save changes: ' + (e as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-semibold mb-4">Edit Item</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Product name</span>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} className="mt-1 p-2 border rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Quantity</span>
            <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 p-2 border rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Unit</span>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 p-2 border rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Category</span>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 p-2 border rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Expiry date</span>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="mt-1 p-2 border rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Storage type</span>
            <input value={storageType} onChange={(e) => setStorageType(e.target.value)} className="mt-1 p-2 border rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          </label>
        </div>

        <label className="flex flex-col mt-3">
          <span className="text-sm text-gray-600">Tags (comma separated)</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 p-2 border rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
        </label>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">{isSaving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default EditInventoryDialog;
