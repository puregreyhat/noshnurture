'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { extractProductsFromBill, BillProduct } from '@/lib/gemini-service';
import ConversationalExpiryInputContent from './ConversationalExpiryInput';
import ProductExpiryTableContent from './ProductExpiryTable';
import MultiExpiryScanner from './MultiExpiryScanner';
import { getDefaultExpiryDate } from '@/lib/default-expiry';

interface BillUploadModalProps {
  onProductsAdded: (products: Array<{
    name: string;
    quantity: number;
    unit: string;
    size: string;
    expiryDate: string;
    price?: string;
  }>) => void;
  onClose: () => void;
}

type Step = 'upload' | 'preview' | 'method-select' | 'voice' | 'manual' | 'scan';

export default function BillUploadModal({
  onProductsAdded,
  onClose,
}: BillUploadModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<BillProduct[]>([]);
  const [removedVegetables, setRemovedVegetables] = useState<BillProduct[]>([]);
  const [vegetablesWithExpiry, setVegetablesWithExpiry] = useState<Array<{
    name: string;
    quantity: number;
    unit: string;
    size: string;
    expiryDate: string;
    price?: string;
  }>>([]);
  const [showVegetableNotice, setShowVegetableNotice] = useState(false);
  const [enteredExpiryDates, setEnteredExpiryDates] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState('en-IN'); // Add language state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  // Check if product is a vegetable/fruit
  const isVegetableOrFruit = (productName: string): boolean => {
    const name = productName.toLowerCase();
    const veggiesAndFruits = [
      'tomato', 'potato', 'onion', 'carrot', 'cucumber', 'capsicum', 'pepper',
      'spinach', 'palak', 'coriander', 'kothimbir', 'dhania', 'mint', 'pudina', 'lettuce',
      'cabbage', 'cauliflower', 'broccoli', 'beetroot', 'radish', 'ginger',
      'garlic', 'chili', 'chilli', 'chillies', 'mirch', 'eggplant', 'brinjal', 'baingan', 'okra',
      'bhindi', 'peas', 'matar', 'beans', 'mushroom', 'corn', 'pumpkin',
      'apple', 'seb', 'banana', 'kela', 'mango', 'aam', 'grapes', 'angoor',
      'orange', 'santra', 'lemon', 'nimbu', 'papaya', 'watermelon',
      'pomegranate', 'anaar', 'strawberry', 'pineapple'
    ];
    return veggiesAndFruits.some(veg => name.includes(veg));
  };


  const handleFileSelect = async (file: File) => {
    setError('');
    setSelectedFile(file);

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setFilePreview(`📄 ${file.name}`);
    }

    setStep('preview');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const extractProductsFromBillFile = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result;
          let base64 = '';

          // Handle both ArrayBuffer (for PDFs) and String (for images)
          if (result instanceof ArrayBuffer) {
            // Convert ArrayBuffer to base64
            const bytes = new Uint8Array(result);
            let binaryString = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binaryString += String.fromCharCode(bytes[i]);
            }
            base64 = btoa(binaryString);
          } else if (typeof result === 'string') {
            // Extract base64 from data URL (format: data:image/png;base64,xxxxx)
            if (result.includes(',')) {
              base64 = result.split(',')[1];
            } else {
              base64 = result;
            }
          } else {
            setError('Failed to read file. Please try another file.');
            setIsLoading(false);
            return;
          }

          // Validate base64
          if (!base64 || base64.trim().length === 0) {
            setError('Failed to convert file to base64. Please try another file.');
            setIsLoading(false);
            return;
          }

          const fileType = selectedFile.type === 'application/pdf' ? 'pdf' : 'image';

          const products = await extractProductsFromBill(base64, fileType);

          if (products.length === 0) {
            setError('Could not extract products from bill. Please try another image or file.');
            setIsLoading(false);
            return;
          }

          // Separate vegetables/fruits from other products
          const vegetables: BillProduct[] = [];
          const nonVegetables: BillProduct[] = [];

          products.forEach(product => {
            if (isVegetableOrFruit(product.productName)) {
              vegetables.push(product);
            } else {
              nonVegetables.push(product);
            }
          });

          // If vegetables found, show notice and auto-add them with default expiry
          if (vegetables.length > 0) {
            setRemovedVegetables(vegetables);
            setShowVegetableNotice(true);

            // Prepare vegetables with default expiry (but don't add yet)
            const vegetableProducts = vegetables.map(veg => {
              const defaultDate = getDefaultExpiryDate(veg.productName, 'refrigerator');
              const formattedDate = `${String(defaultDate.getDate()).padStart(2, '0')}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${defaultDate.getFullYear()}`;
              return {
                name: veg.productName,
                quantity: parseFloat(veg.quantity),
                unit: veg.unit,
                size: veg.size,
                expiryDate: formattedDate,
                price: veg.price,
              };
            });

            // Store vegetables to add later with other products
            setVegetablesWithExpiry(vegetableProducts);

            // Hide notice after animation
            setTimeout(() => {
              setShowVegetableNotice(false);
            }, 3000);
          }

          // Continue with non-vegetables only
          if (nonVegetables.length === 0) {
            // All were vegetables, add them and close
            setTimeout(() => {
              const vegetableProducts = vegetables.map(veg => {
                const defaultDate = getDefaultExpiryDate(veg.productName, 'refrigerator');
                const formattedDate = `${String(defaultDate.getDate()).padStart(2, '0')}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${defaultDate.getFullYear()}`;
                return {
                  name: veg.productName,
                  quantity: parseFloat(veg.quantity),
                  unit: veg.unit,
                  size: veg.size,
                  expiryDate: formattedDate,
                  price: veg.price,
                };
              });
              onProductsAdded(vegetableProducts);
              onClose();
            }, 3000);
            setIsLoading(false);
            return;
          }

          setExtractedProducts(nonVegetables);
          setStep('method-select');
          setIsLoading(false);
        } catch (err) {
          console.error('Error extracting products:', err);
          setError('Error processing file. Please try again.');
          setIsLoading(false);
        }
      };

      if (selectedFile.type === 'application/pdf') {
        reader.readAsArrayBuffer(selectedFile);
      } else {
        reader.readAsDataURL(selectedFile);
      }
    } catch (err) {
      console.error('Error reading bill:', err);
      setError('Error processing file. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVoiceMode = () => {
    setStep('voice');
  };

  const handleManualMode = () => {
    setStep('manual');
  };

  const handleExpiryDatesEntered = (dates: Record<string, string>) => {
    setEnteredExpiryDates(dates);
    // Finalize products with expiry dates
    const productsWithExpiry = extractedProducts.map((product, idx) => ({
      name: product.productName,
      quantity: parseFloat(product.quantity),
      unit: product.unit,
      size: product.size,
      expiryDate: dates[idx.toString()] || '',
      price: product.price,
    }));

    // Combine with vegetables that were auto-processed
    const allProducts = [...vegetablesWithExpiry, ...productsWithExpiry];

    onProductsAdded(allProducts);
    onClose();
  };

  const handleBackClick = () => {
    if (step === 'preview') {
      setStep('upload');
      setSelectedFile(null);
      setFilePreview(null);
    } else if (step === 'method-select') {
      setStep('preview');
    } else if (step === 'voice' || step === 'manual' || step === 'scan') {
      setStep('method-select');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-4">
      <div className={`bg-[#FDFBF7] rounded-none md:rounded-3xl shadow-2xl w-full flex flex-col ${step === 'scan' ? 'h-full max-w-4xl' : 'h-full md:h-auto max-w-2xl md:max-h-[90vh]'
        }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-amber-600 text-white p-5 md:p-6 rounded-t-none md:rounded-t-3xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-white">📄 Bill/Receipt Upload</h2>
            <p className="text-sm opacity-90 mt-1">
              {step === 'upload' && 'Step 1/3: Upload Bill'}
              {step === 'preview' && 'Step 1/3: Preview'}
              {step === 'method-select' && `Step 2/3: ${extractedProducts.length} Products Found`}
              {step === 'voice' && 'Step 3/3: Add Expiry Dates (Voice)'}
              {step === 'manual' && 'Step 3/3: Add Expiry Dates (Manual)'}
              {step === 'scan' && 'Step 3/3: Scan Expiry Labels'}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {/* Language Toggle - Show in voice mode */}
            {step === 'voice' && (
              <div className="flex gap-2 bg-white bg-opacity-20 p-1.5 rounded-xl">
                <button
                  onClick={() => setLanguage('en-IN')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${language === 'en-IN'
                    ? 'bg-white text-emerald-600'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                    }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('hi-IN')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${language === 'hi-IN'
                    ? 'bg-white text-emerald-600'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                    }`}
                >
                  हिंदी
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto bg-stone-50 ${step === 'scan' ? 'p-4 md:p-6' : 'p-6 md:p-8'
          }`}>
          {/* Vegetable Notice */}
          {showVegetableNotice && (
            <div className="mb-6 p-5 bg-emerald-100 border-2 border-emerald-400 rounded-2xl animate-pulse">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🥬</div>
                <div className="flex-1">
                  <p className="font-serif font-bold text-emerald-900 mb-2 text-lg">Vegetables/Fruits Detected!</p>
                  <p className="text-sm text-emerald-800 mb-3">
                    Auto-assigned household expiry dates. Removing from manual entry list...
                  </p>
                  <div className="space-y-1.5">
                    {removedVegetables.map((veg, idx) => (
                      <div key={idx} className="text-sm text-emerald-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>{veg.productName} ({veg.size})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-5 bg-red-100 border-2 border-red-400 text-red-800 rounded-2xl font-medium">
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              <p className="text-stone-800 font-serif font-semibold text-lg">Choose how to upload:</p>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-emerald-300 rounded-2xl p-10 text-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
                <p className="text-stone-800 font-semibold text-lg">Drag & drop your bill here</p>
                <p className="text-base text-stone-500 mt-2">or click to browse</p>
                <p className="text-sm text-stone-400 mt-4">Supports: PDF, JPG, PNG</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-4 text-sm text-stone-600">
                <div className="p-4 bg-white rounded-2xl border-2 border-stone-200">
                  <p className="font-serif font-semibold text-stone-800 mb-1">PDF Best For:</p>
                  <p>Large bills, detailed invoices</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border-2 border-stone-200">
                  <p className="font-serif font-semibold text-stone-800 mb-1">Image Best For:</p>
                  <p>Mobile photos, receipts</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && selectedFile && (
            <div className="space-y-5">
              <p className="text-stone-800 font-serif font-semibold text-lg">File Preview:</p>

              {filePreview && typeof filePreview === 'string' && filePreview.startsWith('data:') ? (
                <img src={filePreview} alt="Bill preview" className="w-full max-h-64 object-cover rounded-2xl border-2 border-stone-200 shadow-lg" />
              ) : (
                <div className="p-10 bg-white rounded-2xl border-2 border-stone-200 text-center">
                  <p className="text-5xl mb-3">📄</p>
                  <p className="text-stone-800 font-medium text-lg">{selectedFile.name}</p>
                  <p className="text-base text-stone-500 mt-2">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              )}

              <div className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                <p className="text-sm text-emerald-800">
                  ℹ️ Make sure the bill is clear and all product details are visible for accurate extraction.
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center gap-3 text-emerald-600 p-5">
                  <Loader size={24} className="animate-spin" />
                  <span className="font-medium">Extracting products from bill...</span>
                </div>
              ) : (
                <button
                  onClick={extractProductsFromBillFile}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  Extract Products
                </button>
              )}
            </div>
          )}

          {/* Step 3: Method Select */}
          {step === 'method-select' && (
            <div className="space-y-5">
              <p className="text-stone-800 font-serif font-semibold text-lg">How would you like to add expiry dates?</p>

              <div className="grid grid-cols-2 gap-4">
                {/* Voice Mode */}
                <button
                  onClick={handleVoiceMode}
                  className="p-6 border-2 border-emerald-300 rounded-2xl hover:bg-emerald-50 hover:border-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                >
                  <p className="text-4xl mb-3">🎤</p>
                  <p className="font-serif font-semibold text-stone-800">Voice Input</p>
                  <p className="text-sm text-stone-500 mt-2">AI asks for each expiry date</p>
                </button>

                {/* Manual Mode */}
                <button
                  onClick={handleManualMode}
                  className="p-6 border-2 border-amber-300 rounded-2xl hover:bg-amber-50 hover:border-amber-400 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                >
                  <p className="text-4xl mb-3">📝</p>
                  <p className="font-serif font-semibold text-stone-800">Manual Entry</p>
                  <p className="text-sm text-stone-500 mt-2">Fill a table with date picker</p>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Scan Labels Mode */}
                <button
                  onClick={() => setStep('scan')}
                  className="p-6 border-2 border-emerald-300 rounded-2xl hover:bg-emerald-50 hover:border-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                >
                  <p className="text-4xl mb-3">📷</p>
                  <p className="font-serif font-semibold text-stone-800">Scan Labels</p>
                  <p className="text-sm text-stone-500 mt-2">Capture expiry date per product</p>
                </button>
              </div>

              <div className="p-5 bg-stone-100 rounded-2xl max-h-48 overflow-y-auto border border-stone-200">
                <p className="text-base font-serif font-semibold text-stone-800 mb-3">Products to process ({extractedProducts.length}):</p>
                <ul className="space-y-2">
                  {extractedProducts.map((product, idx) => (
                    <li key={idx} className="text-sm text-stone-600 flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      <span>{product.productName} ({product.size})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Voice Mode */}
          {step === 'voice' && (
            <ConversationalExpiryInputContent
              products={extractedProducts}
              onComplete={handleExpiryDatesEntered}
              onClose={handleBackClick}
              language={language}
            />
          )}

          {/* Step 5: Manual Mode */}
          {step === 'manual' && (
            <ProductExpiryTableContent
              products={extractedProducts}
              onComplete={handleExpiryDatesEntered}
              onClose={handleBackClick}
            />
          )}

          {/* Step 5: Scan Labels Mode */}
          {step === 'scan' && (
            <MultiExpiryScanner
              products={extractedProducts}
              onComplete={(dates) => {
                // dates: Record<index, expiry>
                handleExpiryDatesEntered(dates);
              }}
              onClose={handleBackClick}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 bg-white p-4 md:p-5 rounded-b-none md:rounded-b-3xl flex justify-between">
          <button
            onClick={handleBackClick}
            disabled={step === 'upload' || isLoading}
            className="flex items-center gap-2 px-5 py-3 text-stone-700 hover:bg-stone-100 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <ChevronLeft size={20} />
            Back
          </button>

          {step === 'preview' && (
            <button
              onClick={() => {
                setStep('upload');
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className="px-5 py-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold"
            >
              Change File
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
