'use client';

import React, { useState } from 'react';
import { Calendar, Check } from 'lucide-react';
import { BillProduct } from '@/lib/gemini-service';

interface ProductExpiryTableContentProps {
  products: BillProduct[];
  onComplete: (dates: Record<string, string>) => void;
  onClose: () => void;
}

interface EditingCell {
  rowIndex: number;
  isOpen: boolean;
}

export default function ProductExpiryTableContent({
  products,
  onComplete,
  onClose,
}: ProductExpiryTableContentProps) {
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<EditingCell>({ rowIndex: -1, isOpen: false });
  const [inputValue, setInputValue] = useState('');

  const handleDateChange = (rowIndex: number, value: string) => {
    const dateKey = rowIndex.toString();
    setExpiryDates((prev) => ({
      ...prev,
      [dateKey]: value,
    }));
  };

  const handleCellClick = (rowIndex: number) => {
    setEditingCell({ rowIndex, isOpen: true });
    setInputValue(expiryDates[rowIndex.toString()] || '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value; // Format: YYYY-MM-DD
    if (date) {
      const [year, month, day] = date.split('-');
      const formattedDate = `${day}-${month}-${year}`;
      handleDateChange(editingCell.rowIndex, formattedDate);
      setEditingCell({ rowIndex: -1, isOpen: false });
    }
  };

  const handleSaveCell = () => {
    if (inputValue.trim()) {
      handleDateChange(editingCell.rowIndex, inputValue);
    }
    setEditingCell({ rowIndex: -1, isOpen: false });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveCell();
    } else if (e.key === 'Escape') {
      setEditingCell({ rowIndex: -1, isOpen: false });
    }
  };

  const handleConfirmAll = () => {
    // Check if all products have expiry dates
    const allFilled = products.every((_, idx) => expiryDates[idx.toString()]);
    if (!allFilled) {
      alert('Please fill in expiry dates for all products');
      return;
    }
    onComplete(expiryDates);
  };

  const filledCount = Object.keys(expiryDates).length;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-700">Fill Expiry Dates</p>
          <p className="text-sm text-gray-600">
            {filledCount} of {products.length} filled
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(filledCount / products.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/4">No.</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Product Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">Qty</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32">Expiry Date</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 w-8">✓</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => {
              const dateKey = idx.toString();
              const hasDate = !!expiryDates[dateKey];
              const isEditing = editingCell.rowIndex === idx && editingCell.isOpen;

              return (
                <tr key={idx} className={`border-b ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  {/* No. */}
                  <td className="px-4 py-3 text-gray-600 font-semibold">{idx + 1}</td>

                  {/* Product Name */}
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    <p className="truncate" title={product.productName}>
                      {product.productName}
                    </p>
                    <p className="text-xs text-gray-500">{product.size}</p>
                  </td>

                  {/* Quantity */}
                  <td className="px-4 py-3 text-gray-600">
                    {product.quantity} {product.unit}
                  </td>

                  {/* Expiry Date Cell */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <input
                          type="date"
                          value={
                            expiryDates[dateKey]
                              ? (() => {
                                  const parts = expiryDates[dateKey].split('-');
                                  return `${parts[2]}-${parts[1]}-${parts[0]}`;
                                })()
                              : ''
                          }
                          onChange={handleDatePickerChange}
                          className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveCell}
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCellClick(idx)}
                        className={`w-full px-3 py-2 rounded border text-left flex items-center gap-2 transition ${
                          hasDate
                            ? 'bg-green-50 border-green-300 text-green-800'
                            : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-blue-50'
                        }`}
                      >
                        <Calendar size={16} />
                        <span>{hasDate ? expiryDates[dateKey] : 'Add date'}</span>
                      </button>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    {hasDate && (
                      <div className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full">
                        <Check size={16} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tips */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Click on any date cell to open a date picker or type a date manually.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border transition"
        >
          Back
        </button>
        <button
          onClick={handleConfirmAll}
          disabled={filledCount < products.length}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Check size={18} />
          Confirm All ({filledCount}/{products.length})
        </button>
      </div>
    </div>
  );
}
