'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Loader2, X, CheckCircle } from 'lucide-react';
import { extractExpiryFromImage, imageToBase64 } from '@/lib/gemini-service';
import { detectBarcodeInImage, base64ToFile } from '@/lib/barcode-service';
import { getProductByBarcode, OFFProduct } from '@/lib/openfoodfacts-service';

interface OCRScannerProps {
  onExpiryDetected: (data: {
    expiryDate: string;
    productName: string | null;
    batchNumber: string | null;
    confidence: number;
    quantity?: string | null;
  }) => void;
  onClose: () => void;
}

type CaptureStep = 'initial' | 'front' | 'label' | 'processing';

export default function OCRScanner({ onExpiryDetected, onClose }: OCRScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const delayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  // New state tracking
  const [mode, setMode] = useState<'selection' | 'barcode' | 'ocr'>('selection');
  const [step, setStep] = useState<CaptureStep>('initial');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [labelImage, setLabelImage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Barcode specific
  const [scannedProduct, setScannedProduct] = useState<OFFProduct | null>(null);
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      stopCamera();
    };
  }, []);

  // Effect to re-attach stream to video element when video element might have been re-created due to conditional rendering
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive, step, mode, previewImage]);

  // Live Barcode Scanning
  useEffect(() => {
    let scanInterval: NodeJS.Timeout;

    const scanFrame = async () => {
      if (mode === 'barcode' && isCameraActive && videoRef.current && canvasRef.current && !scannedProduct && !previewImage) {
        try {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx && videoRef.current.videoWidth > 0) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);

            const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
            const file = base64ToFile(dataUrl);

            // Attempt scan
            const code = await detectBarcodeInImage(file);
            if (code) {
              setIsScanningBarcode(true);
              const product = await getProductByBarcode(code);
              // Store stream before unmounting
              // Actually we keep streamRef, so we don't need to do anything specific

              if (product) {
                setScannedProduct(product);
                setLoadingMessage(`✨ Found: ${product.product_name || 'Product'}`);
                // Auto transition to next step
                setTimeout(() => {
                  setStep('label');
                  setMode('ocr'); // Switch to standard capture for label
                  setFrontImage(dataUrl); // Use this frame as front image
                  setIsScanningBarcode(false);
                }, 1500);
              } else {
                setScannedProduct({ code, product_name: 'Unknown Product', quantity: '' });
                setLoadingMessage(`Barcode detected: ${code}`);
                setTimeout(() => {
                  setStep('label');
                  setMode('ocr');
                  setFrontImage(dataUrl);
                  setIsScanningBarcode(false);
                }, 1500);
              }
            }
          }
        } catch (e) {
          // Silent fail for frame scan
        }
      }
    };

    if (mode === 'barcode' && isCameraActive) {
      scanInterval = setInterval(scanFrame, 1000); // Scan every 1s to avoid UI freeze
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [mode, isCameraActive, scannedProduct, previewImage]);


  const startCamera = async () => {
    try {
      setError(null);
      setIsInitializingCamera(true);
      setIsCameraActive(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      // reuse existing stream if active
      if (streamRef.current && streamRef.current.active) {
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
        return;
      }

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setIsCameraActive(false);
      setIsInitializingCamera(false);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Ensure accurate dims
        if (videoRef.current.videoWidth) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);
          const imageData = canvasRef.current.toDataURL('image/jpeg');
          setPreviewImage(imageData);
          // We do NOT stop camera here immediately if we want to potentially retake quickly? 
          // Logic says: preview phase -> retake calls startCamera.
          stopCamera();
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setPreviewImage(imageData);
      // Determine what to do based on step
      if (mode === 'barcode') {
        // If uploaded in barcode mode, check it immediately
        checkUploadedBarcode(imageData);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const checkUploadedBarcode = async (base64: string) => {
    setLoadingMessage('Checking barcode...');
    try {
      const file = base64ToFile(base64);
      const code = await detectBarcodeInImage(file);
      if (code) {
        const product = await getProductByBarcode(code);
        if (product) {
          setScannedProduct(product);
          setLoadingMessage(`✨ Found: ${product.product_name}`);
          setTimeout(() => {
            setFrontImage(base64);
            setStep('label');
            setMode('ocr');
            setPreviewImage(null);
          }, 1500);
          return;
        }
      }
      setError("No barcode found in image. Please try 'Scanner' mode or standard photo.");
      setLoadingMessage('');
    } catch (e) {
      setError("Failed to read barcode");
      setLoadingMessage('');
    }
  };

  const confirmFrontImage = () => {
    if (previewImage) {
      setFrontImage(previewImage);
      setPreviewImage(null);
      setStep('label');
    }
  };

  const confirmLabelImage = async () => {
    if (!previewImage) return;
    setLabelImage(previewImage);
    setPreviewImage(null);
    setStep('processing');
    await processImages(frontImage, previewImage);
  };

  const processImages = async (frontImg: string | null, labelImg: string | null) => {
    if (!labelImg) return; // Front image might be skipped or implicit in barcode mode

    try {
      setIsLoading(true);
      setError(null);
      setLoadingMessage('Reading expiry date...');

      const labelBase64 = labelImg.split(',')[1];
      const result = await extractExpiryFromImage(labelBase64);

      let productName = scannedProduct?.product_name || result.productName;
      let quantity = scannedProduct?.quantity || null;

      // If still no name, try front image OCR if available
      if (!productName && frontImg) {
        setLoadingMessage('Reading product name...');
        const frontBase64 = frontImg.split(',')[1];
        const frontResult = await extractExpiryFromImage(frontBase64);
        productName = frontResult.productName;
      }

      if (!result.expiryDate) {
        setError('Could not detect expiry date. Please provide a clearer image of the date.');
        setStep('label'); // Go back to label capture
        return;
      }

      onExpiryDetected({
        expiryDate: result.expiryDate,
        productName: productName || 'Unknown Product',
        batchNumber: result.batchNumber,
        confidence: result.confidence,
        quantity: quantity
      });

      setTimeout(onClose, 500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Processing failed. Please try again.');
      setStep('label');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const resetAll = () => {
    setMode('selection');
    setStep('initial');
    setFrontImage(null);
    setLabelImage(null);
    setPreviewImage(null);
    setScannedProduct(null);
    setError(null);
    setLoadingMessage('');
    stopCamera();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-[#FDFBF7] rounded-none md:rounded-3xl max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full text-stone-500">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">Add Product</h2>

        {/* SELECTION MODE */}
        {mode === 'selection' && (
          <div className="space-y-4 mt-8">
            <p className="text-stone-600 mb-6">Does the product have a barcode?</p>

            <button onClick={() => { setMode('barcode'); setStep('front'); startCamera(); }}
              className="w-full bg-emerald-600 text-white p-6 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-700 transition-all">
              <Camera size={32} />
              <span className="font-bold text-lg">Yes, Scan Barcode</span>
              <span className="text-emerald-100 text-sm">Fastest • Auto-fills Name & Weight</span>
            </button>

            <button onClick={() => { setMode('ocr'); setStep('front'); startCamera(); }}
              className="w-full bg-white border-2 border-emerald-600 text-emerald-700 p-6 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-50 transition-all">
              <Camera size={32} />
              <span className="font-bold text-lg">No, Scan Product Front</span>
              <span className="text-emerald-600/70 text-sm">We'll read the text from the package</span>
            </button>
          </div>
        )}

        {/* BARCODE MODE */}
        {mode === 'barcode' && step === 'front' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
              <p className="text-emerald-800 font-medium">Point camera at barcode</p>
            </div>

            <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden">
              {!isCameraActive && !previewImage && (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                  <Loader2 className="animate-spin" />
                </div>
              )}
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-emerald-500/50 flex items-center justify-center">
                <div className="w-64 h-32 border-2 border-emerald-400 rounded-lg shadow-[0_0_0_999px_rgba(0,0,0,0.5)]"></div>
              </div>
              {loadingMessage && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white p-3 rounded-lg text-center backdrop-blur-sm">
                  {loadingMessage}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 text-stone-600 font-medium">
                Upload Image
              </button>
              <button onClick={resetAll} className="flex-1 py-3 text-red-500 font-medium">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* NORMAL / OCR MODE - FRONT */}
        {mode === 'ocr' && step === 'front' && !previewImage && (
          <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-emerald-800">1. Take photo of <strong>Product Name</strong></p>
            </div>
            <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3">
              <button onClick={capturePhoto} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Capture</button>
              <button onClick={resetAll} className="px-4 text-stone-500">Cancel</button>
            </div>
          </div>
        )}

        {/* PREVIEW FRONT (Non-barcode mode only) */}
        {mode === 'ocr' && step === 'front' && previewImage && (
          <div className="space-y-4">
            <img src={previewImage} className="w-full rounded-2xl" />
            <div className="flex gap-3">
              <button onClick={confirmFrontImage} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Use Photo</button>
              <button onClick={() => { setPreviewImage(null); startCamera(); }} className="flex-1 bg-stone-200 py-3 rounded-xl">Retake</button>
            </div>
          </div>
        )}

        {/* LABEL STEP (Common) */}
        {step === 'label' && !previewImage && (
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-amber-800">2. Take photo of <strong>Expiry Date</strong></p>
              {scannedProduct && <p className="text-xs text-amber-600 mt-1">Product: {scannedProduct.product_name}</p>}
            </div>
            {!isCameraActive && (
              <div className="text-center py-8">
                <button onClick={startCamera} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium">
                  Start Camera for Expiry
                </button>
              </div>
            )}
            {isCameraActive && (
              <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            )}
            {isCameraActive && (
              <div className="flex gap-3">
                <button onClick={capturePhoto} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Capture Label</button>
                <button onClick={() => { stopCamera(); setStep('initial'); setMode('selection'); }} className="px-4 text-stone-500">Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* PREVIEW LABEL */}
        {step === 'label' && previewImage && (
          <div className="space-y-4">
            <img src={previewImage} className="w-full rounded-2xl" />
            <div className="flex gap-3">
              <button onClick={confirmLabelImage} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Process</button>
              <button onClick={() => { setPreviewImage(null); startCamera(); }} className="flex-1 bg-stone-200 py-3 rounded-xl">Retake</button>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {step === 'processing' && (
          <div className="text-center py-12 space-y-4">
            <Loader2 className="animate-spin w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-stone-600">{loadingMessage}</p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-600 mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={18} /></button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
