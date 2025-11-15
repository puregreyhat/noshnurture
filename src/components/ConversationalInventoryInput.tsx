'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Loader } from 'lucide-react';
import { extractProductDetailsFromSpeech } from '@/lib/gemini-service';

interface ConversationMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface PendingProduct {
  name: string;
  quantity: string;
  expiryDate: string;
  unit: string;
}

interface ConversationalInventoryInputProps {
  onProductsAdded: (products: Array<{
    name: string;
    quantity: number;
    unit: string;
    expiryDate: string;
  }>) => void;
  onClose: () => void;
}

export default function ConversationalInventoryInput({
  onProductsAdded,
  onClose,
}: ConversationalInventoryInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [networkErrorCount, setNetworkErrorCount] = useState(0);
  const [voiceDisabled, setVoiceDisabled] = useState(false);
  const [useVoiceMode, setUseVoiceMode] = useState(false); // Start in text mode
  const recognitionRef = useRef<any>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addAIMessage("Sorry, voice input is not supported in your browser.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-IN';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          handleUserInput(transcript);
        } else {
          interimTranscript += transcript;
        }
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
            '⌨️ Voice input is having trouble connecting. Switching to text mode. Please type instead (you can still use the mic button if you want to retry).'
          );
        }
      } else if (event.error === 'no-speech') {
        addAIMessage('No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        addAIMessage('Microphone not available. Please check permissions.');
      } else {
        addAIMessage(`Error: ${event.error}. Please try typing instead.`);
      }
    };
  }, []);

  // Start conversation
  useEffect(() => {
    if (conversation.length === 0 && !initializedRef.current) {
      initializedRef.current = true;
      startConversation();
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

  const addUserMessage = (text: string) => {
    const newMessage: ConversationMessage = {
      type: 'user',
      content: text,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, newMessage]);
  };

  const addAIMessage = (text: string) => {
    const newMessage: ConversationMessage = {
      type: 'ai',
      content: text,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, newMessage]);
    speakText(text);
  };

  const startConversation = () => {
    const greeting = "Hello! I'll help you add products to your inventory. How many products would you like to add today?";
    addAIMessage(greeting);
  };

  const handleUserInput = async (text: string) => {
    if (!text.trim()) return;

    addUserMessage(text);
    setIsProcessing(true);

    try {
      // If we haven't received total products count yet
      if (totalProducts === 0) {
        const count = extractNumberFromText(text);
        if (count > 0) {
          setTotalProducts(count);
          setCurrentProductIndex(1);
          addAIMessage(
            `Perfect! I'll help you add ${count} products. Let's start with product 1. What is the first product name?`
          );
        } else {
          addAIMessage("I didn't catch that. Please tell me how many products you want to add (e.g., 'I have 10 products')");
        }
      }
      // If we're in the product collection phase
      else if (currentProductIndex <= totalProducts) {
        const extractedData = await extractProductDetailsFromSpeech(text);

        if (extractedData.productName || extractedData.quantity || extractedData.expiryDate) {
          // We have partial or complete product data
          const pendingProduct: PendingProduct = {
            name: extractedData.productName || 'Unknown Product',
            quantity: extractedData.quantity || '0',
            unit: extractedData.unit || 'kg',
            expiryDate: extractedData.expiryDate || '',
          };

          // Ask for missing information
          if (!extractedData.productName) {
            addAIMessage(`I heard: "${text}". Is this the product name?`);
          } else if (!extractedData.quantity) {
            addAIMessage(`Got it - ${extractedData.productName}. What's the quantity and unit? (e.g., '1 kg')`);
          } else if (!extractedData.expiryDate) {
            addAIMessage(`${extractedData.productName}, ${extractedData.quantity} ${extractedData.unit}. What's the expiry date? (e.g., '29 06 2026')`);
          } else {
            // We have all information, confirm
            setProducts(prev => [...prev, pendingProduct]);
            addAIMessage(
              `✓ Added ${pendingProduct.quantity} ${pendingProduct.unit} of ${pendingProduct.name} expiring on ${pendingProduct.expiryDate}. Confirm?`
            );
          }
        } else {
          addAIMessage("I didn't quite catch that. Please repeat the product details clearly.");
        }
      }
    } catch (error) {
      console.error('Error processing input:', error);
      addAIMessage('Error processing your input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmProduct = () => {
    if (currentProductIndex < totalProducts) {
      setCurrentProductIndex(prev => prev + 1);
      addAIMessage(`Great! Now let's add product ${currentProductIndex + 1}. What is it?`);
    } else {
      // All products added
      addAIMessage('Perfect! All products have been added. Submitting your inventory...');
      onProductsAdded(
        products.map(p => ({
          name: p.name,
          quantity: parseFloat(p.quantity),
          unit: p.unit,
          expiryDate: p.expiryDate,
        }))
      );
      setTimeout(() => onClose(), 2000);
    }
  };

  const handleRejectAndRetry = () => {
    const lastProduct = products.pop();
    setProducts([...products]);
    addAIMessage("No problem. Let's try again. Please tell me the product details.");
  };

  const toggleListening = () => {
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
      handleUserInput(inputText);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Multi-Product Voice Input</h2>
            {totalProducts > 0 && (
              <p className="text-sm opacity-90">
                Product {currentProductIndex} of {totalProducts}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {conversation.map((msg, idx) => (
            <div key={idx} className={`mb-4 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-gray-300 text-black rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span className="text-xs opacity-70">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white p-4 rounded-b-lg space-y-3">
          {/* Status */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-purple-600 text-sm">
              <Loader size={16} className="animate-spin" />
              Processing...
            </div>
          )}

          {/* Action Buttons - Show when waiting for confirmation */}
          {products.length > 0 && currentProductIndex <= totalProducts && conversation[conversation.length - 1]?.type === 'ai' && conversation[conversation.length - 1]?.content.includes('Confirm?') && (
            <div className="flex gap-2">
              <button
                onClick={handleConfirmProduct}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                ✓ Confirm
              </button>
              <button
                onClick={handleRejectAndRetry}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                ✗ Retry
              </button>
            </div>
          )}

          {/* Voice + Text Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="Type your response here..."
              className="flex-1 border text-gray-900 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
              disabled={isProcessing}
            />
            <button
              onClick={toggleListening}
              className={`p-3 rounded-lg transition ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : voiceDisabled
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
              title={
                voiceDisabled
                  ? 'Voice unavailable - click to retry'
                  : isListening
                  ? 'Stop listening'
                  : 'Start listening'
              }
              disabled={isProcessing}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button
              onClick={handleTextSubmit}
              className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-lg transition disabled:opacity-50"
              disabled={!inputText.trim() || isProcessing}
            >
              <Send size={20} />
            </button>
          </div>

          {/* Tips */}
          <p className="text-xs text-gray-500 text-center">
            💡 Say or type: "I have 10 products" to start, then provide product details
          </p>
          {voiceDisabled && (
            <p className="text-xs text-amber-600 text-center bg-amber-50 p-2 rounded">
              ⚠️ Voice input disabled due to network issues. You can type instead or click the mic button to retry.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to extract numbers from text
function extractNumberFromText(text: string): number {
  const numberMatch = text.match(/(\d+)/);
  return numberMatch ? parseInt(numberMatch[1], 10) : 0;
}
