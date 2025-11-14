'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2, X, CheckCircle } from 'lucide-react';
import { extractExpiryFromImage, imageToBase64 } from '@/lib/gemini-service';

interface OCRScannerProps {
  onExpiryDetected: (data: {
    expiryDate: string;
    productName: string | null;
    batchNumber: string | null;
    confidence: number;
  }) => void;
  onClose: () => void;
}

type CaptureStep = 'initial' | 'front' | 'label' | 'processing';

export default function OCRScanner({ onExpiryDetected, onClose }: OCRScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const delayTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [step, setStep] = useState<CaptureStep>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Store both images for combined processing
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [labelImage, setLabelImage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const startCamera = async () => {
    try {
      setError(null);
      
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported on this device. Please use gallery upload instead.');
        return;
      }

      // Request camera permission
      // On Android/iOS, this will show a permission popup
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Give the video element time to start playing
        setTimeout(() => {
          setIsCameraActive(true);
        }, 500);
      }
    } catch (err: any) {
      const errorMessage = err?.name || err?.message || String(err);
      
      // Handle specific error types
      if (errorMessage.includes('NotAllowedError') || errorMessage === 'NotAllowedError') {
        setError('📱 Camera permission denied. Please:\n1. Open Settings\n2. Find NoshNurture app\n3. Allow Camera permission');
      } else if (errorMessage.includes('NotFoundError') || errorMessage === 'NotFoundError') {
        setError('No camera found on this device. Please use gallery upload instead.');
      } else if (errorMessage.includes('NotReadableError') || errorMessage === 'NotReadableError') {
        setError('Camera is already in use by another app. Please close other apps and try again.');
      } else if (errorMessage.includes('OverconstrainedError') || errorMessage === 'OverconstrainedError') {
        // Fallback to basic constraints if advanced constraints fail
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            setTimeout(() => {
              setIsCameraActive(true);
            }, 500);
          }
        } catch (fallbackErr) {
          setError('Unable to access camera. Please use gallery upload instead.');
          console.error('Fallback camera error:', fallbackErr);
        }
      } else {
        setError('Unable to access camera. Please ensure you:\n1. Granted camera permission\n2. Are using HTTPS or localhost\n3. Try using gallery upload instead');
      }
      
      console.error('Camera error details:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setPreviewImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setPreviewImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const confirmFrontImage = async () => {
    if (!previewImage) return;
    
    setFrontImage(previewImage);
    setPreviewImage(null);
    setStep('label');
    
    // Show loading message for 3 seconds
    setLoadingMessage('Image attached to AI ✓');
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    
    delayTimerRef.current = setTimeout(() => {
      setLoadingMessage('');
      setError(null);
    }, 3000);
  };

  const confirmLabelImage = async () => {
    if (!previewImage) return;
    
    setLabelImage(previewImage);
    setPreviewImage(null);
    setStep('processing');
    
    // Process both images together
    await processImages(frontImage, previewImage);
  };

  const processImages = async (frontImg: string | null, labelImg: string | null) => {
    if (!frontImg || !labelImg) return;

    try {
      setIsLoading(true);
      setError(null);
      setLoadingMessage('Processing product label & expiry date...');

      // Extract base64 from both images
      const frontBase64 = frontImg.split(',')[1];
      const labelBase64 = labelImg.split(',')[1];

      // Process label image for expiry date
      const result = await extractExpiryFromImage(labelBase64);

      // If no product name from label, try to get it from front image
      let productName = result.productName;
      if (!productName) {
        const frontResult = await extractExpiryFromImage(frontBase64);
        productName = frontResult.productName;
      }

      if (!result.expiryDate) {
        setError('Could not detect expiry date. Please try again with clearer images.');
        resetCapture();
        return;
      }

      // Success - pass data to parent
      onExpiryDetected({
        expiryDate: result.expiryDate,
        productName: productName || 'Unknown Product',
        batchNumber: result.batchNumber,
        confidence: result.confidence,
      });

      // Auto close after success
      setTimeout(() => onClose(), 500);
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process images. Please try again.');
      resetCapture();
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const resetCapture = () => {
    setStep('front');
    setFrontImage(null);
    setLabelImage(null);
    setPreviewImage(null);
    setLoadingMessage('');
  };

  const resetAll = () => {
    setStep('initial');
    setFrontImage(null);
    setLabelImage(null);
    setPreviewImage(null);
    setError(null);
    setLoadingMessage('');
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Smart Label Scanner</h2>
            <p className="text-xs text-gray-500 mt-1">
              {step === 'initial' && '2-step scanning'}
              {step === 'front' && 'Step 1 of 2: Product Name'}
              {step === 'label' && 'Step 2 of 2: Expiry Date'}
              {step === 'processing' && 'Processing...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP 0: Initial menu */}
        {step === 'initial' && !frontImage && !previewImage && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📸 How it works:</h3>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li><strong>Front side:</strong> Take photo showing product name</li>
                <li><strong>Loading:</strong> 3 seconds while AI processes</li>
                <li><strong>Label section:</strong> Capture expiry & mfg date</li>
                <li><strong>Done:</strong> Product added to inventory!</li>
              </ol>
            </div>

            <button
              onClick={() => {
                setStep('front');
                startCamera();
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition"
            >
              <Camera size={20} />
              Start Scanning
            </button>

            <div className="relative flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-xs text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <button
              onClick={() => {
                setStep('front');
                fileInputRef.current?.click();
              }}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Choose from Gallery
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* STEP 1: Capture front image */}
        {step === 'front' && !frontImage && !previewImage && !isCameraActive && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-center">
              <Loader2 className="animate-spin mx-auto mb-2 text-amber-600" size={24} />
              <p className="text-sm font-semibold text-amber-900">Starting Camera...</p>
              <p className="text-xs text-amber-700 mt-1">Please allow camera access if prompted</p>
            </div>
            <button
              onClick={() => {
                stopCamera();
                resetAll();
              }}
              className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        )}

        {/* STEP 1: Capture front image */}
        {step === 'front' && !frontImage && !previewImage && isCameraActive && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-sm font-semibold text-amber-900">📦 Step 1 of 2</p>
              <p className="text-xs text-amber-800 mt-1">
                Show the <strong>front of the package</strong> with the <strong>product name</strong>
              </p>
            </div>

            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-amber-400 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400"></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 transition"
              >
                Capture Front
              </button>
              <button
                onClick={() => {
                  stopCamera();
                  resetAll();
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Preview front image */}
        {step === 'front' && previewImage && !frontImage && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-sm font-semibold text-amber-900">📦 Step 1 of 2</p>
              <p className="text-xs text-amber-800 mt-1">
                Does this show the <strong>product name clearly?</strong>
              </p>
            </div>

            <img
              src={previewImage}
              alt="Front preview"
              className="w-full rounded-lg max-h-64 object-cover"
            />

            <div className="flex gap-2">
              <button
                onClick={confirmFrontImage}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Confirm
              </button>
              <button
                onClick={() => {
                  setPreviewImage(null);
                  startCamera();
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
              >
                Retake
              </button>
            </div>
          </div>
        )}

        {/* LOADING: Between front and label capture */}
        {step === 'label' && !labelImage && !previewImage && (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <span className="font-semibold text-green-900">Front image saved!</span>
              </div>
              <p className="text-sm text-green-800 mb-3">
                {loadingMessage ? loadingMessage : 'Waiting to process next image...'}
              </p>
              {loadingMessage && (
                <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-600 h-full animate-pulse"></div>
                </div>
              )}
            </div>

            {!loadingMessage && (
              <>
                <button
                  onClick={() => startCamera()}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                >
                  <Camera size={20} />
                  Take Photo of Expiry
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Choose from Gallery
                </button>
              </>
            )}
          </div>
        )}

        {/* STEP 2: Camera Loading State */}
        {step === 'label' && !labelImage && !previewImage && !isCameraActive && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
              <Loader2 className="animate-spin mx-auto mb-2 text-blue-600" size={24} />
              <p className="text-sm font-semibold text-blue-900">Starting Camera...</p>
              <p className="text-xs text-blue-700 mt-1">Please allow camera access if prompted</p>
            </div>
            <button
              onClick={() => {
                stopCamera();
                resetCapture();
              }}
              className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
            >
              Back
            </button>
          </div>
        )}

        {/* STEP 2: Capture label image (camera) */}
        {step === 'label' && !labelImage && !previewImage && isCameraActive && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">📋 Step 2 of 2</p>
              <p className="text-xs text-blue-800 mt-1">
                Show the label section with <strong>expiry date & manufacturing info</strong>
              </p>
            </div>

            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-blue-400 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400"></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Capture Label
              </button>
              <button
                onClick={() => {
                  stopCamera();
                  resetCapture();
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Preview label image */}
        {step === 'label' && previewImage && !labelImage && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">📋 Step 2 of 2</p>
              <p className="text-xs text-blue-800 mt-1">
                Does this show <strong>expiry & mfg dates clearly?</strong>
              </p>
            </div>

            <img
              src={previewImage}
              alt="Label preview"
              className="w-full rounded-lg max-h-64 object-cover"
            />

            <div className="flex gap-2">
              <button
                onClick={confirmLabelImage}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm & Process
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setPreviewImage(null);
                  startCamera();
                }}
                disabled={isLoading}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-400 transition disabled:opacity-50"
              >
                Retake
              </button>
            </div>
          </div>
        )}

        {/* Processing state */}
        {step === 'processing' && isLoading && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-6 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm text-blue-700 font-medium">Analyzing images...</p>
              <p className="text-xs text-blue-600 text-center">
                Detecting product name and expiry date
              </p>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200 space-y-3">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button
              onClick={() => {
                resetAll();
              }}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition text-sm"
            >
              Start Over
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

