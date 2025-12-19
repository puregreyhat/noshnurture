'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { processVoiceInput } from '@/lib/gemini-service';
import { getDefaultExpiryDate } from '@/lib/default-expiry';

interface VoiceInputProps {
  onProductDetected: (data: {
    productName: string;
    expiryDate: string;
    quantity?: string;
    unit?: string;
    confidence: number;
  }) => void;
  onClose: () => void;
}

// Loosen types to avoid conflicts with DOM lib speech types across TS versions
type LocalSpeechRecognition = any;
type LocalSpeechRecognitionEvent = any;

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export default function VoiceInput({ onProductDetected, onClose }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en-IN');
  const [useTextInput, setUseTextInput] = useState(true); // DEFAULT TO TEXT INPUT
  const [manualText, setManualText] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const recognitionRef = useRef<LocalSpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceAvailable(false);
      setError('Speech recognition not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    // Use continuous: false for better desktop support
    // Mobile will still work, desktop won't hang
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.language = language;

    recognition.onresult = (event: LocalSpeechRecognitionEvent) => {
      let interimTranscript = '';

      // Build interim transcript for live display
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          // Add to our final transcript accumulator (only once per final result)
          if (!finalTranscriptRef.current.includes(transcript)) {
            finalTranscriptRef.current += transcript + ' ';
          }
        } else {
          interimTranscript += transcript;
        }
      }

      // Update state: show final + interim (final will be "final|interim")
      if (finalTranscriptRef.current || interimTranscript) {
        setTranscript(finalTranscriptRef.current + '|' + interimTranscript);
      }
    };

    recognition.onerror = (event: Event) => {
      const errorEvent = event as any;
      const errorCode = errorEvent.error;

      console.error('Speech recognition error:', errorCode);
      console.error('Browser:', navigator.userAgent);
      setIsListening(false);

      // For any error, disable voice and keep text input active
      if (errorCode === 'network') {
        setVoiceAvailable(false);
        setError('Voice input unavailable (network issue). Using text input instead.');
      } else if (errorCode === 'no-speech') {
        setError('No speech detected. Please try again or use text input.');
      } else if (errorCode === 'audio') {
        setError('Microphone error. Please check permissions and try text input.');
      } else if (errorCode === 'not-allowed') {
        setVoiceAvailable(false);
        setError('Microphone access denied. Using text input instead.');
      } else if (errorCode === 'service-not-allowed') {
        setVoiceAvailable(false);
        setError('Speech recognition service not available in your browser.');
      } else if (errorCode === 'bad-grammar') {
        setError('Grammar error. Please try again or use text input.');
      } else if (errorCode === 'aborted') {
        setError('Voice input was interrupted. Please try again.');
      } else {
        setError(`Voice error: ${errorCode}. Please use text input.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      recognition.abort();
    };
  }, [language]);

  const startListeningInternal = () => {
    try {
      console.log('Starting voice recognition:', {
        browser: navigator.userAgent,
        language: language,
        voiceAvailable: voiceAvailable,
      });
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (err) {
      console.debug('Recognition start error:', err);
      setVoiceAvailable(false);
      setError('Could not start voice recognition. Please use text input.');
    }
  };

  const startListening = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setError(null);
    setTranscript('');
    finalTranscriptRef.current = '';  // Reset final transcript for new recording session
    startListeningInternal();
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.debug('Error stopping recognition:', err);
    }
    setIsListening(false);
  };

  const processTranscript = async () => {
    // Use voice transcript if available, otherwise use manual text
    const hasVoiceInput = getFinalTranscript().trim().length > 0;
    const hasTextInput = manualText.trim().length > 0;

    const textToProcess = hasVoiceInput ? transcript : manualText;

    if (!textToProcess.trim()) {
      setError('Please provide input (text or voice)');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Remove interim results marker if present (format: "final|interim" or "final|")
      // Split by | and take the first part, then any part that's not empty
      const parts = textToProcess.split('|');
      const cleanText = parts
        .filter(p => p.trim().length > 0)
        .join(' ')
        .trim();

      if (!cleanText) {
        setError('No valid input detected. Please try again.');
        return;
      }

      const result = await processVoiceInput(cleanText);

      if (!result.productName) {
        setError('Could not understand the product name. Please try again.');
        return;
      }

      // Expiry can be optional for fresh produce; if missing compute a default
      let finalExpiry = result.expiryDate;
      if (!finalExpiry) {
        try {
          const autoDate = getDefaultExpiryDate(result.productName, 'refrigerator');
          finalExpiry = autoDate.toISOString().slice(0, 10);
        } catch {
          const fallback = new Date();
          fallback.setDate(fallback.getDate() + 7);
          finalExpiry = fallback.toISOString().slice(0, 10);
        }
      }

      onProductDetected({
        productName: result.productName,
        expiryDate: finalExpiry,
        quantity: result.quantity?.toString(),
        unit: result.unit,
        confidence: result.confidence,
      });

      setTimeout(() => onClose(), 500);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract final transcript (before |), handling all edge cases
  const getFinalTranscript = () => {
    const parts = transcript.split('|');
    return parts
      .filter(p => p.trim().length > 0)
      .join(' ')
      .trim();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-[#FDFBF7] rounded-none md:rounded-3xl max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl text-stone-800 font-serif font-bold">Add Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Primary text input - ALWAYS VISIBLE */}
          <div>
            <label className="block text-base font-serif font-semibold text-stone-800 mb-3">Product Details</label>
            <input
              type="text"
              placeholder="e.g., tomato 1kg or milk expiring Dec 15"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && manualText.trim() && !isProcessing) {
                  processTranscript();
                }
              }}
              disabled={isProcessing}
              className="w-full py-4 px-5 border-2 border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-stone-800 placeholder-stone-400 transition-all"
              autoFocus
            />
            <p className="text-sm text-stone-500 mt-2">Format: product name [quantity][unit]; expiry phrase optional for vegetables/fruits.</p>
          </div>

          {/* Voice input - OPTIONAL */}
          {voiceAvailable && (
            <div className="border-t border-stone-200 pt-5">
              <p className="text-base font-serif font-semibold text-stone-800 mb-3">Or use voice (optional):</p>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => {
                    setLanguage('en-IN');
                    setTranscript('');
                  }}
                  className={`flex-1 py-3 rounded-2xl text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${language === 'en-IN'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  disabled={isProcessing}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setLanguage('hi-IN');
                    setTranscript('');
                  }}
                  className={`flex-1 py-3 rounded-2xl text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${language === 'hi-IN'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  disabled={isProcessing}
                >
                  हिंदी
                </button>
              </div>

              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
                  } disabled:opacity-50`}
              >
                {isListening ? (
                  <>
                    <MicOff size={22} />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic size={22} />
                    Start Listening
                  </>
                )}
              </button>

              {/* Transcript display */}
              {transcript && (
                <div className="bg-stone-50 rounded-2xl p-4 mt-4 border border-stone-200">
                  <p className="text-sm text-stone-500 mb-2">You said:</p>
                  <p className="text-stone-800 text-base font-medium">{getFinalTranscript()}</p>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3 border border-emerald-200">
              <Loader2 className="animate-spin text-emerald-600" size={20} />
              <p className="text-base font-medium text-emerald-800">Processing...</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-3">
            <button
              onClick={onClose}
              className="flex-1 bg-stone-200 text-stone-800 py-3 rounded-2xl font-semibold hover:bg-stone-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={processTranscript}
              disabled={(!manualText.trim() && !getFinalTranscript()) || isProcessing}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg"
            >
              Confirm
            </button>
          </div>

          {/* Examples */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <p className="text-sm font-serif font-semibold text-emerald-900 mb-3">Examples:</p>
            {language === 'en-IN' ? (
              <ul className="text-sm text-emerald-800 space-y-1.5">
                <li>✓ "tomato 1kg"</li>
                <li>✓ "add 2 onions"</li>
                <li>✓ "milk expiring December 15"</li>
                <li>✓ "500g yogurt"</li>
              </ul>
            ) : (
              <ul className="text-sm text-emerald-800 space-y-1.5">
                <li>✓ "1 किलो टमाटर" (1 kg tomato)</li>
                <li>✓ "2 प्याज़" (2 onions)</li>
                <li>✓ "दूध वैधता 15 दिसंबर" (Milk expiry Dec 15)</li>
                <li>✓ "500 ग्राम दही" (500g yogurt)</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
