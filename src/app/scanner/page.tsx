'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Keyboard, ArrowLeft, AlertCircle, CheckCircle, X } from 'lucide-react';
import { QRProduct, enhanceProductData, InventoryItem } from '@/lib/productUtils';
import { normalizeIngredientName } from '@/lib/ingredients/normalize';
import { getSettings } from '@/lib/settings';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannedProduct {
  name: string;
  expiryDate: string;
  quantity: number;
  category: string;
}

interface ScannedData {
  orderId: string;
  orderDate: string;
  products: ScannedProduct[];
}

interface EnhancedScannedData {
  orderId: string;
  orderDate: string;
  products: InventoryItem[];
  raw?: unknown;
}

export default function ScannerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [vkImporting, setVkImporting] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; content: React.ReactNode }>>([]);

  function addToast(content: React.ReactNode, timeout = 4000) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((s) => [...s, { id, content }]);
    if (timeout > 0) {
      setTimeout(() => {
        setToasts((s) => s.filter((t) => t.id !== id));
      }, timeout);
    }
  }

  function removeToast(id: number) {
    setToasts((s) => s.filter((t) => t.id !== id));
  }
  const [scanMode, setScanMode] = useState<'none' | 'camera' | 'upload' | 'manual'>('none');
  const [scannedData, setScannedData] = useState<ScannedData | EnhancedScannedData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null); 
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Stop camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        setIsCameraActive(false);
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
  };

  // Process scanned QR data
  const processQRData = async (decodedText: string) => {
    setError('');
    setIsLoading(true);

    try {
      const data = JSON.parse(decodedText);

      // Validate data structure (NoshNurture format)
      if (!data.orderId || !data.orderDate || !data.products) {
        throw new Error('Invalid QR code format');
      }

      // Enhance products with inferred fields
      const enhancedProducts: InventoryItem[] = [];
      for (const p of data.products as QRProduct[]) {
        const item = enhanceProductData(p);
        // compute a canonical ingredient name for AI-like normalization (free)
        try {
          const preferSemantic = typeof window !== 'undefined' ? getSettings().useSemanticNormalization : false;
          const canonical = await normalizeIngredientName(item.name, { prefer: preferSemantic ? 'semantic' : 'fuzzy' });
          item.tags = Array.from(new Set([...(item.tags || []), `canonical:${canonical}`]));
        } catch {
          // ignore normalization errors
        }
        enhancedProducts.push(item);
      }

      const enhancedData: EnhancedScannedData = {
        orderId: data.orderId,
        orderDate: data.orderDate,
        products: enhancedProducts,
        raw: data,
      };

      setScannedData(enhancedData);
      setScanMode('none');
      await stopCamera();
    } catch {
      setError('Invalid NoshNurture QR code data. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start camera scan
  const startCameraScan = async () => {
    setScanMode('camera');
    setError('');
    setIsLoading(true);

    // Wait for the DOM to render the qr-reader div
    setTimeout(async () => {
      try {
        // Check if running on HTTPS (required for camera access)
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          throw new Error('Camera requires HTTPS connection. The site must be accessed via https://');
        }

        // Check if camera is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported on this browser. Please use Chrome, Safari, or Firefox.');
        }

        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

      // Try to get camera devices first
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length === 0) {
        throw new Error('No camera found on this device');
      }

      // Try with environment facing camera first
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            processQRData(decodedText);
          },
          () => {
            // Error callback - ignore decode errors
          }
        );
      } catch (envError) {
        // If environment camera fails, try with any available camera
        console.log('Rear camera failed, trying any available camera...');
        const cameraId = devices[0].id;
        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            processQRData(decodedText);
          },
          () => {
            // Error callback - ignore decode errors
          }
        );
      }

      setIsCameraActive(true);
      setIsLoading(false);
    } catch (err) {
      const error = err as Error;
      let errorMessage = error?.message || 'Unable to access camera';
      
      // Provide helpful error messages based on common issues
      if (errorMessage.includes('Permission') || errorMessage.includes('permission')) {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and refresh the page.';
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('No camera')) {
        errorMessage = 'No camera found. Please connect a camera or use the "Upload Image" option instead.';
      } else if (errorMessage.includes('NotAllowedError')) {
        errorMessage = 'Camera access blocked. Please check your browser settings or try the "Upload Image" option.';
      } else if (errorMessage.includes('NotReadableError')) {
        errorMessage = 'Camera is already in use by another application. Please close other apps using the camera.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setScanMode('none');
      console.error('Camera error:', err);
      }
    }, 100); // Wait 100ms for DOM to render
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsLoading(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-upload');
      const decodedText = await html5QrCode.scanFile(file, true);
      await processQRData(decodedText);
    } catch (err) {
      const error = err as Error;
      setError(`Failed to read QR code from image: ${error?.message || 'Invalid image'}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { days: diff, status: 'expired' };
    if (diff <= 3) return { days: diff, status: 'warning' };
    if (diff <= 7) return { days: diff, status: 'caution' };
    return { days: diff, status: 'fresh' };
  };

  // Get emoji for category
  const getCategoryEmoji = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      vegetables: '🥕',
      fruits: '🍎',
      dairy: '🥛',
      atta: '🌾',
      snacks: '🍪',
      beverages: '🥤',
      default: '📦',
    };
    return categoryMap[category.toLowerCase()] || categoryMap.default;
  };

  // Handle manual input
  const handleManualSubmit = async () => {
    await processQRData(manualInput);
    setManualInput('');
  };

  // Save to inventory (ready for database integration)
  const handleSaveToInventory = async () => {
    if (!scannedData || !user) return;

    // Determine enhanced items
    const itemsToSave: InventoryItem[] = (scannedData as EnhancedScannedData).products
      ? (scannedData as EnhancedScannedData).products
      : (scannedData as ScannedData).products.map((p) => enhanceProductData(p as QRProduct));

    // Prepare DB rows
    const orderId = scannedData.orderId || '';
    const orderDate = scannedData.orderDate || '';
    const userId = user.id;
    const dbRows = itemsToSave.map((item) => ({
      user_id: userId,
      order_id: orderId,
      order_date: orderDate,
      product_name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiry_date: item.expiryDate,
      days_until_expiry: item.daysUntilExpiry,
      status: item.daysUntilExpiry < 0 ? 'expired' : item.daysUntilExpiry <= 3 ? 'warning' : item.daysUntilExpiry <= 7 ? 'caution' : 'fresh',
      storage_type: item.storageType,
      tags: item.tags,
      common_uses: item.commonUses,
      is_consumed: false,
      consumed_date: null,
    }));

    try {
      const supabase = createClient();
      const { error } = await supabase.from('inventory_items').insert(dbRows);
      if (error) {
        alert('❌ Failed to save items: ' + error.message);
        return;
      }
      alert(`✅ Successfully added ${itemsToSave.length} items to your inventory!`);
      window.location.href = '/';
    } catch (err) {
      const error = err as Error;
      alert('❌ Error saving to inventory: ' + (error?.message || String(err)));
    }
  };

  // Import Vkart orders into NoshNurture via server API
  const handleImportVkart = async () => {
    if (!user) {
      addToast('Please sign in to import your Vkart orders.', 4000);
      return;
    }

    setVkImporting(true);
    addToast('Import started — fetching your Vkart orders...', 2500);
    try {
      const res = await fetch('/api/vkart-sync', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        const msg = json?.error || res.statusText || 'Unknown error';
        addToast(<>Import failed: <span className="font-semibold">{String(msg)}</span></>, 6000);
      } else {
        const imported = json.imported ?? 0;
        const updated = json.updated ?? 0;
        const count = json.count ?? 0;

        const content = (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <div>Imported: <strong>{imported}</strong></div>
              <div>Updated: <strong>{updated}</strong></div>
              <div>Orders processed: <strong>{count}</strong></div>
            </div>
            <div>
              <button
                onClick={() => router.push('/inventory')}
                className="ml-2 bg-emerald-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-emerald-700"
              >
                View inventory
              </button>
            </div>
          </div>
        );

        addToast(content, 8000);
      }
    } catch (e) {
      const err = e as Error;
      addToast('Import failed: ' + (err?.message || String(e)), 6000);
    } finally {
      setVkImporting(false);
    }
  };

  // Auto-fetch on mount if the user opted in
  useEffect(() => {
    try {
      const settings = getSettings();
      if (settings.autoFetchVkartOrders) {
        // Defer slightly so UI can render
        setTimeout(() => {
          handleImportVkart();
        }, 500);
      }
    } catch {
      // ignore
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📱 Scan QR Code</h1>
          <p className="text-gray-600">Import your grocery order and track expiry dates</p>
          <div className="mt-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleImportVkart}
                disabled={!user || vkImporting}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                  vkImporting ? 'bg-gray-300 text-gray-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {vkImporting ? 'Importing...' : 'Import my Vkart orders'}
              </button>

              <div className="flex-1" />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative">
          {!scannedData ? (
            <div className="bg-white/70 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl p-8 space-y-6">
              {scanMode === 'none' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Choose scan method:</h2>
                  
                  {/* Scan Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Camera Scan */}
                    <button
                      onClick={startCameraScan}
                      disabled={isLoading}
                      className="flex flex-col items-center gap-3 p-6 bg-emerald-50 border-2 border-emerald-500 rounded-2xl hover:bg-emerald-100 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-12 h-12 text-emerald-600" />
                      <div className="text-center">
                        <h3 className="font-semibold text-emerald-700">Camera Scan</h3>
                        <p className="text-xs text-emerald-600 mt-1">Scan with camera</p>
                      </div>
                    </button>

                    {/* Upload Image */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="flex flex-col items-center gap-3 p-6 bg-emerald-50 border-2 border-emerald-500 rounded-2xl hover:bg-emerald-100 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-12 h-12 text-emerald-600" />
                      <div className="text-center">
                        <h3 className="font-semibold text-emerald-700">Upload Image</h3>
                        <p className="text-xs text-emerald-600 mt-1">Upload QR image</p>
                      </div>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div id="qr-reader-upload" className="hidden"></div>

                    {/* Manual Entry */}
                    <button
                      onClick={() => setScanMode('manual')}
                      className="flex flex-col items-center gap-3 p-6 bg-emerald-50 border-2 border-emerald-500 rounded-2xl hover:bg-emerald-100 hover:shadow-lg transition-all"
                    >
                      <Keyboard className="w-12 h-12 text-emerald-600" />
                      <div className="text-center">
                        <h3 className="font-semibold text-emerald-700">Manual Entry</h3>
                        <p className="text-xs text-emerald-600 mt-1">Paste QR data</p>
                      </div>
                    </button>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 How it works:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Order groceries from any e-commerce site</li>
                      <li>• Scan the QR code on your receipt</li>
                      <li>• All products are automatically added to your inventory</li>
                      <li>• Get AI-powered recipe suggestions for expiring items</li>
                    </ul>
                  </div>

                  {/* Troubleshooting Tip */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800">
                      💡 <strong>Camera not working?</strong> Try using <strong>&quot;Upload Image&quot;</strong> instead - take a photo of the QR code with your phone&apos;s camera app, then upload it here.
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Scan Mode */}
              {scanMode === 'camera' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">📷 Scanning with Camera</h2>
                    <button
                      onClick={async () => {
                        await stopCamera();
                        setScanMode('none');
                        setError('');
                      }}
                      className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-semibold"
                    >
                      <X className="w-4 h-4" />
                      Stop Camera
                    </button>
                  </div>

                  {/* Camera Preview */}
                  <div className="relative">
                    <div id="qr-reader" className="rounded-xl overflow-hidden border-4 border-emerald-500"></div>
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <div className="bg-white px-6 py-3 rounded-lg font-semibold">
                          Starting camera...
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Hold the QR code steady in front of your camera. The scan will happen automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* Manual Entry Mode */}
              {scanMode === 'manual' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Paste QR Code Data:</h2>
                    <button
                      onClick={() => {
                        setScanMode('none');
                        setManualInput('');
                        setError('');
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>

                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder='Paste JSON data here, e.g., {"orderId":"BLK-123","orderDate":"21 Oct 2025","products":[...]}'
                    className="w-full h-48 px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  />

                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim() || isLoading}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? 'Processing...' : 'Parse & Import'}
                  </button>

                  {/* Sample Data Hint */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-600 mb-2">💡 <strong>Tip:</strong> After placing an order, scan the QR code and paste the data here.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          ) : (
            /* Scanned Data Display */
            <div className="space-y-6">
              {/* Success Header */}
              <div className="bg-white/70 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">QR Code Scanned Successfully!</h2>
                    <p className="text-sm text-gray-600">
                      Order ID: <span className="font-semibold">{scannedData.orderId}</span> • Date: {scannedData.orderDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Products List */}
              {scannedData.products && scannedData.products.length > 0 ? (
                <div className="bg-white/70 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl p-6">
                  <h3 className="text-xl font-bold mb-4 pb-3 border-b border-emerald-100 text-gray-900">
                    📦 Products ({scannedData.products.length})
                  </h3>
                  <div className="space-y-3">
                    {scannedData.products.map((product, idx) => {
                      const { days, status } = getDaysUntilExpiry(product.expiryDate);
                      const statusConfig: Record<string, string> = {
                        fresh: 'bg-green-100/50 border-green-400/50 text-green-800',
                        caution: 'bg-yellow-100/50 border-yellow-400/50 text-yellow-800',
                        warning: 'bg-orange-100/50 border-orange-400/50 text-orange-800',
                        expired: 'bg-red-100/50 border-red-400/50 text-red-800',
                      };

                      return (
                        <div
                          key={idx}
                          className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${statusConfig[status]}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <span className="text-3xl">{getCategoryEmoji(product.category)}</span>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg">{product.name}</h4>
                                <p className="text-sm opacity-80 capitalize">
                                  Category: {product.category} • Qty: {product.quantity} {((product as any).unit ?? '')}
                                </p>
                                <p className="text-sm font-semibold mt-1">
                                  Expires: {product.expiryDate}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                                status === 'fresh' ? 'bg-green-200 text-green-900' :
                                status === 'caution' ? 'bg-yellow-200 text-yellow-900' :
                                status === 'warning' ? 'bg-orange-200 text-orange-900' :
                                'bg-red-200 text-red-900'
                              }`}>
                                {status === 'expired' ? '❌' : status === 'warning' ? '⚠️' : status === 'caution' ? '⏰' : '✅'}
                                {days >= 0 ? `${days} days` : 'Expired'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white/70 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl p-6 text-center">
                  <p className="text-lg text-gray-600">No products found in QR data</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handleSaveToInventory}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
                >
                  💾 Save to My Inventory
                </button>
                <button
                  onClick={() => {
                    setScannedData(null);
                    setScanMode('none');
                    setError('');
                  }}
                  className="bg-white text-emerald-600 border-2 border-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-all"
                >
                  🔄 Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast container */}
      <div className="fixed top-6 right-6 flex flex-col gap-3 z-50">
        {toasts.map((t) => (
          <div key={t.id} className="bg-white/95 border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 text-sm text-gray-800">{t.content}</div>
              <button onClick={() => removeToast(t.id)} className="ml-2 text-gray-500 hover:text-gray-700">✕</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
