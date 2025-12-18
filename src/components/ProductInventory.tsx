'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, ChefHat } from 'lucide-react';
import OCRScanner from './OCRScanner';
import VoiceInput from './VoiceInput';
import { getRecipeSuggestions } from '@/lib/gemini-service';

interface Product {
  id: string;
  name: string;
  expiryDate: string;
  addedDate: string;
  batchNumber?: string;
  quantity?: string;
  unit?: string;
  confidence?: number;
  daysUntilExpiry?: number;
}

export default function ProductInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showOCR, setShowOCR] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recipes, setRecipes] = useState<string[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

  // Load products from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('products');
    if (saved) {
      setProducts(JSON.parse(saved));
    }
  }, []);

  // Save products to localStorage
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    const [day, month, year] = expiryDate.split('-').map(Number);
    const expiry = new Date(year, month - 1, day);
    const today = new Date();
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Handle OCR detection
  const handleOCRDetection = (data: any) => {
    const daysUntilExpiry = getDaysUntilExpiry(data.expiryDate);
    const newProduct: Product = {
      id: Date.now().toString(),
      name: data.productName || 'Unknown Product',
      expiryDate: data.expiryDate,
      addedDate: new Date().toISOString().split('T')[0],
      batchNumber: data.batchNumber,
      confidence: data.confidence,
      quantity: data.quantity,
      daysUntilExpiry,
    };
    setProducts([...products, newProduct]);
    setShowOCR(false);
  };

  // Handle voice input
  const handleVoiceDetection = (data: any) => {
    const daysUntilExpiry = getDaysUntilExpiry(data.expiryDate);
    const newProduct: Product = {
      id: Date.now().toString(),
      name: data.productName,
      expiryDate: data.expiryDate,
      addedDate: new Date().toISOString().split('T')[0],
      quantity: data.quantity,
      unit: data.unit,
      confidence: data.confidence,
      daysUntilExpiry,
    };
    setProducts([...products, newProduct]);
    setShowVoice(false);
  };

  // Show recipe suggestions
  const handleShowRecipes = async (product: Product) => {
    setSelectedProduct(product);
    setIsLoadingRecipes(true);
    setShowRecipes(true);

    try {
      const suggestions = await getRecipeSuggestions(
        product.name,
        product.daysUntilExpiry || 0
      );
      setRecipes(suggestions);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setRecipes(['Unable to fetch recipe suggestions']);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // Delete product
  const deleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  // Sort products by expiry date
  const sortedProducts = [...products].sort((a, b) => {
    const aExpiry = getDaysUntilExpiry(a.expiryDate);
    const bExpiry = getDaysUntilExpiry(b.expiryDate);
    return aExpiry - bExpiry;
  });

  // Get expiry status
  const getExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return { label: 'Expired', color: 'red', bgColor: 'bg-red-100' };
    if (daysUntilExpiry === 0) return { label: 'Expires Today', color: 'orange', bgColor: 'bg-orange-100' };
    if (daysUntilExpiry <= 3) return { label: `${daysUntilExpiry} days left`, color: 'orange', bgColor: 'bg-orange-100' };
    if (daysUntilExpiry <= 7) return { label: `${daysUntilExpiry} days left`, color: 'yellow', bgColor: 'bg-yellow-100' };
    return { label: `${daysUntilExpiry} days left`, color: 'green', bgColor: 'bg-green-100' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏠 Smart Expiry Manager</h1>
          <p className="text-gray-600">Track your household inventory & get recipe suggestions</p>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowOCR(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-lg font-medium flex items-center justify-center gap-2 hover:shadow-lg transition hover:from-blue-600 hover:to-blue-700"
          >
            <span className="text-2xl">📸</span>
            Scan Label
          </button>

          <button
            onClick={() => setShowVoice(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-6 rounded-lg font-medium flex items-center justify-center gap-2 hover:shadow-lg transition hover:from-purple-600 hover:to-purple-700"
          >
            <span className="text-2xl">🎤</span>
            Voice Add
          </button>
        </div>

        {/* Manual add button */}
        <button
          onClick={() => {
            const name = prompt('Product name:');
            const date = prompt('Expiry date (DD-MM-YYYY):');
            if (name && date) {
              handleOCRDetection({
                productName: name,
                expiryDate: date,
                confidence: 0.5,
              });
            }
          }}
          className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition mb-8 flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Manual Entry
        </button>

        {/* Stats */}
        {products.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-2xl font-bold text-blue-600">{products.length}</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-2xl font-bold text-orange-600">
                {products.filter((p) => (p.daysUntilExpiry || 0) <= 3).length}
              </p>
              <p className="text-sm text-gray-600">Expiring Soon</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-2xl font-bold text-red-600">
                {products.filter((p) => (p.daysUntilExpiry || 0) < 0).length}
              </p>
              <p className="text-sm text-gray-600">Expired</p>
            </div>
          </div>
        )}

        {/* Products list */}
        <div className="space-y-4">
          {sortedProducts.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-500 text-lg">No products added yet</p>
              <p className="text-gray-400 mt-2">Use 📸 Scan or 🎤 Voice to add items</p>
            </div>
          ) : (
            sortedProducts.map((product) => {
              const status = getExpiryStatus(product.daysUntilExpiry || 0);
              return (
                <div
                  key={product.id}
                  className={`${status.bgColor} border-l-4 ${status.color === 'red'
                      ? 'border-red-600'
                      : status.color === 'orange'
                        ? 'border-orange-600'
                        : status.color === 'yellow'
                          ? 'border-yellow-600'
                          : 'border-green-600'
                    } rounded-lg p-4 shadow-md`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-700">
                        <p>📅 Expires: {product.expiryDate}</p>
                        {product.quantity && product.unit && (
                          <p>📦 Quantity: {product.quantity} {product.unit}</p>
                        )}
                        {product.batchNumber && (
                          <p>🔢 Batch: {product.batchNumber}</p>
                        )}
                        <p className="font-semibold">{status.label}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {(product.daysUntilExpiry || 0) <= 7 && (product.daysUntilExpiry || 0) >= 0 && (
                        <button
                          onClick={() => handleShowRecipes(product)}
                          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                          title="Get recipe suggestions"
                        >
                          <ChefHat size={20} />
                        </button>
                      )}

                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        title="Delete product"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {product.confidence && product.confidence < 0.7 && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2 flex items-start gap-2">
                      <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-800">
                        Low confidence reading. Please verify the expiry date.
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      {showOCR && (
        <OCRScanner
          onExpiryDetected={handleOCRDetection}
          onClose={() => setShowOCR(false)}
        />
      )}

      {showVoice && (
        <VoiceInput
          onProductDetected={handleVoiceDetection}
          onClose={() => setShowVoice(false)}
        />
      )}

      {/* Recipe Modal */}
      {showRecipes && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recipes for {selectedProduct.name}</h2>
              <button
                onClick={() => setShowRecipes(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {isLoadingRecipes ? (
              <p className="text-center text-gray-600">Loading recipes...</p>
            ) : recipes.length === 0 ? (
              <p className="text-center text-gray-600">No recipes found</p>
            ) : (
              <div className="space-y-4">
                {recipes.map((recipe, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200"
                  >
                    <p className="text-sm text-gray-800 whitespace-pre-line">{recipe}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
