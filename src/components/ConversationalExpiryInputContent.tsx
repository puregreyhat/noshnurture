'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Loader } from 'lucide-react';
import { parseNaturalLanguageDate, BillProduct } from '@/lib/gemini-service';

interface ConversationalExpiryInputContentProps {
  products: BillProduct[];
  onComplete: (dates: Record<string, string>) => void;
  onClose: () => void;
  language?: string; // Optional language prop from parent
}

interface Message {
  type: 'user' | 'ai';
  content: string;
}

export default function ConversationalExpiryInputContent({
  products,
  onComplete,
  onClose,
  language = 'en-IN', // Default to English
}: ConversationalExpiryInputContentProps) {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [collectedDates, setCollectedDates] = useState<Record<string, string>>({});
  const [networkErrorCount, setNetworkErrorCount] = useState(0);
  const [voiceDisabled, setVoiceDisabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addAIMessage("Sorry, voice input is not supported in your browser. Please use text input instead.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = language; // Use language prop

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        processDateInput(transcript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      // Handle specific network errors with retry
      if (event.error === 'network') {
        const newErrorCount = networkErrorCount + 1;
        setNetworkErrorCount(newErrorCount);

        if (newErrorCount <= 2) {
          // Retry after delay (exponential backoff: 1s, 2s)
          const delayMs = newErrorCount === 1 ? 1000 : 2000;
          addAIMessage(`Network issue. Retrying in ${delayMs / 1000} seconds...`);
          
          retryTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && !voiceDisabled) {
              recognitionRef.current.start();
            }
          }, delayMs);
        } else {
          // Give up on voice, switch to text mode
          setVoiceDisabled(true);
          setNetworkErrorCount(0);
          addAIMessage(
            '⌨️ Voice input is having trouble connecting. Please type the expiry date instead (format: DD-MM-YYYY or "tomorrow").'
          );
        }
      } else if (event.error === 'no-speech') {
        addAIMessage('No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        addAIMessage('Microphone not available. Please check permissions and try again.');
      } else {
        addAIMessage(`Error: ${event.error}. Please try typing instead.`);
      }
    };
  }, [language]);

  // Start conversation
  useEffect(() => {
    if (messages.length === 0 && products.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      // Format: "size unit" (e.g., "500 mL" or "1 kg")
      const firstProduct = products[0];
      const displayText = `${firstProduct.size || firstProduct.quantity} ${firstProduct.unit}`;
      addAIMessage(
        `Give expiry date for 1) ${firstProduct.productName} (${displayText})`
      );
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }
    };
  }, []);

  const addAIMessage = (content: string) => {
    setMessages((prev) => [...prev, { type: 'ai', content }]);
    speakText(content);
  };

  const addUserMessage = (content: string) => {
    setMessages((prev) => [...prev, { type: 'user', content }]);
  };

  const processDateInput = async (input: string) => {
    if (!input.trim()) return;

    addUserMessage(input);
    setIsProcessing(true);

    // Capture current index at the time of processing to avoid stale closures
    const processingIndex = currentProductIndex;

    try {
      const parsedDate = await parseNaturalLanguageDate(input);

      if (parsedDate && parsedDate !== 'INVALID') {
        // Check if we already have a date for this product to prevent duplicates
        if (collectedDates[processingIndex.toString()]) {
          addAIMessage("I already have a date for this product. Moving to the next one...");
          const nextIndex = processingIndex + 1;
          if (nextIndex < products.length) {
            setCurrentProductIndex(nextIndex);
            setTimeout(() => {
              const nextProduct = products[nextIndex];
              const displayText = `${nextProduct.size || nextProduct.quantity} ${nextProduct.unit}`;
              addAIMessage(
                `Give expiry date for ${nextIndex + 1}) ${nextProduct.productName} (${displayText})`
              );
            }, 500);
          }
          setIsProcessing(false);
          return;
        }

        const newDates = { ...collectedDates, [processingIndex.toString()]: parsedDate };
        setCollectedDates(newDates);

        // Get the current product using the captured index
        const product = products[processingIndex];
        addAIMessage(`✓ Got ${parsedDate} for ${product.productName}`);

        // Move to next product or complete
        const nextIndex = processingIndex + 1;
        if (nextIndex < products.length) {
          // Update index first, then ask for next product
          setCurrentProductIndex(nextIndex);
          setTimeout(() => {
            const nextProduct = products[nextIndex];
            const displayText = `${nextProduct.size || nextProduct.quantity} ${nextProduct.unit}`;
            addAIMessage(
              `Give expiry date for ${nextIndex + 1}) ${nextProduct.productName} (${displayText})`
            );
          }, 500);
        } else {
          // All products done
          setTimeout(() => {
            addAIMessage('Perfect! All products added. Saving to inventory...');
            setTimeout(() => {
              onComplete(newDates);
            }, 1500);
          }, 1000);
        }
      } else {
        addAIMessage("I couldn't parse that date. Please try: 'tomorrow', 'next week', '29 06 2026', or 'June 2026'");
      }
    } catch (error) {
      console.error('Error processing date:', error);
      addAIMessage('Error processing your input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      // Reset error count when user tries voice again
      if (voiceDisabled) {
        setVoiceDisabled(false);
        setNetworkErrorCount(0);
        addAIMessage("Trying voice input again...");
      }
      
      // Clear any pending retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      recognitionRef.current?.start();
    }
  };

  const handleTextSubmit = () => {
    if (inputText.trim()) {
      processDateInput(inputText);
      setInputText('');
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const progress = Object.keys(collectedDates).length;

  return (
    <div className="h-full flex flex-col space-y-4 max-h-[90vh]">
      {/* Progress Bar */}
      <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-700">Progress</p>
          <p className="text-sm text-gray-600">
            {progress} of {products.length} completed
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${(progress / products.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Messages - WhatsApp style on mobile, larger on desktop */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 md:p-6 bg-gradient-to-b from-purple-50 to-white rounded-lg border border-gray-200">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] md:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${
                msg.type === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
              }`}
            >
              <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Warning Banner - Voice Disabled */}
      {voiceDisabled && (
        <div className="flex-shrink-0 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          <strong>⌨️ Voice input temporarily unavailable</strong>
          <p className="text-xs mt-1">Network issues detected. Please use text input or click mic to retry.</p>
        </div>
      )}

      {/* Input Area - Mobile-first design - Always visible */}
      <div className="flex-shrink-0 space-y-2">
        {isProcessing && (
          <div className="flex items-center gap-2 text-purple-600 text-sm">
            <Loader size={16} className="animate-spin" />
            Processing date...
          </div>
        )}

        <div className="flex gap-2 md:gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
            placeholder="Type date (e.g., 'tomorrow', '29 06 2026')"
            className="flex-1 border text-gray-900 border-gray-300 rounded-xl px-4 py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm md:text-base shadow-sm"
            disabled={isProcessing}
          />
          <button
            onClick={handleToggleListen}
            className={`p-3 md:p-4 rounded-xl transition shadow-md flex-shrink-0 ${
              voiceDisabled
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-60 hover:bg-gray-500'
                : isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            disabled={isProcessing && !voiceDisabled}
            title={
              voiceDisabled
                ? 'Click to retry voice input'
                : isListening
                ? 'Stop listening'
                : 'Start listening'
            }
          >
            {isListening ? <MicOff size={20} className="md:w-5 md:h-5" /> : <Mic size={20} className="md:w-5 md:h-5" />}
          </button>
          <button
            onClick={handleTextSubmit}
            disabled={!inputText.trim() || isProcessing}
            className="bg-purple-600 hover:bg-purple-700 text-white p-3 md:p-4 rounded-xl transition disabled:opacity-50 shadow-md flex-shrink-0"
          >
            <Send size={20} className="md:w-5 md:h-5" />
          </button>
        </div>

        <p className="text-xs md:text-sm text-gray-500 text-center">
          💡 Say or type: "tomorrow", "next week", "29 06 2026", or any date format
        </p>
      </div>
    </div>
  );
}
