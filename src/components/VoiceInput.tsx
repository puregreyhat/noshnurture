'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { processVoiceInput } from '@/lib/gemini-service';

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

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  isFinal: boolean;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  language: string;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceInput({ onProductDetected, onClose }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en-IN');
  const [useTextInput, setUseTextInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.language = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.results.length - 1; i >= 0; i--) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);
      } else if (interim) {
        setTranscript((prev) => {
          const parts = prev.split('|');
          return parts[0] + '|' + interim;
        });
      }
    };

    recognition.onerror = (event: Event) => {
      const errorEvent = event as any;
      const errorCode = errorEvent.error;
      
      console.error('Speech recognition error:', errorCode);
      
      let userMessage = '';
      let shouldRetry = false;
      
      switch (errorCode) {
        case 'network':
          shouldRetry = retryCount < 2; // Max 2 retries for network errors
          userMessage = shouldRetry 
            ? `Network issue detected (attempt ${retryCount + 1}/3). Retrying...`
            : 'Network error: Unable to connect to speech recognition service. Try again or check your internet connection.';
          break;
        case 'audio':
          userMessage = 'Audio error: Could not access your microphone. Please check permissions.';
          break;
        case 'no-speech':
          userMessage = 'No speech detected. Please speak clearly and try again.';
          break;
        case 'not-allowed':
          userMessage = 'Microphone access denied. Please allow microphone access in browser settings.';
          break;
        case 'service-not-allowed':
          userMessage = 'Speech recognition service is not available in your region.';
          break;
        default:
          userMessage = `Recognition error: ${errorCode}. Please try again.`;
      }
      
      setError(userMessage);
      setIsListening(false);
      
      // Auto-retry network errors with exponential backoff
      if (shouldRetry) {
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        timeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          startListeningInternal();
        }, backoffDelay);
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
  }, [language, retryCount]);

  const startListeningInternal = () => {
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (err) {
      console.debug('Recognition start error:', err);
    }
  };

  const startListening = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setError(null);
    setTranscript('');
    setRetryCount(0);
    setUseTextInput(false);
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
    const textToProcess = useTextInput ? manualText : transcript;
    
    if (!textToProcess.trim()) {
      setError(useTextInput ? 'Please type something first' : 'Please say something first');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Remove interim results marker if present
      const cleanText = textToProcess.split('|')[0].trim();

      const result = await processVoiceInput(cleanText);

      if (!result.productName || !result.expiryDate) {
        setError(`Could not understand. Please ${useTextInput ? 'type' : 'say'}: "Add [product name] expiring [date]"`);
        return;
      }

      onProductDetected({
        productName: result.productName,
        expiryDate: result.expiryDate,
        quantity: result.quantity?.toString(),
        unit: result.unit,
        confidence: result.confidence,
      });

      setTimeout(() => onClose(), 500);
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const displayTranscript = transcript.split('|')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add Item by Voice</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Language selector */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (useTextInput) return;
                setLanguage('en-IN');
                setTranscript('');
              }}
              className={`flex-1 py-2 rounded font-medium transition ${
                language === 'en-IN' && !useTextInput
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={useTextInput}
            >
              English
            </button>
            <button
              onClick={() => {
                if (useTextInput) return;
                setLanguage('hi-IN');
                setTranscript('');
              }}
              className={`flex-1 py-2 rounded font-medium transition ${
                language === 'hi-IN' && !useTextInput
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={useTextInput}
            >
              हिंदी
            </button>
            <button
              onClick={() => {
                setUseTextInput(!useTextInput);
                setError(null);
                setTranscript('');
                setManualText('');
              }}
              className={`flex-1 py-2 rounded font-medium transition ${
                useTextInput
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              title="Use text input if speech recognition isn't working"
            >
              ⌨️ Type
            </button>
          </div>

          {/* Microphone button or Text input */}
          {!useTextInput ? (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`w-full py-6 rounded-lg font-medium flex items-center justify-center gap-2 transition text-lg ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
            >
              {isListening ? (
                <>
                  <MicOff size={24} />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic size={24} />
                  Start Listening
                </>
              )}
            </button>
          ) : (
            <input
              type="text"
              placeholder="Type product name and expiry, e.g., milk expiring Dec 15"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && manualText.trim() && !isProcessing) {
                  processTranscript();
                }
              }}
              disabled={isProcessing}
              className="w-full py-3 px-4 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 placeholder-gray-500"
              autoFocus
            />
          )}

          {/* Transcript display */}
          {!useTextInput && displayTranscript && (
            <div className="bg-gray-50 rounded-lg p-4 min-h-20">
              <p className="text-sm text-gray-600 mb-2">You said:</p>
              <p className="text-gray-800">{displayTranscript}</p>
            </div>
          )}

          {/* Examples */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Examples:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ "Add milk expiring December 15"</li>
              <li>✓ "Add 2 liters butter milk valid till next week"</li>
              <li>✓ "Yogurt packet expires on the 10th"</li>
              <li>✓ "500g flour expiring next month"</li>
            </ul>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-700 font-medium mb-3">{error}</p>
              {error.includes('Network error') && !useTextInput && (
                <div className="text-xs text-red-600 space-y-2">
                  <p>💡 Troubleshooting tips:</p>
                  <ul className="list-disc list-inside">
                    <li>Check your internet connection</li>
                    <li>Wait a moment and try again</li>
                    <li>Try using a different browser (Chrome works best)</li>
                    <li>Click the <strong>⌨️ Type</strong> button above to use text input instead</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              <p className="text-sm text-blue-600">Processing...</p>
            </div>
          )}

          {/* Action buttons */}
          {((useTextInput && manualText) || (!useTextInput && displayTranscript)) && !isProcessing && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setTranscript('');
                  startListening();
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
              >
                Retry
              </button>
              <button
                onClick={processTranscript}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Confirm
              </button>
            </div>
          )}

          {/* Retry button for network errors */}
          {error && !displayTranscript && !isListening && (
            <button
              onClick={() => {
                setError(null);
                startListening();
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Retry Recording
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
