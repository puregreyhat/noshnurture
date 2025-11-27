'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  const currentStepRef = useRef<CaptureStep>('initial'); // Track which step we're on when file is selected

  const [step, setStep] = useState<CaptureStep>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false); // Track if user clicked camera button
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Store both images for combined processing
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [labelImage, setLabelImage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Track current step in ref for use in file selection handler
  useEffect(() => {
    currentStepRef.current = step;
  }, [step]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsInitializingCamera(true); // User clicked camera button
      setIsCameraActive(true); // Show camera loading state immediately

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported on this device. Please use gallery upload instead.');
        setIsCameraActive(false);
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
        // Video is now playing - isCameraActive is already true
      }
    } catch (err: any) {
      setIsCameraActive(false); // Hide camera on error
      setIsInitializingCamera(false); // Reset camera initialization flag
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
            // isCameraActive is already true from initial call
          }
        } catch (fallbackErr) {
          setIsCameraActive(false);
          setIsInitializingCamera(false);
          setError('Unable to access camera. Please use gallery upload instead.');
          console.error('Fallback camera error:', fallbackErr);
        }
      } else {
        setIsCameraActive(false);
        setIsInitializingCamera(false);
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
    if (!file) {
      console.error('No file selected');
      return;
    }

    console.log('File selected:', file.name, 'Current step:', currentStepRef.current);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      console.log('File loaded, setting preview image');
      setPreviewImage(imageData);
      // Set step based on current step: if on 'initial', go to 'front'; if on 'label', stay on 'label'
      if (currentStepRef.current === 'initial') {
        console.log('Setting step to front');
        setStep('front');
      } else {
        console.log('Staying on step:', currentStepRef.current);
      }
      // If on 'label', don't change step - the preview will automatically show because previewImage is set
    };
    reader.readAsDataURL(file);

    // Clear the file input so the same file can be selected again
    e.target.value = '';
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
    setIsInitializingCamera(false);
  };

  const resetAll = () => {
    setStep('initial');
    setFrontImage(null);
    setLabelImage(null);
    setPreviewImage(null);
    setError(null);
    setLoadingMessage('');
    setIsInitializingCamera(false);
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-[#FDFBF7] rounded-none md:rounded-3xl max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-800">Smart Label Scanner</h2>
            <p className="text-sm text-stone-500 mt-1">
              {step === 'initial' && '2-step scanning'}
              {step === 'front' && 'Step 1 of 2: Product Name'}
              {step === 'label' && 'Step 2 of 2: Expiry Date'}
              {step === 'processing' && 'Processing...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-xl text-stone-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* STEP 0: Initial menu */}
        {step === 'initial' && !frontImage && !previewImage && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-100">
              <h3 className="font-serif font-semibold text-emerald-900 mb-3 text-lg">📸 How it works</h3>
              <ol className="text-sm text-emerald-800 space-y-2 list-decimal list-inside">
                <li><strong>Front side:</strong> Photo showing product name</li>
                <li><strong>Loading:</strong> 3 seconds while AI processes</li>
                <li><strong>Label side:</strong> Photo with expiry & mfg date</li>
                <li><strong>Done:</strong> Product added to inventory!</li>
              </ol>
            </div>

            <button
              onClick={() => {
                setStep('front');
                startCamera();
              }}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              <Camera size={22} />
              📷 Take Photos with Camera
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-200"></div>
              <span className="text-sm text-stone-400 font-medium">or upload</span>
              <div className="flex-1 h-px bg-stone-200"></div>
            </div>

            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="w-full bg-white border-2 border-stone-200 text-stone-700 py-4 rounded-2xl font-semibold hover:border-amber-300 hover:bg-amber-50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              📁 Choose Photos from Gallery
            </button>
          </div>
        )}

        {/* STEP 1: Capture front image */}
        {step === 'front' && !frontImage && !previewImage && !isCameraActive && isInitializingCamera && (
          <div className="space-y-4">
            <div className="bg-stone-50 rounded-2xl p-6 border-2 border-stone-200 text-center">
              <Loader2 className="animate-spin mx-auto mb-3 text-emerald-600" size={28} />
              <p className="text-base font-serif font-semibold text-stone-800">Starting Camera...</p>
              <p className="text-sm text-stone-600 mt-2">Please allow camera access if prompted</p>
            </div>
            <button
              onClick={() => {
                stopCamera();
                resetAll();
              }}
              className="w-full bg-stone-200 text-stone-800 py-3 rounded-2xl font-semibold hover:bg-stone-300 transition-all"
            >
              Cancel
            </button>
          </div>
        )}

        {/* STEP 1: Capture front image */}
        {step === 'front' && !frontImage && !previewImage && isCameraActive && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-100">
              <p className="text-base font-serif font-semibold text-emerald-900">📦 Step 1 of 2</p>
              <p className="text-sm text-emerald-800 mt-2">
                Show the <strong>front of the package</strong> with the <strong>product name</strong>
              </p>
            </div>

            <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-emerald-400 rounded-2xl pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400"></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Capture Front
              </button>
              <button
                onClick={() => {
                  stopCamera();
                  resetAll();
                }}
                className="flex-1 bg-stone-200 text-stone-800 py-3 rounded-2xl font-semibold hover:bg-stone-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Preview front image */}
        {step === 'front' && previewImage && !frontImage && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-100">
              <p className="text-base font-serif font-semibold text-emerald-900">📦 Step 1 of 2</p>
              <p className="text-sm text-emerald-800 mt-2">
                Does this show the <strong>product name clearly?</strong>
              </p>
            </div>

            <img
              src={previewImage}
              alt="Front preview"
              className="w-full rounded-2xl max-h-64 object-cover shadow-lg"
            />

            <div className="flex gap-3">
              <button
                onClick={confirmFrontImage}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Confirm
              </button>
              <button
                onClick={() => {
                  setPreviewImage(null);
                  startCamera();
                }}
                className="flex-1 bg-stone-200 text-stone-800 py-3 rounded-2xl font-semibold hover:bg-stone-300 transition-all"
              >
                Retake
              </button>
            </div>
          </div>
        )}

        {/* LOADING: Between front and label capture */}
        {step === 'label' && !labelImage && !previewImage && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-100">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={24} className="text-emerald-600" />
                <span className="font-serif font-semibold text-emerald-900 text-lg">Front image saved!</span>
              </div>
              <p className="text-base text-emerald-800 mb-4">
                {loadingMessage ? loadingMessage : 'Waiting to process next image...'}
              </p>
              {loadingMessage && (
                <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-full animate-pulse"></div>
                </div>
              )}
            </div>

            <button
              onClick={() => startCamera()}
              disabled={!!loadingMessage}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Camera size={22} />
              Take Photo of Expiry
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!!loadingMessage}
              className="w-full bg-white border-2 border-stone-200 text-stone-700 py-4 rounded-2xl font-semibold hover:border-emerald-300 hover:bg-stone-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Choose from Gallery
            </button>
          </div>
        )}

        {/* STEP 2: Camera Loading State */}
        {step === 'label' && !labelImage && !previewImage && !isCameraActive && isInitializingCamera && (
          <div className="space-y-4">
            <div className="bg-stone-50 rounded-2xl p-6 border-2 border-stone-200 text-center">
              <Loader2 className="animate-spin mx-auto mb-3 text-emerald-600" size={28} />
              <p className="text-base font-serif font-semibold text-stone-800">Starting Camera...</p>
              <p className="text-sm text-stone-600 mt-2">Please allow camera access if prompted</p>
            </div>
            <button
              onClick={() => {
                stopCamera();
                resetCapture();
              }}
              className="w-full bg-stone-200 text-stone-800 py-3 rounded-2xl font-semibold hover:bg-stone-300 transition-all"
            >
              Back
            </button>
          </div>
        )}

        {/* STEP 2: Capture label image (camera) */}
        {step === 'label' && !labelImage && !previewImage && isCameraActive && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-100">
              <p className="text-base font-serif font-semibold text-emerald-900">📋 Step 2 of 2</p>
              <p className="text-sm text-emerald-800 mt-2">
                Show the label section with <strong>expiry date & manufacturing info</strong>
              </p>
            </div>

            <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-emerald-400 rounded-2xl pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400"></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Capture Label
              </button>
              <button
                onClick={() => {
                  stopCamera();
                  resetCapture();
                }}
                className="flex-1 bg-stone-200 text-stone-800 py-3 rounded-2xl font-semibold hover:bg-stone-300 transition-all"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Preview label image */}
        {step === 'label' && previewImage && !labelImage && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-100">
              <p className="text-base font-serif font-semibold text-emerald-900">📋 Step 2 of 2</p>
              <p className="text-sm text-emerald-800 mt-2">
                Does this show <strong>expiry & mfg dates clearly?</strong>
              </p>
            </div>

            <img
              src={previewImage}
              alt="Label preview"
              className="w-full rounded-2xl max-h-64 object-cover shadow-lg"
            />

            <div className="flex gap-3">
              <button
                onClick={confirmLabelImage}
                disabled={isLoading}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
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
                className="flex-1 bg-stone-200 text-stone-800 py-3 rounded-2xl font-semibold hover:bg-stone-300 transition-all disabled:opacity-50"
              >
                Retake
              </button>
            </div>
          </div>
        )}

        {/* Processing state */}
        {step === 'processing' && isLoading && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-8 flex flex-col items-center gap-4 border-2 border-emerald-100">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
              <p className="text-base text-emerald-800 font-serif font-semibold">Analyzing images...</p>
              <p className="text-sm text-emerald-700 text-center">
                Detecting product name and expiry date
              </p>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200 space-y-4">
            <p className="text-base text-red-800 font-semibold">{error}</p>
            <button
              onClick={() => {
                resetAll();
              }}
              className="w-full bg-red-600 text-white py-3 rounded-2xl font-semibold hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Over
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}

