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
  const [language, setLanguage] = useState('en-IN'); // Add language state
  
  // Track which field we're currently asking for
  const [currentProductData, setCurrentProductData] = useState<PendingProduct>({
    name: '',
    quantity: '',
    unit: '',
    expiryDate: '',
  });
  const [currentField, setCurrentField] = useState<'count' | 'name' | 'quantity' | 'unit' | 'expiry' | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);
  const shouldAutoRestartRef = useRef(false);

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
    recognitionRef.current.lang = language; // Use dynamic language state

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      // Auto-restart recognition if we're waiting for input
      if (shouldAutoRestartRef.current && !voiceDisabled) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.log('Already started or error restarting:', e);
          }
        }, 300);
      }
    };

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Only process when we have a final transcript
      if (finalTranscript.trim()) {
        handleUserInput(finalTranscript.trim());
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
          addAIMessage(getMessage('networkRetry', { delay: delayMs / 1000 }));
          
          retryTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && !voiceDisabled) {
              recognitionRef.current.start();
            }
          }, delayMs);
        } else {
          // Give up on voice, switch to text mode
          setVoiceDisabled(true);
          setNetworkErrorCount(0);
          addAIMessage(getMessage('voiceDisabled'));
        }
      } else if (event.error === 'no-speech') {
        addAIMessage(getMessage('noSpeech'));
      } else if (event.error === 'audio-capture') {
        addAIMessage(getMessage('micNotAvailable'));
      } else {
        addAIMessage(getMessage('error', { error: event.error }));
      }
    };
  }, [language]);

  // Start conversation
  useEffect(() => {
    if (conversation.length === 0 && !initializedRef.current) {
      initializedRef.current = true;
      startConversation();
    }
  }, []);

  // Reset conversation when language changes
  useEffect(() => {
    if (initializedRef.current) {
      setConversation([]);
      setProducts([]);
      setCurrentProductIndex(0);
      setTotalProducts(0);
      setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });
      setCurrentField(null);
      initializedRef.current = false;
      // Restart conversation in new language
      setTimeout(() => {
        initializedRef.current = false;
        setConversation([]);
        startConversation();
      }, 100);
    }
  }, [language]);

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

  // Translation helper
  const getMessage = (key: string, params?: Record<string, any>): string => {
    const messages: Record<string, Record<string, string>> = {
      en: {
        greeting: "Hello! I'll help you add products to your inventory. How many products would you like to add today?",
        perfect: `Perfect! I'll help you add ${params?.count} products. Let's start with product 1. What is the product name?`,
        countError: "I didn't catch that. Please tell me how many products (e.g., 'I have 3 products' or just '3')",
        nameConfirm: `Got it - ${params?.name}. What's the quantity? (e.g., '2' or '500')`,
        quantityQuestion: `${params?.qty} what? (e.g., 'kg', 'liters', 'packets', 'boxes')`,
        quantityError: `I didn't get that. Please tell me the quantity as a number (e.g., '2' for 2 kg)`,
        unitQuestion: `Great! Now, what's the expiry date? (e.g., '29 06 2026' or 'December 25')`,
        productAdded: `✓ Added ${params?.qty} ${params?.unit} of ${params?.name} expiring on ${params?.expiry}. Say "next" or "confirm" to add the next product, or "done" if finished.`,
        nextProduct: `Great! Now let's add product ${params?.nextIndex}. What is the product name?`,
        allAdded: "Perfect! All products have been added. Submitting your inventory...",
        invalidCommand: "Please say 'next' or 'confirm' to add another product, or 'done' if you're finished.",
        networkRetry: `Network issue. Retrying in ${params?.delay} seconds...`,
        noSpeech: "No speech detected. Please try again.",
        micNotAvailable: "Microphone not available. Please check permissions.",
        error: `Error: ${params?.error}. Please try typing instead.`,
        voiceDisabled: "⌨️ Voice input is having trouble connecting. Switching to text mode. Please type instead (you can still use the mic button if you want to retry).",
      },
      hi: {
        greeting: "नमस्ते! मैं आपको आपके इन्वेंटरी में प्रोडक्ट जोड़ने में मदद करूंगा। आप आज कितने प्रोडक्ट जोड़ना चाहते हैं?",
        perfect: `बहुत अच्छा! मैं आपको ${params?.count} प्रोडक्ट जोड़ने में मदद करूंगा। आइए प्रोडक्ट 1 से शुरू करते हैं। प्रोडक्ट का नाम क्या है?`,
        countError: "मुझे समझ नहीं आया। कृपया बताएं कि आप कितने प्रोडक्ट जोड़ना चाहते हैं (जैसे 'मेरे पास 3 प्रोडक्ट हैं' या बस '3')",
        nameConfirm: `ठीक है - ${params?.name}। मात्रा क्या है? (जैसे '2' या '500')`,
        quantityQuestion: `${params?.qty} क्या? (जैसे 'किलो', 'लीटर', 'पैकेट', 'डिब्बे')`,
        quantityError: `मुझे समझ नहीं आया। कृपया मात्रा बताएं (जैसे '2' किलो के लिए)`,
        unitQuestion: `शानदार! अब एक्सपायरी तारीख क्या है? (जैसे '29 06 2026' या 'दिसंबर 25')`,
        productAdded: `✓ ${params?.qty} ${params?.unit} ${params?.name} जोड़ा गया, एक्सपायरी ${params?.expiry} को है। "अगला" या "पुष्टि" कहें अगला प्रोडक्ट जोड़ने के लिए, या "हो गया" अगर समाप्त।`,
        nextProduct: `शानदार! अब प्रोडक्ट ${params?.nextIndex} जोड़ते हैं। प्रोडक्ट का नाम क्या है?`,
        allAdded: "बहुत अच्छा! सभी प्रोडक्ट जोड़ दिए गए हैं। आपकी इन्वेंटरी सबमिट की जा रही है...",
        invalidCommand: "'अगला' या 'पुष्टि' कहें अगला प्रोडक्ट जोड़ने के लिए, या 'हो गया' अगर आप पूरा कर चुके हैं।",
        networkRetry: `नेटवर्क समस्या। ${params?.delay} सेकंड में दोबारा कोशिश की जा रही है...`,
        noSpeech: "कोई आवाज़ नहीं सुनाई दी। कृपया दोबारा कोशिश करें।",
        micNotAvailable: "माइक्रोफोन उपलब्ध नहीं है। कृपया अनुमतियां जांचें।",
        error: `त्रुटि: ${params?.error}। कृपया टाइप करने की कोशिश करें।`,
        voiceDisabled: "⌨️ वॉयस इनपुट में समस्या आ रही है। टेक्स्ट मोड में स्विच किया जा रहा है। कृपया टाइप करें (आप माइक बटन से दोबारा कोशिश कर सकते हैं)।",
      },
    };

    const lang = language === 'hi-IN' ? 'hi' : 'en';
    return messages[lang]?.[key] || messages.en[key] || '';
  };

  const startConversation = () => {
    const greeting = getMessage('greeting');
    addAIMessage(greeting);
    setCurrentField('count');
    // User will manually start listening by clicking the mic button
  };

  const handleUserInput = async (text: string) => {
    if (!text.trim()) return;

    addUserMessage(text);
    setIsProcessing(true);

    try {
      // STEP 1: Get total product count
      if (currentField === 'count') {
        const count = extractNumberFromText(text);
        if (count > 0) {
          setTotalProducts(count);
          setCurrentProductIndex(1);
          setCurrentField('name');
          setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });
          addAIMessage(getMessage('perfect', { count }));
        } else {
          addAIMessage(getMessage('countError'));
        }
      }
      // STEP 2: Get product name
      else if (currentField === 'name') {
        // Just use the text as product name
        setCurrentProductData(prev => ({ ...prev, name: text.trim() }));
        setCurrentField('quantity');
        addAIMessage(getMessage('nameConfirm', { name: text.trim() }));
      }
      // STEP 3: Get quantity
      else if (currentField === 'quantity') {
        const qty = text.match(/\d+/)?.[0];
        if (qty) {
          setCurrentProductData(prev => ({ ...prev, quantity: qty }));
          setCurrentField('unit');
          addAIMessage(getMessage('quantityQuestion', { qty }));
        } else {
          addAIMessage(getMessage('quantityError'));
        }
      }
      // STEP 4: Get unit
      else if (currentField === 'unit') {
        const units = ['kg', 'g', 'liter', 'liters', 'ml', 'pieces', 'boxes', 'packets', 'bottles', 'cans', 'cartons'];
        const detectedUnit = units.find(u => text.toLowerCase().includes(u)) || text.trim();
        setCurrentProductData(prev => ({ ...prev, unit: detectedUnit }));
        setCurrentField('expiry');
        addAIMessage(getMessage('unitQuestion'));
      }
      // STEP 5: Get expiry date
      else if (currentField === 'expiry') {
        // Parse the expiry date
        const extractedData = await extractProductDetailsFromSpeech(text);
        const expiryDate = extractedData.expiryDate || text.trim();
        
        const completedProduct: PendingProduct = {
          ...currentProductData,
          expiryDate,
        };

        setProducts(prev => [...prev, completedProduct]);
        addAIMessage(
          getMessage('productAdded', {
            qty: completedProduct.quantity,
            unit: completedProduct.unit,
            name: completedProduct.name,
            expiry: expiryDate,
          })
        );
        
        // CRITICAL FIX: Set currentField to null so we can handle next/confirm/done
        setCurrentField(null);
        
        // Reset for next product
        setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });
      }
      // STEP 6: Handle next/confirm/done commands when waiting for confirmation
      else if (currentField === null && products.length > 0) {
        const lowerText = text.toLowerCase().trim();
        const isNext = lowerText.includes('next') || lowerText.includes('confirm') || lowerText.includes('अगला') || lowerText.includes('पुष्टि');
        const isDone = lowerText.includes('done') || lowerText.includes('हो गया') || lowerText.includes('तैयार');
        
        if (isNext) {
          // Move to next product
          if (currentProductIndex < totalProducts) {
            const nextIndex = currentProductIndex + 1;
            setCurrentProductIndex(nextIndex);
            setCurrentField('name');
            setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });
            addAIMessage(getMessage('nextProduct', { nextIndex }));
          } else {
            // All products added
            addAIMessage(getMessage('allAdded'));
            setCurrentField(null);
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
        } else if (isDone) {
          // User finished adding products
          addAIMessage(getMessage('allAdded'));
          setCurrentField(null);
          onProductsAdded(
            products.map(p => ({
              name: p.name,
              quantity: parseFloat(p.quantity),
              unit: p.unit,
              expiryDate: p.expiryDate,
            }))
          );
          setTimeout(() => onClose(), 2000);
        } else {
          addAIMessage(getMessage('invalidCommand'));
        }
      }
    } catch (error) {
      console.error('Error processing input:', error);
      addAIMessage(getMessage('error', { error: String(error) }));
    } finally {
      setIsProcessing(false);
    }
  };



  const toggleListening = () => {
    if (isListening) {
      shouldAutoRestartRef.current = false;
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
      
      // Enable auto-restart when user starts listening
      shouldAutoRestartRef.current = true;
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
      // Set language for speech synthesis
      utterance.lang = language === 'hi-IN' ? 'hi-IN' : 'en-IN';
      
      // For Hindi, try to find a Hindi voice
      if (language === 'hi-IN') {
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(voice => 
          voice.lang.includes('hi') || voice.name.toLowerCase().includes('hindi')
        );
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        } else {
          // Fallback: use Google Translate TTS API for Hindi
          speakViaGoogle(text, 'hi');
          return;
        }
      }
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const speakViaGoogle = async (text: string, lang: string) => {
    try {
      // Google Translate TTS endpoint
      const encodedText = encodeURIComponent(text);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;
      
      const audio = new Audio(audioUrl);
      audio.play().catch(err => console.log('Google TTS play error:', err));
    } catch (error) {
      console.log('Google TTS fallback failed, using system TTS');
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
          <div className="flex gap-2 items-center">
            {/* Language Toggle */}
            <div className="flex gap-2 bg-white bg-opacity-20 p-1 rounded-lg">
              <button
                onClick={() => {
                  setLanguage('en-IN');
                  setConversation([]);
                  initializedRef.current = false;
                  startConversation();
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  language === 'en-IN'
                    ? 'bg-white text-purple-600'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                English
              </button>
              <button
                onClick={() => {
                  setLanguage('hi-IN');
                  setConversation([]);
                  initializedRef.current = false;
                  startConversation();
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  language === 'hi-IN'
                    ? 'bg-white text-purple-600'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                हिंदी
              </button>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
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

// Helper function to extract numbers from text (handles both digits and words)
function extractNumberFromText(text: string): number {
  // First try to match digits
  const digitMatch = text.match(/\b(\d+)\b/);
  if (digitMatch) {
    return parseInt(digitMatch[1], 10);
  }

  // Map of word numbers to digits (English)
  const wordNumbers: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  };

  // Hindi number words
  const hindiNumbers: Record<string, number> = {
    'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5,
    'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
    'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
    'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  };

  // Convert to lowercase for English word matching
  const lowerText = text.toLowerCase();
  for (const [word, num] of Object.entries(wordNumbers)) {
    if (lowerText.includes(word)) {
      return num;
    }
  }

  // Check for Hindi word numbers (no case conversion needed)
  for (const [word, num] of Object.entries(hindiNumbers)) {
    if (text.includes(word)) {
      return num;
    }
  }

  return 0;
}
