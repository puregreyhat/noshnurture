'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader, ChevronRight, ChevronLeft } from 'lucide-react';
import { extractProductsFromBill, BillProduct } from '@/lib/gemini-service';
import ConversationalExpiryInputContent from './ConversationalExpiryInput';
import ProductExpiryTableContent from './ProductExpiryTable';
import MultiExpiryScanner from './MultiExpiryScanner';

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
  const [enteredExpiryDates, setEnteredExpiryDates] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState('en-IN'); // Add language state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

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

          setExtractedProducts(products);
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

    onProductsAdded(productsWithExpiry);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full flex flex-col ${
        step === 'scan' ? 'h-full max-w-4xl' : 'max-w-2xl max-h-[600px]'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">📄 Bill/Receipt Upload</h2>
            <p className="text-sm opacity-90">
              {step === 'upload' && 'Step 1/3: Upload Bill'}
              {step === 'preview' && 'Step 1/3: Preview'}
              {step === 'method-select' && `Step 2/3: ${extractedProducts.length} Products Found`}
              {step === 'voice' && 'Step 3/3: Add Expiry Dates (Voice)'}
              {step === 'manual' && 'Step 3/3: Add Expiry Dates (Manual)'}
              {step === 'scan' && 'Step 3/3: Scan Expiry Labels'}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Language Toggle - Show in voice mode */}
            {step === 'voice' && (
              <div className="flex gap-2 bg-white bg-opacity-20 p-1 rounded-lg">
                <button
                  onClick={() => setLanguage('en-IN')}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    language === 'en-IN'
                      ? 'bg-white text-orange-600'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('hi-IN')}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    language === 'hi-IN'
                      ? 'bg-white text-orange-600'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto bg-gray-50 ${
          step === 'scan' ? 'p-4' : 'p-6'
        }`}>
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-gray-700 font-semibold">Choose how to upload:</p>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center cursor-pointer hover:bg-orange-50 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                <p className="text-gray-700 font-semibold">Drag & drop your bill here</p>
                <p className="text-sm text-gray-500 mt-2">or click to browse</p>
                <p className="text-xs text-gray-400 mt-3">Supports: PDF, JPG, PNG</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="p-3 bg-white rounded-lg border">
                  <p className="font-semibold text-gray-700">PDF Best For:</p>
                  <p>Large bills, detailed invoices</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <p className="font-semibold text-gray-700">Image Best For:</p>
                  <p>Mobile photos, receipts</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && selectedFile && (
            <div className="space-y-4">
              <p className="text-gray-700 font-semibold">File Preview:</p>

              {filePreview && typeof filePreview === 'string' && filePreview.startsWith('data:') ? (
                <img src={filePreview} alt="Bill preview" className="w-full max-h-64 object-cover rounded-lg border" />
              ) : (
                <div className="p-8 bg-white rounded-lg border text-center">
                  <p className="text-4xl mb-2">📄</p>
                  <p className="text-gray-700">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 mt-2">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Make sure the bill is clear and all product details are visible for accurate extraction.
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 text-orange-600 p-4">
                  <Loader size={20} className="animate-spin" />
                  <span>Extracting products from bill...</span>
                </div>
              ) : (
                <button
                  onClick={extractProductsFromBillFile}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  Extract Products
                </button>
              )}
            </div>
          )}

          {/* Step 3: Method Select */}
          {step === 'method-select' && (
            <div className="space-y-4">
              <p className="text-gray-700 font-semibold">How would you like to add expiry dates?</p>

              <div className="grid grid-cols-2 gap-4">
                {/* Voice Mode */}
                <button
                  onClick={handleVoiceMode}
                  className="p-6 border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition text-center"
                >
                  <p className="text-3xl mb-2">🎤</p>
                  <p className="font-semibold text-gray-700">Voice Input</p>
                  <p className="text-xs text-gray-500 mt-2">AI asks for each expiry date</p>
                </button>

                {/* Manual Mode */}
                <button
                  onClick={handleManualMode}
                  className="p-6 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition text-center"
                >
                  <p className="text-3xl mb-2">📝</p>
                  <p className="font-semibold text-gray-700">Manual Entry</p>
                  <p className="text-xs text-gray-500 mt-2">Fill a table with date picker</p>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                {/* Scan Labels Mode */}
                <button
                  onClick={() => setStep('scan')}
                  className="p-6 border-2 border-green-300 rounded-lg hover:bg-green-50 transition text-center"
                >
                  <p className="text-3xl mb-2">📷</p>
                  <p className="font-semibold text-gray-700">Scan Labels</p>
                  <p className="text-xs text-gray-500 mt-2">Capture expiry date per product</p>
                </button>
              </div>

              <div className="p-4 bg-gray-100 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-sm font-semibold text-gray-700 mb-3">Products to process ({extractedProducts.length}):</p>
                <ul className="space-y-2">
                  {extractedProducts.map((product, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400">•</span>
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
        <div className="border-t bg-white p-4 rounded-b-lg flex justify-between">
          <button
            onClick={handleBackClick}
            disabled={step === 'upload' || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition font-semibold"
            >
              Change File
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
