'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, Upload, Keyboard, ArrowLeft, AlertCircle, CheckCircle, X, Mic } from 'lucide-react';
import { QRProduct, enhanceProductData, InventoryItem } from '@/lib/productUtils';
import { normalizeIngredientName } from '@/lib/ingredients/normalize';
import { getSettings } from '@/lib/settings';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Html5Qrcode } from 'html5-qrcode';
import OCRScanner from '@/components/OCRScanner';
import VoiceInput from '@/components/VoiceInput';
import ConversationalInventoryInput from '@/components/ConversationalInventoryInput';
import BillUploadModal from '@/components/BillUploadModal';

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
  const { toast } = useToast();

  // Helper: format a date string into local YYYY-MM-DD (fall back to original string if invalid)
  const formatLocalISO = (dateStr: string | undefined | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [vkImporting, setVkImporting] = useState(false);
  const [showOCRScanner, setShowOCRScanner] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showConversationalInput, setShowConversationalInput] = useState(false);
  const [showBillUpload, setShowBillUpload] = useState(false);
  const [scanMode, setScanMode] = useState<'none' | 'camera' | 'upload' | 'manual' | 'form'>('none');
  const [scannedData, setScannedData] = useState<ScannedData | EnhancedScannedData | null>(null);
  const [dataSource, setDataSource] = useState<'qr' | 'ocr' | 'voice' | 'batch' | 'bill' | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    unit: 'kg',
    expiryDate: '',
    category: 'vegetables',
    storageType: 'refrigerator',
  });
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const autoFetchDoneRef = useRef(false);

  // Helper function to parse expiry date properly
  const parseExpiryDate = (dateString: string): string => {
    if (!dateString) return '';

    // If already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }

    // Try to parse as Date
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      const day = String(parsedDate.getDate()).padStart(2, '0');
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const year = parsedDate.getFullYear();
      return `${day}-${month}-${year}`;
    }

    return dateString;
  };

  // Helper function to calculate days until expiry with proper date handling
  const calculateDaysUntilExpiry = (expiryDateStr: string): number => {
    try {
      // Handle both DD/MM/YYYY and DD-MM-YYYY formats
      const separator = expiryDateStr.includes('/') ? '/' : '-';
      const [day, month, year] = expiryDateStr.split(separator).map(Number);

      const expiry = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);

      const diff = expiry.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error('Error parsing expiry date:', expiryDateStr, e);
      return 999; // Default to future if parsing fails
    }
  };

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

  // Handle OCR detection
  const handleOCRDetection = (data: any) => {
    try {
      const expiryDate = parseExpiryDate(data.expiryDate);
      const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);

      // Parse quantity string (e.g. "500 g")
      let quantity = 1;
      let unit = 'item';

      if (data.quantity) {
        const match = data.quantity.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
        if (match) {
          quantity = parseFloat(match[1]);
          unit = match[2];
        } else {
          // Try to just get number
          const num = parseFloat(data.quantity);
          if (!isNaN(num)) quantity = num;
          // Unit stays item or we could try to infer
        }
      }

      const newProduct: InventoryItem = {
        name: data.productName || 'Unknown Product',
        quantity: quantity,
        unit: unit,
        expiryDate: expiryDate,
        category: 'groceries',
        storageType: 'refrigerator',
        tags: data.batchNumber ? [`batch:${data.batchNumber}`] : [],
        daysUntilExpiry,
        commonUses: [],
      };

      const enhancedData: EnhancedScannedData = {
        orderId: `ocr-${Date.now()}`,
        orderDate: new Date().toISOString().split('T')[0],
        products: [newProduct],
      };

      setScannedData(enhancedData);
      setDataSource('ocr');
      setShowOCRScanner(false);
      toast.success(
        <div className="flex items-center gap-2">
          <span>Product added: {data.productName}</span>
        </div>
      );
    } catch (err) {
      toast.error(
        <div className="flex items-center gap-2">
          <span>Error adding product</span>
        </div>
      );
    }
  };

  // Handle voice input detection
  const handleVoiceDetection = (data: any) => {
    try {
      // Calculate days until expiry
      const expiryDate = parseExpiryDate(data.expiryDate);
      const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);

      const newProduct: InventoryItem = {
        name: data.productName,
        quantity: data.quantity ? parseInt(data.quantity) : 1,
        unit: data.unit || 'item',
        expiryDate: expiryDate,
        category: 'groceries',
        storageType: 'refrigerator',
        tags: [],
        daysUntilExpiry,
        commonUses: [],
      };

      const enhancedData: EnhancedScannedData = {
        orderId: `voice-${Date.now()}`,
        orderDate: new Date().toISOString().split('T')[0],
        products: [newProduct],
      };

      setScannedData(enhancedData);
      setDataSource('voice');
      setShowVoiceInput(false);
      toast.success(
        <div className="flex items-center gap-2">
          <span>Product added: {data.productName}</span>
        </div>
      );
    } catch (err) {
      toast.error(
        <div className="flex items-center gap-2">
          <span>Error adding product</span>
        </div>
      );
    }
  };

  // Handle multiple products from conversational input
  const handleConversationalProductsAdded = async (
    products: Array<{
      name: string;
      quantity: number;
      unit: string;
      expiryDate: string;
    }>
  ) => {
    try {
      const inventoryItems: InventoryItem[] = products.map((product) => {
        const expiryDate = parseExpiryDate(product.expiryDate);
        const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);

        return {
          id: `conv-${Date.now()}-${Math.random()}`,
          name: product.name,
          quantity: product.quantity,
          unit: product.unit,
          expiryDate: expiryDate,
          category: 'groceries',
          storageType: 'refrigerator',
          tags: [],
          daysUntilExpiry,
          commonUses: [],
        };
      });

      const enhancedData: EnhancedScannedData = {
        orderId: `conv-${Date.now()}`,
        orderDate: new Date().toISOString().split('T')[0],
        products: inventoryItems,
      };

      setScannedData(enhancedData);
      setDataSource('batch');
      setShowConversationalInput(false);
      toast.success(
        <div className="flex items-center gap-2">
          <span>✓ Added {products.length} products successfully!</span>
        </div>
      );
    } catch (err) {
      toast.error(
        <div className="flex items-center gap-2">
          <span>Error adding products from conversation</span>
        </div>
      );
    }
  };

  // Handle bill upload products
  const handleBillProductsAdded = async (
    products: Array<{
      name: string;
      quantity: number;
      unit: string;
      size: string;
      expiryDate: string;
      price?: string;
    }>
  ) => {
    try {
      const inventoryItems: InventoryItem[] = products.map((product) => {
        const expiryDate = parseExpiryDate(product.expiryDate);
        const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);

        return {
          id: `bill-${Date.now()}-${Math.random()}`,
          name: product.name,
          quantity: product.quantity,
          unit: product.unit,
          expiryDate: expiryDate,
          category: 'groceries',
          storageType: 'refrigerator',
          tags: [],
          daysUntilExpiry,
          commonUses: [],
        };
      });

      const enhancedData: EnhancedScannedData = {
        orderId: `bill-${Date.now()}`,
        orderDate: new Date().toISOString().split('T')[0],
        products: inventoryItems,
      };

      setScannedData(enhancedData);
      setDataSource('bill');
      setShowBillUpload(false);
      toast.success(
        <div className="flex items-center gap-2">
          <span>✓ Added {products.length} products from bill!</span>
        </div>
      );
    } catch (err) {
      toast.error(
        <div className="flex items-center gap-2">
          <span>Error adding products from bill</span>
        </div>
      );
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
        // Parse and format expiry date properly
        item.expiryDate = parseExpiryDate(item.expiryDate);
        item.daysUntilExpiry = calculateDaysUntilExpiry(item.expiryDate);
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
      setDataSource('qr');
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
  // Always show a neutral clipboard emoji for products — avoids mismatches when categories are noisy
  const getCategoryEmoji = (_category: string): string => {
    return '�';
  };

  // Handle manual input
  const handleManualSubmit = async () => {
    await processQRData(manualInput);
    setManualInput('');
  };

  // Handle form submission for local shop items
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productName || !formData.quantity || !formData.expiryDate) {
      setError('Please fill in all required fields');
      return;
    }

    // Create a mock QR data structure from form input.
    // NOTE: include `expiryDate` (ISO yyyy-mm-dd) so the rest of the code can parse and save it correctly.
    // Use local date (YYYY-MM-DD) so the displayed Order Date matches the user's timezone
    const todayLocal = new Date();
    const localDateStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;

    const mockQRData = {
      orderId: `LOCAL-${Date.now()}`,
      orderDate: localDateStr,
      products: [
        {
          name: formData.productName,
          // date input provides an ISO date string (YYYY-MM-DD) which downstream code expects as `expiryDate`
          expiryDate: formData.expiryDate,
          quantity: parseInt(formData.quantity),
          unit: formData.unit,
          category: formData.category,
          storage: formData.storageType,
          barcode: `LOCAL-${formData.productName.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
          // If the user selected a measurable unit (kg,g,L,ml) include a per-unit measure so
          // enhanceProductData can compute total amount and preserve unit correctly.
          ...(['kg', 'g', 'L', 'ml'].includes(formData.unit) ? { measure: { value: 1, unit: formData.unit } } : {}),
        },
      ],
    };

    processQRData(JSON.stringify(mockQRData));
    setFormData({
      productName: '',
      quantity: '',
      unit: 'kg',
      expiryDate: '',
      category: 'vegetables',
      storageType: 'refrigerator',
    });
  };

  // Save to inventory (ready for database integration)
  const handleSaveToInventory = async () => {
    if (!scannedData || !user) return;

    // Determine enhanced items
    const itemsToSave: InventoryItem[] = (scannedData as EnhancedScannedData).products
      ? (scannedData as EnhancedScannedData).products
      : (scannedData as ScannedData).products.map((p) => enhanceProductData(p as QRProduct));

    // Filter out basic always-present items (water, etc.) before saving
    const { shouldIgnoreProduct } = await import('@/lib/ignoreList');
    const filteredItems = itemsToSave.filter(item => !shouldIgnoreProduct(item.name, item.tags));

    // Prepare DB rows
    const orderId = scannedData.orderId || '';
    const orderDate = scannedData.orderDate || '';
    const userId = user.id;
    const dbRows = filteredItems.map((item) => {
      // Ensure expiry_date is always provided (DB schema requires NOT NULL)
      const fallbackExpiry = orderDate || (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();
      const expiryDate = item.expiryDate || fallbackExpiry;

      // Compute days until expiry robustly
      let days = Number(item.daysUntilExpiry);
      if (!Number.isFinite(days)) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        days = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      const status = days < 0 ? 'expired' : days <= 3 ? 'warning' : days <= 7 ? 'caution' : 'fresh';

      return {
        user_id: userId,
        order_id: orderId,
        order_date: orderDate,
        product_name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        expiry_date: expiryDate,
        days_until_expiry: days,
        status,
        storage_type: item.storageType,
        tags: item.tags,
        common_uses: item.commonUses,
        is_consumed: false,
        consumed_date: null,
      };
    });

    try {
      const supabase = createClient();
      const { error } = await supabase.from('inventory_items').insert(dbRows);
      if (error) {
        toast.error('❌ Failed to save items: ' + error.message);
        return;
      }
      const savedCount = dbRows.length;
      const skippedCount = itemsToSave.length - savedCount;
      toast.success(`✅ Successfully added ${savedCount} items to your inventory${skippedCount > 0 ? ` (skipped ${skippedCount} basic items)` : ''}!`);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      const error = err as Error;
      toast.error('❌ Error saving to inventory: ' + (error?.message || String(err)));
    }
  };

  // Import Vkart orders into NoshNurture via server API
  const handleImportVkart = async () => {
    if (!user) {
      toast.error('Please sign in to import your Vkart orders.');
      return;
    }

    setVkImporting(true);
    toast.info('Import started — fetching your Vkart orders...');
    try {
      const res = await fetch('/api/vkart-sync', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        const msg = json?.error || res.statusText || 'Unknown error';
        toast.error(<>Import failed: <span className="font-semibold">{String(msg)}</span></>);
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

        toast.success(content);
      }
    } catch (e) {
      const err = e as Error;
      toast.error('Import failed: ' + (err?.message || String(e)));
    } finally {
      setVkImporting(false);
    }
  };

  // Auto-fetch on mount if the user opted in (only once)
  useEffect(() => {
    if (autoFetchDoneRef.current || !user) return;

    try {
      const settings = getSettings();
      if (settings.autoFetchVkartOrders) {
        autoFetchDoneRef.current = true;
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
    <div className="min-h-screen bg-[#FDFBF7] relative overflow-hidden font-['Poppins']">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-10 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -25, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-8 left-1/2 w-72 h-72 bg-stone-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
      </div>

      <motion.div
        className="relative z-10 container mx-auto px-4 py-8 max-w-4xl pb-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </motion.div>
          <motion.h1
            className="text-4xl font-serif font-bold text-stone-800 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Add Products
          </motion.h1>
          <motion.p
            className="text-stone-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Import your grocery order and track expiry dates
          </motion.p>
        </div>

        {/* Main content */}
        <div>
          {!scannedData ? (
            <div
              className="bg-white/70 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl p-8 space-y-6"
            >
              {scanMode === 'none' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-serif font-bold text-stone-800 text-center mb-8">Choose scan method</h2>

                  {/* Scan Options - Modern Vertical Cards */}
                  <div className="space-y-4 max-w-2xl mx-auto">
                    {/* Scan Product Label (OCR) */}
                    <motion.button
                      onClick={() => {
                        setTimeout(() => setShowOCRScanner(true), 300);
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      className="group w-full relative overflow-hidden bg-gradient-to-r from-white to-stone-50 border-2 border-stone-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-6">
                        <motion.div
                          whileTap={{ scale: 1.5, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shadow-inner group-hover:shadow-md transition-shadow"
                        >
                          <span className="text-3xl">📸</span>
                        </motion.div>
                        <div className="flex-1 text-left">
                          <h3 className="text-xl font-serif font-bold text-stone-800 mb-1">Scan Label</h3>
                          <p className="text-sm text-stone-500">Capture product labels with your camera</p>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </motion.button>

                    {/* Voice Add */}
                    <motion.button
                      onClick={() => {
                        setTimeout(() => setShowVoiceInput(true), 300);
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      className="group w-full relative overflow-hidden bg-gradient-to-r from-white to-stone-50 border-2 border-stone-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-6">
                        <motion.div
                          whileTap={{ scale: 1.5, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shadow-inner group-hover:shadow-md transition-shadow"
                        >
                          <Mic className="w-8 h-8 text-amber-700" />
                        </motion.div>
                        <div className="flex-1 text-left">
                          <h3 className="text-xl font-serif font-bold text-stone-800 mb-1">Voice Add</h3>
                          <p className="text-sm text-stone-500">Simply speak to add items naturally</p>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </motion.button>

                    {/* Conversational Multi-Product Input */}
                    <motion.button
                      onClick={() => {
                        setTimeout(() => setShowConversationalInput(true), 300);
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      className="group w-full relative overflow-hidden bg-gradient-to-r from-white to-stone-50 border-2 border-stone-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-6">
                        <motion.div
                          whileTap={{ scale: 1.5, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shadow-inner group-hover:shadow-md transition-shadow"
                        >
                          <span className="text-3xl">💬</span>
                        </motion.div>
                        <div className="flex-1 text-left">
                          <h3 className="text-xl font-serif font-bold text-stone-800 mb-1">Batch Add</h3>
                          <p className="text-sm text-stone-500">Add multiple products in one go</p>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </motion.button>

                    {/* Bill Upload */}
                    <motion.button
                      onClick={() => {
                        setTimeout(() => setShowBillUpload(true), 300);
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      className="group w-full relative overflow-hidden bg-gradient-to-r from-white to-stone-50 border-2 border-stone-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-6">
                        <motion.div
                          whileTap={{ scale: 1.5, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shadow-inner group-hover:shadow-md transition-shadow"
                        >
                          <span className="text-3xl">📄</span>
                        </motion.div>
                        <div className="flex-1 text-left">
                          <h3 className="text-xl font-serif font-bold text-stone-800 mb-1">Bill Upload</h3>
                          <p className="text-sm text-stone-500">Upload your grocery receipt or invoice</p>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </motion.button>

                    {/* Local Shop Form Entry */}
                    <motion.button
                      onClick={() => {
                        setTimeout(() => setScanMode('form'), 300);
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      className="group w-full relative overflow-hidden bg-gradient-to-r from-white to-stone-50 border-2 border-stone-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-6">
                        <motion.div
                          whileTap={{ scale: 1.5, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shadow-inner group-hover:shadow-md transition-shadow"
                        >
                          <span className="text-3xl">🥬</span>
                        </motion.div>
                        <div className="flex-1 text-left">
                          <h3 className="text-xl font-serif font-bold text-stone-800 mb-1">Local Shop</h3>
                          <p className="text-sm text-stone-500">Manually add items from local stores</p>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </motion.button>
                  </div>


                </div>
              )}

              {/* Form Entry Mode for Local Shops */}
              {scanMode === 'form' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">🥬 Add Local Shop Item</h2>
                    <button
                      onClick={() => {
                        setScanMode('none');
                        setError('');
                      }}
                      className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-semibold"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-4 bg-white/70 backdrop-blur-xl border border-orange-200 rounded-3xl p-6">
                    {/* Product Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Fresh Spinach, Tomato"
                        value={formData.productName}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 placeholder-gray-600"
                      />
                    </div>

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 2"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 placeholder-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit
                        </label>
                        <select
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="pcs">pcs</option>
                          <option value="L">L</option>
                          <option value="ml">ml</option>
                          <option value="loaf">loaf</option>
                        </select>
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                      />
                    </div>

                    {/* Category & Storage */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                        >
                          <option value="vegetables">Vegetables</option>
                          <option value="fruits">Fruits</option>
                          <option value="dairy">Dairy</option>
                          <option value="atta">Atta/Flour</option>
                          <option value="snacks">Snacks</option>
                          <option value="beverages">Beverages</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Storage Type
                        </label>
                        <select
                          value={formData.storageType}
                          onChange={(e) => setFormData({ ...formData, storageType: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                        >
                          <option value="refrigerator">Refrigerator</option>
                          <option value="pantry">Pantry</option>
                          <option value="counter">Counter</option>
                          <option value="freezer">Freezer</option>
                        </select>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Processing...' : 'Add to Inventory'}
                    </button>
                  </form>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Fill in all fields and set an expiry date based on when you estimate the product will expire.
                    </p>
                  </div>
                </motion.div>
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
                    className="w-full h-48 px-4 py-3 border-2 border-emerald-400 rounded-xl focus:outline-none focus:border-emerald-600 font-mono text-sm bg-white text-gray-800 placeholder-gray-500"
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
                    <h2 className="text-2xl font-bold text-gray-900">
                      {dataSource === 'qr' && 'QR Code Scanned Successfully!'}
                      {dataSource === 'ocr' && 'Product Detected Successfully!'}
                      {dataSource === 'voice' && 'Product Added via Voice!'}
                      {dataSource === 'batch' && 'Batch Products Added!'}
                      {dataSource === 'bill' && 'Products Extracted from Bill!'}
                      {!dataSource && 'Product Added Successfully!'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Order ID: <span className="font-semibold">{scannedData.orderId}</span> • Date: {formatLocalISO(scannedData.orderDate as string)}
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
                      const daysLeft = calculateDaysUntilExpiry(product.expiryDate);
                      let status = 'fresh';
                      if (daysLeft < 0) status = 'expired';
                      else if (daysLeft === 0) status = 'warning';
                      else if (daysLeft <= 3) status = 'warning';
                      else if (daysLeft <= 7) status = 'caution';

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
                                  Category: {product.category} • Qty: {product.quantity} {((product as InventoryItem).unit ?? '')}
                                </p>
                                <p className="text-sm font-semibold mt-1">
                                  Expires: {product.expiryDate}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${status === 'fresh' ? 'bg-green-200 text-green-900' :
                                status === 'caution' ? 'bg-yellow-200 text-yellow-900' :
                                  status === 'warning' ? 'bg-orange-200 text-orange-900' :
                                    'bg-red-200 text-red-900'
                                }`}>
                                {status === 'expired' ? '❌' : status === 'warning' ? '⚠️' : status === 'caution' ? '⏰' : '✅'}
                                {daysLeft >= 0 ? `${daysLeft} days` : 'Expired'}
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
                    setDataSource(null);
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
      </motion.div>

      {/* OCR Scanner Modal */}
      {showOCRScanner && (
        <OCRScanner
          onExpiryDetected={handleOCRDetection}
          onClose={() => setShowOCRScanner(false)}
        />
      )}

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <VoiceInput
          onProductDetected={handleVoiceDetection}
          onClose={() => setShowVoiceInput(false)}
        />
      )}

      {/* Conversational Multi-Product Input Modal */}
      {showConversationalInput && (
        <ConversationalInventoryInput
          onProductsAdded={handleConversationalProductsAdded}
          onClose={() => setShowConversationalInput(false)}
        />
      )}

      {/* Bill Upload Modal */}
      {showBillUpload && (
        <BillUploadModal
          onProductsAdded={handleBillProductsAdded}
          onClose={() => setShowBillUpload(false)}
        />
      )}

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
