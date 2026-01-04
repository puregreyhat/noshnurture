'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Loader } from 'lucide-react';
import { extractProductDetailsFromSpeech } from '@/lib/gemini-service';
import { getDefaultExpiryDate, formatExpiryDisplay } from '@/lib/default-expiry';

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
  const handleUserInputRef = useRef<any>(null);

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
      // Recognition has ended, user can click mic again for next input
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
        console.log('Voice input received:', finalTranscript.trim());
        console.log('About to call handleUserInputRef.current, ref is:', handleUserInputRef.current ? 'SET' : 'NULL');
        // Call the handler directly using current state, not stale closure
        handleUserInputRef.current?.(finalTranscript.trim());
        console.log('Called handleUserInputRef.current');
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

  // Update the handler ref whenever state changes so recognition always calls latest version
  useEffect(() => {
    handleUserInputRef.current = handleUserInput;
  }, [currentField, totalProducts, products, language, currentProductData, isProcessing]);

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
        greeting: "Hello! How many products would you like to add today?",
        perfect: `Perfect! I'll help you add ${params?.count} products. Let's start with product 1. What is the product name?`,
        countError: "I didn't catch that. Please tell me how many products (e.g., 'I have 3 products' or just '3')",
        nameConfirm: `Got it - ${params?.name}. What's the quantity? (e.g., '2 kg' or '255 grams')`,
        quantityQuestion: `${params?.qty} what? (e.g., 'kg', 'liters', 'packets', 'boxes')`,
        quantityError: `I didn't get that. Please tell me the quantity as a number (e.g., '2' for 2 kg)`,
        unitQuestion: `Great! Now, what's the expiry date? (e.g., '29 06 2026' or 'December 25')`,
        productAdded: `✓ ${params?.name} ${params?.qty}${params?.unit} (${params?.expiry})`,
        nextProduct: `Great! Product ${params?.nextIndex}. What is the name?`,
        allAdded: "Perfect! Submitting...",
        invalidCommand: "Say 'next' or 'done'",
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
        productAdded: `✓ ${params?.name} ${params?.qty}${params?.unit} (${params?.expiry})`,
        nextProduct: `शानदार! प्रोडक्ट ${params?.nextIndex}। नाम क्या है?`,
        allAdded: "बहुत अच्छा! सबमिट किया जा रहा है...",
        invalidCommand: "'अगला' या 'हो गया' कहें",
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

    console.log('[handleUserInput] Called with text:', text, 'currentField:', currentField);
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
      // STEP 2: Get product name (and extract other details if provided)
      else if (currentField === 'name') {
        // Try to parse all product details from the input
        const parsed = parseProductDetails(text);
        console.log('[parseProductDetails] Result:', { name: parsed.name, qty: parsed.quantity, unit: parsed.unit, expiry: parsed.expiryDate });

        if (parsed.name) {
          // Store whatever we extracted
          setCurrentProductData(prev => ({
            ...prev,
            name: parsed.name || '',
            quantity: parsed.quantity || prev.quantity,
            unit: parsed.unit || prev.unit,
            expiryDate: parsed.expiryDate || prev.expiryDate,
          }));

          // If user provided quantity too, move to next step
          if (parsed.quantity) {
            // If user also provided unit, move to expiry
            if (parsed.unit) {
              console.log('[SMART PARSE] Has unit:', parsed.unit, '- checking for expiry');

              // If user also provided expiry date, complete the product!
              if (parsed.expiryDate) {
                console.log('[SMART PARSE] Has expiry:', parsed.expiryDate, '- completing product');
                // All details provided, complete product
                const completedProduct: PendingProduct = {
                  name: parsed.name || '',
                  quantity: parsed.quantity || '',
                  unit: parsed.unit || '',
                  expiryDate: parsed.expiryDate || '',
                };

                setProducts(prev => [...prev, completedProduct]);
                const normalizedQty = normalizeQuantity(completedProduct.quantity);
                const normalizedUnit = abbreviateUnit(completedProduct.unit);

                addAIMessage(
                  getMessage('productAdded', {
                    qty: normalizedQty,
                    unit: normalizedUnit,
                    name: completedProduct.name,
                    expiry: parsed.expiryDate,
                  })
                );

                setCurrentField(null);
                setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });
                // Show next/done prompt after product completed
                addAIMessage(getMessage('invalidCommand'));
              } else {
                // Have name, qty, unit - auto-calculate expiry
                console.log('[SMART PARSE] Auto-calculating expiry');

                const autoExpiry = getDefaultExpiryDate(parsed.name || '', 'refrigerator');
                const expiryDateStr = autoExpiry.toISOString().split('T')[0];
                const days = Math.ceil((autoExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                console.log('[AUTO-EXPIRY] Calculated:', expiryDateStr, 'for', parsed.name);

                const completedProduct: PendingProduct = {
                  name: parsed.name || '',
                  quantity: parsed.quantity || '',
                  unit: parsed.unit || '',
                  expiryDate: expiryDateStr,
                };

                setProducts(prev => [...prev, completedProduct]);
                const normalizedQty = normalizeQuantity(completedProduct.quantity);
                const normalizedUnit = abbreviateUnit(completedProduct.unit);

                addAIMessage(
                  getMessage('productAdded', {
                    qty: normalizedQty,
                    unit: normalizedUnit,
                    name: completedProduct.name,
                    expiry: `${expiryDateStr} (${formatExpiryDisplay(days)})`,
                  })
                );

                setCurrentField(null);
                setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });
                addAIMessage(getMessage('invalidCommand'));
              }
            } else {
              // Have name and qty - ask for unit
              console.log('[SMART PARSE] No unit provided - asking for it');
              setCurrentField('unit');
              addAIMessage(getMessage('quantityQuestion', { qty: parsed.quantity }));
            }
          } else {
            // Only have name (and maybe expiry) - ask for quantity
            console.log('[SMART PARSE] No quantity - asking for it. Expiry already stored:', parsed.expiryDate);
            setCurrentField('quantity');
            addAIMessage(getMessage('nameConfirm', { name: parsed.name }));
          }
        } else {
          // Invalid input
          addAIMessage(getMessage('countError'));
        }
      }
      // STEP 3: Get quantity
      else if (currentField === 'quantity') {
        const qty = text.match(/\d+/)?.[0];
        if (qty) {
          setCurrentProductData(prev => ({ ...prev, quantity: qty }));

          // Check if user also provided a unit in the same input
          const unitVariations = ['kilogram', 'kg', 'gram', 'g', 'liter', 'liters', 'litre', 'litres', 'ml', 'milliliter', 'millilitre',
            'piece', 'pieces', 'pcs', 'box', 'boxes', 'packet', 'packets', 'pkt', 'bottle', 'bottles', 'btl',
            'can', 'cans', 'carton', 'cartons', 'ctn'];
          const lowerText = text.toLowerCase();
          const detectedUnit = unitVariations.find(u => lowerText.includes(u));

          if (detectedUnit) {
            // User provided both quantity and unit
            console.log('[QUANTITY FIELD] Detected unit in same input:', detectedUnit);
            const updatedProduct = { ...currentProductData, quantity: qty, unit: detectedUnit };
            setCurrentProductData(updatedProduct);

            // Check if we already have expiry from name field
            if (updatedProduct.expiryDate) {
              // We have all details - complete the product!
              console.log('[QUANTITY FIELD] Already have expiry:', updatedProduct.expiryDate, '- completing product');

              const completedProduct: PendingProduct = {
                name: updatedProduct.name,
                quantity: qty,
                unit: detectedUnit,
                expiryDate: updatedProduct.expiryDate,
              };

              setProducts(prev => [...prev, completedProduct]);
              const normalizedQty = normalizeQuantity(completedProduct.quantity);
              const normalizedUnit = abbreviateUnit(completedProduct.unit);

              addAIMessage(
                getMessage('productAdded', {
                  qty: normalizedQty,
                  unit: normalizedUnit,
                  name: completedProduct.name,
                  expiry: completedProduct.expiryDate,
                })
              );

              setCurrentField(null);
              setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });
              addAIMessage(getMessage('invalidCommand'));
            } else {
              // Auto-calculate expiry instead of asking
              const autoExpiry = getDefaultExpiryDate(updatedProduct.name, 'refrigerator');
              const expiryDateStr = autoExpiry.toISOString().split('T')[0];
              const days = Math.ceil((autoExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

              const completedProduct: PendingProduct = {
                name: updatedProduct.name,
                quantity: updatedProduct.quantity,
                unit: detectedUnit,
                expiryDate: expiryDateStr,
              };

              setProducts(prev => [...prev, completedProduct]);
              const normalizedQty = normalizeQuantity(completedProduct.quantity);
              const normalizedUnit = abbreviateUnit(completedProduct.unit);

              addAIMessage(
                getMessage('productAdded', {
                  qty: normalizedQty,
                  unit: normalizedUnit,
                  name: completedProduct.name,
                  expiry: `${expiryDateStr} (${formatExpiryDisplay(days)})`,
                })
              );

              setCurrentField(null);
              setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });
              addAIMessage(getMessage('invalidCommand'));
            }
          } else {
            // Only quantity provided, ask for unit
            setCurrentField('unit');
            addAIMessage(getMessage('quantityQuestion', { qty }));
          }
        } else {
          addAIMessage(getMessage('quantityError'));
        }
      }
      // STEP 4: Get unit
      else if (currentField === 'unit') {
        const unitVariations = ['kilogram', 'kg', 'gram', 'g', 'liter', 'liters', 'litre', 'litres', 'ml', 'milliliter', 'millilitre',
          'piece', 'pieces', 'pcs', 'box', 'boxes', 'packet', 'packets', 'pkt', 'bottle', 'bottles', 'btl',
          'can', 'cans', 'carton', 'cartons', 'ctn'];
        const lowerText = text.toLowerCase();
        const detectedUnit = unitVariations.find(u => lowerText.includes(u)) || text.trim();
        console.log('[UNIT FIELD] Detected unit:', detectedUnit, 'from input:', text);

        const updatedProduct = { ...currentProductData, unit: detectedUnit };
        setCurrentProductData(updatedProduct);

        // Check if we already have an expiry from the name field parsing
        if (updatedProduct.expiryDate) {
          // We have all details - complete the product!
          console.log('[UNIT FIELD] Already have expiry:', updatedProduct.expiryDate, '- completing product');

          const completedProduct: PendingProduct = {
            name: updatedProduct.name,
            quantity: updatedProduct.quantity,
            unit: detectedUnit,
            expiryDate: updatedProduct.expiryDate,
          };

          setProducts(prev => [...prev, completedProduct]);
          const normalizedQty = normalizeQuantity(completedProduct.quantity);
          const normalizedUnit = abbreviateUnit(completedProduct.unit);

          addAIMessage(
            getMessage('productAdded', {
              qty: normalizedQty,
              unit: normalizedUnit,
              name: completedProduct.name,
              expiry: completedProduct.expiryDate,
            })
          );

          setCurrentField(null);
          setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });
          addAIMessage(getMessage('invalidCommand'));
        } else {
          // Auto-calculate expiry instead of asking
          const autoExpiry = getDefaultExpiryDate(updatedProduct.name, 'refrigerator');
          const expiryDateStr = autoExpiry.toISOString().split('T')[0];
          const days = Math.ceil((autoExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

          const completedProduct: PendingProduct = {
            name: updatedProduct.name,
            quantity: updatedProduct.quantity,
            unit: detectedUnit,
            expiryDate: expiryDateStr,
          };

          setProducts(prev => [...prev, completedProduct]);
          const normalizedQty = normalizeQuantity(completedProduct.quantity);
          const normalizedUnit = abbreviateUnit(completedProduct.unit);

          addAIMessage(
            getMessage('productAdded', {
              qty: normalizedQty,
              unit: normalizedUnit,
              name: completedProduct.name,
              expiry: `${expiryDateStr} (${formatExpiryDisplay(days)})`,
            })
          );

          setCurrentField(null);
          setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });
          addAIMessage(getMessage('invalidCommand'));
        }
      }
      // STEP 5: Get expiry date
      else if (currentField === 'expiry') {
        // Parse the expiry date
        const extractedData = await extractProductDetailsFromSpeech(text);
        let expiryDate = extractedData.expiryDate || text.trim();

        // Convert relative dates like "tomorrow" to actual dates
        expiryDate = convertRelativeDate(expiryDate);

        const completedProduct: PendingProduct = {
          ...currentProductData,
          expiryDate,
        };

        setProducts(prev => [...prev, completedProduct]);

        // Normalize quantity and unit for compact display
        const normalizedQty = normalizeQuantity(completedProduct.quantity);
        const normalizedUnit = abbreviateUnit(completedProduct.unit);

        addAIMessage(
          getMessage('productAdded', {
            qty: normalizedQty,
            unit: normalizedUnit,
            name: completedProduct.name,
            expiry: expiryDate,
          })
        );

        // CRITICAL FIX: Set currentField to null so we can handle next/confirm/done
        setCurrentField(null);

        // Reset for next product
        setCurrentProductData({ name: '', quantity: '', unit: '', expiryDate: '' });

        // Show next/done prompt
        addAIMessage(getMessage('invalidCommand'));
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
            console.log('[NEXT] Moving to product', nextIndex, '- set currentField to name');
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

  // Initialize ref with the function immediately so recognition has a valid reference
  handleUserInputRef.current = handleUserInput;

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-[#FDFBF7] rounded-none md:rounded-3xl shadow-2xl w-full max-w-3xl h-full md:h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-amber-600 text-white p-5 md:p-6 rounded-t-none md:rounded-t-3xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-white">Multi-Product Voice Input</h2>
            {totalProducts > 0 && (
              <p className="text-sm opacity-90 mt-1">
                Product {currentProductIndex} of {totalProducts}
              </p>
            )}
          </div>
          <div className="flex gap-3 items-center">
            {/* Language Toggle */}
            <div className="flex gap-2 bg-white bg-opacity-20 p-1.5 rounded-xl">
              <button
                onClick={() => {
                  setLanguage('en-IN');
                  setConversation([]);
                  initializedRef.current = false;
                  startConversation();
                }}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${language === 'en-IN'
                  ? 'bg-white text-emerald-600'
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
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${language === 'hi-IN'
                  ? 'bg-white text-emerald-600'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
              >
                हिंदी
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-stone-50">
          {conversation.map((msg, idx) => (
            <div key={idx} className={`mb-5 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-md px-5 py-3 rounded-2xl shadow-sm ${msg.type === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-sm'
                  : 'bg-white text-stone-800 rounded-bl-sm border border-stone-200'
                  }`}
              >
                <p className="text-base">{msg.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-stone-200 bg-white p-4 md:p-5 rounded-b-none md:rounded-b-3xl space-y-4">
          {/* Status */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-emerald-600 text-base font-medium">
              <Loader size={20} className="animate-spin" />
              Processing...
            </div>
          )}

          {/* Voice + Text Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="Type your response here..."
              className="flex-1 border-2 text-stone-900 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              disabled={isProcessing}
            />
            <button
              onClick={toggleListening}
              className={`p-3 rounded-2xl transition-all hover:scale-[1.05] active:scale-[0.95] ${isListening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                : voiceDisabled
                  ? 'bg-stone-400 text-white cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
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
              {isListening ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button
              onClick={handleTextSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl transition-all hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50 shadow-lg"
              disabled={!inputText.trim() || isProcessing}
            >
              <Send size={22} />
            </button>
          </div>

          {/* Tips */}
          <p className="text-sm text-stone-500 text-center">
            💡 Say or type: "I have 10 products" to start, then provide product details
          </p>
          {voiceDisabled && (
            <p className="text-sm text-amber-700 text-center bg-amber-50 p-3 rounded-2xl border border-amber-200">
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

// Convert word quantity to number (e.g., "one" -> "1", "two kilograms" -> "2")
function normalizeQuantity(qty: string): string {
  const lowerQty = qty.toLowerCase().trim();

  // Extract the number from the quantity
  const num = extractNumberFromText(lowerQty);
  if (num > 0) {
    return num.toString();
  }

  return qty;
}

// Abbreviate unit names (e.g., "kilogram" -> "kg", "liters" -> "L")
function abbreviateUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'kilogram': 'kg',
    'kg': 'kg',
    'gram': 'g',
    'g': 'g',
    'liter': 'L',
    'liters': 'L',
    'l': 'L',
    'ml': 'ml',
    'milliliter': 'ml',
    'pieces': 'pcs',
    'piece': 'pcs',
    'pcs': 'pcs',
    'boxes': 'box',
    'box': 'box',
    'packets': 'pkt',
    'packet': 'pkt',
    'pkt': 'pkt',
    'bottles': 'btl',
    'bottle': 'btl',
    'btl': 'btl',
    'cans': 'can',
    'can': 'can',
    'cartons': 'ctn',
    'carton': 'ctn',
    'ctn': 'ctn',
  };

  const normalized = unitMap[unit.toLowerCase()] || unit;
  return normalized;
}

// Convert relative date keywords to actual dates (DD-MM-YYYY format)
function convertRelativeDate(dateStr: string): string {
  const today = new Date();
  const lowerStr = dateStr.toLowerCase().trim();

  // Helper to format date as DD-MM-YYYY
  const formatDate = (date: Date) => {
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  // Month name to number mapping
  const monthMap: Record<string, number> = {
    'january': 1, 'jan': 1,
    'february': 2, 'feb': 2,
    'march': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'may': 5,
    'june': 6, 'jun': 6,
    'july': 7, 'jul': 7,
    'august': 8, 'aug': 8,
    'september': 9, 'sep': 9,
    'october': 10, 'oct': 10,
    'november': 11, 'nov': 11,
    'december': 12, 'dec': 12,
  };

  // Check "day after tomorrow" BEFORE "tomorrow" (order matters!)
  // Also check variations: "2 days", "in 2 days", "expiring in two days"
  if (lowerStr.includes('day after tomorrow') ||
    lowerStr.includes('in 2 days') ||
    lowerStr.includes('in two days') ||
    /(\b|^)(2|two)\s+days?\b/.test(lowerStr)) {
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    return formatDate(dayAfterTomorrow);
  }

  // Tomorrow variations
  if (lowerStr.includes('tomorrow') ||
    lowerStr.includes('in 1 day') ||
    lowerStr.includes('in one day') ||
    /(\b|^)(1|one)\s+day\b/.test(lowerStr)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }

  // Today variations
  if (lowerStr.includes('today') ||
    lowerStr.includes('expires now') ||
    lowerStr.includes('going bad today')) {
    return formatDate(today);
  }

  // This week (assume 7 days from now)
  if (lowerStr.includes('this week') ||
    lowerStr.includes('later this week') ||
    lowerStr.includes('sometime this week')) {
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() + 7);
    return formatDate(thisWeek);
  }

  // Next week (assume 14 days from now)
  if (lowerStr.includes('next week') ||
    lowerStr.includes('in a week') ||
    lowerStr.includes('in one week') ||
    /(\b|^)(1|one)\s+week\b/.test(lowerStr)) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 14);
    return formatDate(nextWeek);
  }

  // 3 days
  if (/(\b|^)(3|three)\s+days?\b/.test(lowerStr) || lowerStr.includes('in 3 days')) {
    const threeDays = new Date(today);
    threeDays.setDate(threeDays.getDate() + 3);
    return formatDate(threeDays);
  }

  // 4 days
  if (/(\b|^)(4|four)\s+days?\b/.test(lowerStr) || lowerStr.includes('in 4 days') || lowerStr.includes('after 4 days')) {
    const fourDays = new Date(today);
    fourDays.setDate(fourDays.getDate() + 4);
    return formatDate(fourDays);
  }

  // 5 days
  if (/(\b|^)(5|five)\s+days?\b/.test(lowerStr) || lowerStr.includes('in 5 days') || lowerStr.includes('after 5 days')) {
    const fiveDays = new Date(today);
    fiveDays.setDate(fiveDays.getDate() + 5);
    return formatDate(fiveDays);
  }

  // 6 days
  if (/(\b|^)(6|six)\s+days?\b/.test(lowerStr) || lowerStr.includes('in 6 days') || lowerStr.includes('after 6 days')) {
    const sixDays = new Date(today);
    sixDays.setDate(sixDays.getDate() + 6);
    return formatDate(sixDays);
  }

  // 7 days / 1 week
  if (/(\b|^)(7|seven)\s+days?\b/.test(lowerStr) || lowerStr.includes('in 7 days') || lowerStr.includes('after 7 days')) {
    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);
    return formatDate(sevenDays);
  }

  // 90 days / 3 months
  if (lowerStr.includes('90 days') ||
    lowerStr.includes('3 months') ||
    lowerStr.includes('three months') ||
    lowerStr.includes('in 3 months')) {
    const threeMonths = new Date(today);
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return formatDate(threeMonths);
  }

  // Next month variations
  if (lowerStr.includes('next month') ||
    lowerStr.includes('in a month') ||
    lowerStr.includes('in one month') ||
    lowerStr.includes('month from now') ||
    lowerStr.includes('valid until next month') ||
    /(\b|^)(1|one)\s+month\b/.test(lowerStr)) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return formatDate(nextMonth);
  }

  // Next year variations
  if (lowerStr.includes('next year') ||
    lowerStr.includes('in a year') ||
    lowerStr.includes('in one year') ||
    lowerStr.includes('until next year') ||
    lowerStr.includes('valid till next year') ||
    /(\b|^)(1|one)\s+year\b/.test(lowerStr)) {
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return formatDate(nextYear);
  }

  // Yesterday/past dates
  if (lowerStr.includes('yesterday') ||
    lowerStr.includes('already expired') ||
    lowerStr.includes('expired yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }

  // Last week
  if (lowerStr.includes('last week') || lowerStr.includes('expired last week')) {
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    return formatDate(lastWeek);
  }

  // A month ago
  if (lowerStr.includes('a month ago') ||
    lowerStr.includes('month ago') ||
    lowerStr.includes('expired a month ago')) {
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return formatDate(monthAgo);
  }

  // Try to parse dates with month names like "25 december 2025" or "december 25 2025"
  for (const [monthName, monthNum] of Object.entries(monthMap)) {
    if (lowerStr.includes(monthName)) {
      // Try pattern: "DD MONTHNAME YYYY"
      const pattern1 = new RegExp(`(\\d{1,2})\\s+${monthName}\\s+(\\d{4})`, 'i');
      const match1 = dateStr.match(pattern1);
      if (match1) {
        const day = String(match1[1]).padStart(2, '0');
        const month = String(monthNum).padStart(2, '0');
        const year = match1[2];
        return `${day}-${month}-${year}`;
      }

      // Try pattern: "MONTHNAME DD YYYY"
      const pattern2 = new RegExp(`${monthName}\\s+(\\d{1,2})\\s+(\\d{4})`, 'i');
      const match2 = dateStr.match(pattern2);
      if (match2) {
        const day = String(match2[1]).padStart(2, '0');
        const month = String(monthNum).padStart(2, '0');
        const year = match2[2];
        return `${day}-${month}-${year}`;
      }

      // If only month and year: "december 2025" - use last day of month
      const pattern3 = new RegExp(`${monthName}\\s+(\\d{4})`, 'i');
      const match3 = dateStr.match(pattern3);
      if (match3) {
        const year = match3[1];
        const lastDay = new Date(parseInt(year), monthNum, 0).getDate();
        const month = String(monthNum).padStart(2, '0');
        return `${String(lastDay).padStart(2, '0')}-${month}-${year}`;
      }
    }
  }

  // If already in a date format or couldn't parse, return as-is
  return dateStr;
}

// Parse complete product details from a single line
// Returns object with: name, quantity, unit, expiryDate (or null for missing fields)
function parseProductDetails(text: string): {
  name: string | null;
  quantity: string | null;
  unit: string | null;
  expiryDate: string | null;
} {
  const lowerText = text.toLowerCase();

  // Remove filler words and normalize
  const normalized = text
    .replace(/\b(umm|uh|um|like|actually|i guess|i think|maybe|probably|nearly|about|around)\b/gi, '')
    .replace(/\b(i have|i got|i bought|i purchased|there is|there are|we have)\b/gi, '')
    .replace(/\b(they will|it will|they'll|it'll|they are|it is)\b/gi, '')
    .replace(/\bexpire\b/gi, 'expires')
    .replace(/\s+/g, ' ')
    .trim();

  const lowerNormalized = normalized.toLowerCase();

  let name = '';
  let quantity = '';
  let unit = '';
  let expiryDate = '';

  // Step 1: Extract quantity with unit (e.g., "1kg", "250 grams", "2 liters", "Tomato 2kg")
  // Also handle when unit is separate: "1 kg", "2 liters", "500 ml"
  const qtyUnitMatch = normalized.match(/(\d+)\s*(kilogram|kg|gram|grams|g|liter|liters|litre|litres|ml|milliliter|millilitre|pieces|pcs|boxes|box|packets|packet|pkt|bottles|bottle|btl|cans|can|cartons|carton|ctn)\b/i);
  let qtyUnitEnd = 0;
  let qtyUnitStart = 0;

  if (qtyUnitMatch) {
    quantity = qtyUnitMatch[1];
    if (qtyUnitMatch[2]) {
      unit = qtyUnitMatch[2];
    }
    qtyUnitStart = normalized.indexOf(qtyUnitMatch[0]);
    qtyUnitEnd = qtyUnitStart + qtyUnitMatch[0].length;
  }

  // Step 2: Also look for units that might appear as separate words (after quantity or even before)
  // Search in remaining text if we have quantity but no unit yet
  if (quantity && !unit) {
    const unitKeywords = ['kilogram', 'kg', 'gram', 'grams', 'g', 'liter', 'liters', 'litre', 'litres', 'ml', 'milliliter', 'millilitre',
      'piece', 'pieces', 'pcs', 'box', 'boxes', 'packet', 'packets', 'pkt', 'bottle', 'bottles', 'btl',
      'can', 'cans', 'carton', 'cartons', 'ctn'];

    for (const keyword of unitKeywords) {
      if (lowerNormalized.includes(keyword)) {
        unit = keyword;
        // Update qtyUnitEnd to include this unit in position tracking
        const unitIndex = lowerNormalized.indexOf(keyword);
        qtyUnitEnd = Math.max(qtyUnitEnd, unitIndex + keyword.length);
        break;
      }
    }
  }

  // Step 3: Extract date info (look for expiry keywords and dates)
  const expiryKeywords = [
    'day after tomorrow', 'in 2 days', 'in two days', 'two days', '2 days', 'after 2 days',
    'tomorrow', 'in 1 day', 'in one day',
    'today', 'expires now', 'going bad today',
    'this week', 'later this week', 'sometime this week',
    'next week', 'in a week', 'in one week',
    '3 days', 'in 3 days', 'three days', 'after 3 days',
    '4 days', 'in 4 days', 'four days', 'after 4 days',
    '5 days', 'in 5 days', 'five days', 'after 5 days',
    '6 days', 'in 6 days', 'six days', 'after 6 days',
    '7 days', 'in 7 days', 'seven days', 'after 7 days',
    '90 days', '3 months', 'three months', 'in 3 months',
    'next month', 'in a month', 'in one month', 'month from now', 'valid until next month',
    'next year', 'in a year', 'in one year', 'until next year', 'valid till next year',
    'yesterday', 'already expired', 'expired yesterday',
    'last week', 'expired last week',
    'a month ago', 'month ago', 'expired a month ago',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  ];

  // Action keywords that indicate expiry information follows
  const expiryActionKeywords = ['expires', 'expiry', 'expiring', 'going bad', 'goes bad', 'valid', 'lasts', 'finishing', 'nearing expiry', 'will expire', 'expire'];

  let dateStartIndex = -1;
  let bestMatch = '';

  // First check for action keywords + relative dates (e.g., "expiring tomorrow", "will expire after 7 days")
  for (const action of expiryActionKeywords) {
    const actionIdx = lowerNormalized.indexOf(action);
    if (actionIdx !== -1) {
      // Look for a date keyword near this action keyword
      const afterAction = lowerNormalized.substring(actionIdx);
      for (const dateKeyword of expiryKeywords) {
        if (afterAction.includes(dateKeyword)) {
          const dateIdx = lowerNormalized.indexOf(dateKeyword, actionIdx);
          // Only accept if the date keyword is close to the action keyword (within 30 chars)
          if (dateIdx !== -1 && dateIdx - actionIdx < 30) {
            dateStartIndex = actionIdx;
            bestMatch = action;
            break;
          }
        }
      }
      if (dateStartIndex !== -1) break;
    }
  }

  // If no action keyword found, look for standalone date keywords
  if (dateStartIndex === -1) {
    for (const keyword of expiryKeywords) {
      const idx = lowerNormalized.indexOf(keyword);
      if (idx !== -1) {
        // Prefer matches that come after quantity/unit if we have them
        const minPosition = qtyUnitEnd > 0 ? qtyUnitEnd : 0;
        if (idx >= minPosition) {
          if (dateStartIndex === -1 || idx < dateStartIndex || keyword.length > bestMatch.length) {
            dateStartIndex = idx;
            bestMatch = keyword;
          }
        }
      }
    }
  }

  if (dateStartIndex !== -1) {
    // Extract from the keyword to the end, or until we hit punctuation/separators
    let dateEnd = normalized.length;
    const separators = [',', ';', '.', ' and ', ' but ', ' so ', '?', '!'];
    for (const sep of separators) {
      const sepIdx = normalized.indexOf(sep, dateStartIndex + bestMatch.length);
      if (sepIdx !== -1 && sepIdx < dateEnd) {
        dateEnd = sepIdx;
      }
    }
    expiryDate = normalized.substring(dateStartIndex, dateEnd).trim();
  }

  // Also check for date patterns like "12/25/2025" or "25-12-2025" or just year "2025" or "29 December"
  const datePatternMatch = normalized.match(/(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b)/i);
  if (datePatternMatch) {
    const patternIdx = normalized.indexOf(datePatternMatch[0]);
    const minPosition = qtyUnitEnd > 0 ? qtyUnitEnd : 0;
    if (patternIdx >= minPosition) {  // Only use if AFTER quantity/unit (if present)
      if (!expiryDate || datePatternMatch[0].length > expiryDate.length) {
        expiryDate = datePatternMatch[0];
        if (dateStartIndex === -1) dateStartIndex = patternIdx;
      }
    }
  }

  // Step 4: Extract name (everything before quantity or date, excluding the qty/unit itself)
  let nameEnd = normalized.length;
  let nameStart = 0;

  // If we found quantity/unit, name is everything BEFORE it
  if (qtyUnitMatch && qtyUnitStart > 0) {
    nameEnd = qtyUnitStart;
  }
  // Otherwise if we found a date, name is everything before the date
  else if (dateStartIndex !== -1 && dateStartIndex > 0) {
    nameEnd = dateStartIndex;
  }

  if (nameEnd > nameStart) {
    name = normalized.substring(nameStart, nameEnd).trim();
    // Clean up possessives and punctuation
    name = name.replace(/['']s\b/g, '').replace(/[,;.:!?]+$/g, '').trim();
  }

  // If we have quantity but name is empty or is just the qty/unit, clear the name
  if (quantity && (!name || name === text.trim())) {
    name = '';
  }

  // Convert relative dates like "tomorrow" to actual dates
  if (expiryDate) {
    expiryDate = convertRelativeDate(expiryDate);
  }

  return {
    name: name || null,
    quantity: quantity || null,
    unit: unit || null,
    expiryDate: expiryDate || null,
  };
}

