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
  resultIndex: number;
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
  const [useTextInput, setUseTextInput] = useState(true); // DEFAULT TO TEXT INPUT
  const [manualText, setManualText] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-gray-900 font-bold">Add Item</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Primary text input - ALWAYS VISIBLE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Details</label>
            <input
              type="text"
              placeholder="e.g., milk expiring Dec 15"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && manualText.trim() && !isProcessing) {
                  processTranscript();
                }
              }}
              disabled={isProcessing}
              className="w-full py-3 px-4 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">Format: "product name expiring date" or "product name expires DD-MM-YYYY"</p>
          </div>

          {/* Voice input - OPTIONAL */}
          {voiceAvailable && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Or use voice (optional):</p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => {
                    setLanguage('en-IN');
                    setTranscript('');
                  }}
                  className={`flex-1 py-2 rounded text-sm font-medium transition ${
                    language === 'en-IN'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
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
                  className={`flex-1 py-2 rounded text-sm font-medium transition ${
                    language === 'hi-IN'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                  disabled={isProcessing}
                >
                  हिंदी
                </button>
              </div>
              
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50`}
              >
                {isListening ? (
                  <>
                    <MicOff size={20} />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic size={20} />
                    Start Listening
                  </>
                )}
              </button>

              {/* Transcript display */}
              {transcript && (
                <div className="bg-gray-50 rounded-lg p-3 mt-3">
                  <p className="text-xs text-gray-600 mb-1">You said:</p>
                  <p className="text-gray-800 text-sm">{transcript}</p>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              <p className="text-sm text-blue-600">Processing...</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              onClick={processTranscript}
              disabled={(!manualText.trim() && !transcript.trim()) || isProcessing}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              Confirm
            </button>
          </div>

          {/* Examples */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-900 mb-2">Examples:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ "milk expiring December 15"</li>
              <li>✓ "butter milk expires 15-12-2025"</li>
              <li>✓ "500g yogurt valid till tomorrow"</li>
              <li>✓ "flour expiring next month"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
