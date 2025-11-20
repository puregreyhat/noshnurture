"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, CheckCircle, Loader2, SkipForward, RefreshCw } from 'lucide-react';
import { extractExpiryFromImage } from '@/lib/gemini-service';
import { getDefaultExpiryDate } from '@/lib/default-expiry';
import type { BillProduct } from '@/lib/gemini-service';

interface MultiExpiryScannerProps {
  products: BillProduct[];
  onComplete: (dates: Record<string, string>) => void; // key=index -> expiryDate
  onClose: () => void;
}

interface ScanResult {
  expiryDate: string | null;
  confidence: number;
  raw?: string;
}

export default function MultiExpiryScanner({ products, onComplete, onClose }: MultiExpiryScannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<number, ScanResult>>({});
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualDate, setManualDate] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProduct = products[currentIndex];
  const total = products.length;

  // Check if current product is a vegetable/fruit that shouldn't need manual expiry
  const isVegetableOrFruit = (productName: string): boolean => {
    const name = productName.toLowerCase();
    const veggiesAndFruits = [
      'tomato', 'potato', 'onion', 'carrot', 'cucumber', 'capsicum', 'pepper',
      'spinach', 'palak', 'coriander', 'dhania', 'mint', 'pudina', 'lettuce',
      'cabbage', 'cauliflower', 'broccoli', 'beetroot', 'radish', 'ginger',
      'garlic', 'chili', 'chilli', 'chillies', 'mirch', 'eggplant', 'brinjal', 'baingan', 'okra',
      'bhindi', 'peas', 'matar', 'beans', 'mushroom', 'corn', 'pumpkin',
      'apple', 'banana', 'mango', 'grapes', 'orange', 'lemon', 'papaya',
      'watermelon', 'pomegranate', 'strawberry', 'pineapple'
    ];
    return veggiesAndFruits.some(veg => name.includes(veg));
  };

  // Auto-skip vegetables by adding default expiry
  useEffect(() => {
    if (currentProduct && isVegetableOrFruit(currentProduct.productName) && !results[currentIndex]) {
      // Auto-assign default expiry for vegetables
      const defaultDate = getDefaultExpiryDate(currentProduct.productName, 'refrigerator');
      const formattedDate = `${String(defaultDate.getDate()).padStart(2, '0')}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${defaultDate.getFullYear()}`;
      
      setResults(prev => ({ ...prev, [currentIndex]: { expiryDate: formattedDate, confidence: 1.0 } }));
      
      // Auto-move to next after a brief delay
      setTimeout(() => {
        if (currentIndex < total - 1) {
          setCurrentIndex(i => i + 1);
        } else {
          // Completed
          const dates: Record<string, string> = {};
          dates[currentIndex.toString()] = formattedDate;
          Object.keys(results).forEach(k => {
            const idx = parseInt(k, 10);
            const val = results[idx]?.expiryDate;
            if (val) dates[idx.toString()] = val;
          });
          onComplete(dates);
        }
      }, 800);
    }
  }, [currentIndex, currentProduct]);


  const startCamera = async () => {
    try {
      setError(null);
      setIsInitializingCamera(true);
      setIsCameraActive(true);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not supported. Use gallery upload.');
        setIsCameraActive(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setIsCameraActive(false);
      setIsInitializingCamera(false);
      setError('Unable to access camera. Grant permission or use upload.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setIsCameraActive(false);
      setIsInitializingCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const data = canvasRef.current.toDataURL('image/jpeg');
    setPreviewImage(data);
    stopCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result as string;
      setPreviewImage(data);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const processImage = async () => {
    if (!previewImage) return;
    try {
      setIsProcessing(true);
      setError(null);
      const base64 = previewImage.split(',')[1];
      const result = await extractExpiryFromImage(base64);
      const expiry = result.expiryDate || null;
      setResults(prev => ({ ...prev, [currentIndex]: { expiryDate: expiry, confidence: result.confidence, raw: result.rawText } }));
      setManualDate(expiry || '');
    } catch (err) {
      console.error(err);
      setError('Failed to detect expiry. You can enter manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmCurrent = () => {
    // Use manualDate (if user edited) or detected expiry
    setResults(prev => ({ ...prev, [currentIndex]: { expiryDate: manualDate || null, confidence: prev[currentIndex]?.confidence || 0.4 } }));
    setPreviewImage(null);
    setManualDate('');
    setError(null);
    // Move to next
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      // Completed
      const dates: Record<string, string> = {};
      Object.keys(results).forEach(k => {
        const idx = parseInt(k, 10);
        const val = results[idx]?.expiryDate;
        if (val) dates[idx.toString()] = val;
      });
      // Include last manual
      if (manualDate) dates[currentIndex.toString()] = manualDate;
      onComplete(dates);
    }
  };

  const skipCurrent = () => {
    setResults(prev => ({ ...prev, [currentIndex]: { expiryDate: null, confidence: 0 } }));
    setPreviewImage(null);
    setManualDate('');
    setError(null);
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      const dates: Record<string, string> = {};
      Object.keys(results).forEach(k => {
        const idx = parseInt(k, 10);
        const val = results[idx]?.expiryDate;
        if (val) dates[idx.toString()] = val;
      });
      onComplete(dates);
    }
  };

  const retake = () => {
    setPreviewImage(null);
    setManualDate('');
    setError(null);
    startCamera();
  };

  const detectedExpiry = results[currentIndex]?.expiryDate || '';

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Current product header - more prominent */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {currentIndex + 1}
            </div>
            <span className="text-sm font-medium text-gray-600">of {total}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-700 font-medium">
              {Object.keys(results).length} completed
            </span>
            <button onClick={onClose} className="p-1 rounded hover:bg-white text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>
        <p className="text-base font-bold text-gray-900 mb-1">{currentProduct.productName}</p>
        <p className="text-xs text-gray-600">{currentProduct.size}</p>
        <p className="text-xs text-blue-700 mt-2">📷 Capture label with expiry / best before / mfg date</p>
      </div>

      {/* Capture controls */}
      {!previewImage && !isCameraActive && !isInitializingCamera && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => startCamera()}
              className="bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition"
            >
              <Camera size={20} /> Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              📁 Upload
            </button>
          </div>

          {/* Product checklist */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              📋 Products to scan
              <span className="ml-auto text-xs text-green-600">{Object.keys(results).length} of {total} done</span>
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {products.map((p, idx) => {
                const done = results[idx] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg transition ${
                      isCurrent 
                        ? 'bg-green-100 border-2 border-green-400' 
                        : done 
                        ? 'bg-gray-50 border border-gray-200' 
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {done ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full border-2 border-green-600 bg-green-200 animate-pulse" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-green-900' : 'text-gray-700'
                      }`}>
                        {p.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.size}
                      </p>
                      {done && results[idx]?.expiryDate && (
                        <p className="text-xs text-green-700 font-medium mt-1">
                          ✓ {results[idx]?.expiryDate}
                        </p>
                      )}
                      {done && !results[idx]?.expiryDate && (
                        <p className="text-xs text-gray-400 italic mt-1">Skipped</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Camera loading */}
      {isInitializingCamera && !isCameraActive && (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <Loader2 className="mx-auto animate-spin text-yellow-600 mb-2" size={28} />
          <p className="text-sm text-yellow-700">Starting camera...</p>
        </div>
      )}

      {/* Camera view */}
      {isCameraActive && !previewImage && (
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="relative w-full bg-black rounded-lg overflow-hidden flex-1" style={{ minHeight: '320px' }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-4 border-green-400 rounded pointer-events-none" />
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button onClick={capturePhoto} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 text-base">
              📸 Capture
            </button>
            <button onClick={() => { stopCamera(); }} className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewImage && (
        <div className="space-y-3 flex-1 flex flex-col">
          <img src={previewImage} alt="Preview" className="w-full rounded-lg flex-1 object-cover border-2 border-gray-200" style={{ minHeight: '320px', maxHeight: '500px' }} />
          {!results[currentIndex] && (
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={processImage}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Detecting...</> : <>🔍 Detect Expiry</>}
              </button>
              <button onClick={retake} disabled={isProcessing} className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50">
                Retake
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detected / Manual entry */}
      {results[currentIndex] && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">Expiry detected ({Math.round((results[currentIndex].confidence || 0) * 100)}% confidence)</span>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Expiry Date (DD-MM-YYYY)</label>
            <input
              type="text"
              value={manualDate || detectedExpiry}
              onChange={e => setManualDate(e.target.value)}
              placeholder="e.g. 15-04-2026"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900 font-medium bg-white focus:border-green-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Edit if needed or leave blank to skip</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={confirmCurrent}
              className="col-span-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" /> Confirm
            </button>
            <button
              onClick={skipCurrent}
              className="bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 flex items-center justify-center gap-1"
            >
              <SkipForward className="w-4 h-4" /> Skip
            </button>
          </div>
          <button
            onClick={() => { setResults(prev => { const copy = { ...prev }; delete copy[currentIndex]; return copy; }); setPreviewImage(null); setManualDate(''); startCamera(); }}
            className="w-full bg-blue-50 border border-blue-300 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-100 flex items-center justify-center gap-1 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Rescan This Item
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}
