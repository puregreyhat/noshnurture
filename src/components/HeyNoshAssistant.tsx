'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, X, Volume2, VolumeX } from 'lucide-react';
import { detectIntent, generateResponse, speakText } from '@/lib/voice-assistant/nosh-service';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
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

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

export default function HeyNoshAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [useTextMode, setUseTextMode] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.language = 'en-IN';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          handleVoiceQuery(text);
        };

        recognition.onerror = (event: any) => {
          // Handle different error types gracefully
          if (event.error === 'no-speech') {
            setError('No speech detected. Please try again.');
          } else if (event.error === 'audio-capture') {
            setError('Microphone not available. Please check permissions.');
          } else if (event.error === 'network') {
            setError('Network error. Please check your connection.');
          } else {
            // For other errors, just log and don't show error
            console.error('Speech recognition error:', event.error);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser. Try Chrome or Edge.');
      return;
    }

    setError(null);
    setTranscript('');
    setResponse('');
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Recognition start error:', err);
      setError('Failed to start listening. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleTextSubmit = async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setTranscript(query);
    setTextInput('');
    await handleVoiceQuery(query);
  };

  const handleVoiceQuery = async (query: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Detect intent using Gemini
      const intent = await detectIntent(query);

      console.log('🎤 Voice Query Received:', {
        query,
        intent: intent?.intent,
        confidence: intent?.confidence,
      });

      // Check if intent detection failed or confidence is too low
      if (!intent) {
        console.warn('❌ No intent returned from Gemini');
        const responseText = 'I didn\'t quite catch that. You can ask me about: expiring items, recipes you can make with what you have, your inventory, or any cuisine-specific recipes. Try something like "What\'s expiring soon?" or "What can I make?"';
        setResponse(responseText);
        setIsSpeaking(true);
        speakText(responseText);
        setTimeout(() => setIsSpeaking(false), responseText.length * 50);
        setIsProcessing(false);
        return;
      }

      if (intent.confidence < 0.3) {
        console.warn('❌ Confidence too low:', intent.confidence);
        const responseText = 'I didn\'t quite catch that. You can ask me about: expiring items, recipes you can make with what you have, your inventory, or any cuisine-specific recipes. Try something like "What\'s expiring soon?" or "What can I make?"';
        setResponse(responseText);
        setIsSpeaking(true);
        speakText(responseText);
        setTimeout(() => setIsSpeaking(false), responseText.length * 50);
        setIsProcessing(false);
        return;
      }

      if (intent.intent === 'unknown') {
        console.warn('❌ Unknown intent');
        const responseText = 'I didn\'t quite catch that. You can ask me about: expiring items, recipes you can make with what you have, your inventory, or any cuisine-specific recipes. Try something like "What\'s expiring soon?" or "What can I make?"';
        setResponse(responseText);
        setIsSpeaking(true);
        speakText(responseText);
        setTimeout(() => setIsSpeaking(false), responseText.length * 50);
        setIsProcessing(false);
        return;
      }

      // For small talk, respond directly without backend
      if (intent.intent === 'smalltalk') {
        console.log('💬 Smalltalk detected, responding directly');
        const responseText = generateResponse(intent, []);
        setResponse(responseText);
        setIsSpeaking(true);
        speakText(responseText);
        setTimeout(() => setIsSpeaking(false), responseText.length * 50);
        setIsProcessing(false);
        return;
      }

      // Fetch data from backend based on intent
      console.log('🌐 Calling backend API for intent:', intent.intent);
      const apiResponse = await fetch('/api/voice-assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intent.intent, parameters: intent.parameters }),
      });

      if (!apiResponse.ok) {
        console.error('❌ Backend API failed:', apiResponse.status, apiResponse.statusText);
        throw new Error(`Backend API returned ${apiResponse.status}`);
      }

      const { data } = await apiResponse.json();
      console.log('✅ Backend response received:', {
        intent: intent.intent,
        dataCount: Array.isArray(data) ? data.length : 'not-array',
      });

      // Generate natural language response
      const responseText = generateResponse(intent, data);
      console.log('✅ Response generated:', responseText.substring(0, 50) + '...');
      setResponse(responseText);

      // Speak the response
      setIsSpeaking(true);
      speakText(responseText);
      
      // Reset speaking state after speech ends
      setTimeout(() => setIsSpeaking(false), responseText.length * 50); // Estimate duration

    } catch (err) {
      console.error('❌ Voice query error:', err);
      // Provide more specific error messages based on the error
      const errorMsg = err instanceof Error && err.message
        ? `Error: ${err.message}`
        : 'Sorry, I encountered an error processing your request. Please try again.';
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMute = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }
  };

  return (
    <>
      {/* Floating "Ask Nosh" Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-8 z-40 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-purple-500/50 transition-all"
        title="Hey Nosh - Voice Assistant"
      >
        <Mic className="w-7 h-7" />
      </motion.button>

      {/* Voice Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">
                
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 opacity-50" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <Mic className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Hey Nosh! 👋</h2>
                        <p className="text-sm text-gray-500">Your kitchen assistant</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Main Content */}
                  <div className="space-y-6">
                    
                    {/* Microphone Button */}
                    <div className="flex justify-center">
                      <motion.button
                        onClick={isListening ? stopListening : startListening}
                        disabled={isProcessing}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                          isListening
                            ? 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse'
                            : 'bg-gradient-to-br from-purple-500 to-pink-600 hover:shadow-purple-500/50'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-12 h-12 text-white animate-spin" />
                        ) : isListening ? (
                          <MicOff className="w-12 h-12 text-white" />
                        ) : (
                          <Mic className="w-12 h-12 text-white" />
                        )}
                      </motion.button>
                    </div>

                    {/* Status Text */}
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-700">
                        {isListening
                          ? '🎤 Listening...'
                          : isProcessing
                          ? '🤔 Thinking...'
                          : isSpeaking
                          ? '🗣️ Speaking...'
                          : useTextMode
                          ? '⌨️ Type your query'
                          : 'Tap to ask me anything!'}
                      </p>
                    </div>

                    {/* Text Input Mode Toggle */}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          setUseTextMode(!useTextMode);
                          if (!useTextMode) {
                            setTimeout(() => textInputRef.current?.focus(), 100);
                          }
                          setResponse('');
                          setTranscript('');
                          setError(null);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          useTextMode
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {useTextMode ? '🎤 Switch to Voice' : '⌨️ Use Text'}
                      </button>
                    </div>

                    {/* Text Input */}
                    {useTextMode && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <div className="flex gap-2">
                          <input
                            ref={textInputRef}
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleTextSubmit(textInput);
                              }
                            }}
                            placeholder="Type your question here..."
                            disabled={isProcessing}
                            className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                          />
                          <button
                            onClick={() => handleTextSubmit(textInput)}
                            disabled={isProcessing || !textInput.trim()}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                          >
                            {isProcessing ? '...' : 'Send'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Transcript */}
                    {transcript && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-purple-50 border border-purple-200 rounded-xl p-4"
                      >
                        <p className="text-sm text-gray-500 mb-1">You said:</p>
                        <p className="text-gray-800 font-medium">{transcript}</p>
                      </motion.div>
                    )}

                    {/* Response */}
                    {response && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white relative"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm opacity-90 mb-1">Nosh says:</p>
                            <p className="font-medium">{response}</p>
                          </div>
                          <button
                            onClick={toggleMute}
                            className="p-2 hover:bg-white/20 rounded-lg transition flex-shrink-0"
                          >
                            {isSpeaking ? (
                              <Volume2 className="w-5 h-5" />
                            ) : (
                              <VolumeX className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-xl p-4"
                      >
                        <p className="text-red-700 text-sm">{error}</p>
                      </motion.div>
                    )}

                    {/* Example Queries */}
                    {!transcript && !response && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">Try asking:</p>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>• "What items are expiring soon?"</p>
                          <p>• "What can I cook today?"</p>
                          <p>• "Show me Indian recipes"</p>
                          <p>• "What's in my inventory?"</p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
