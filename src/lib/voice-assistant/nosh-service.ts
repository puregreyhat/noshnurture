/**
 * Hey Nosh - AI Voice Assistant Service
 * Uses Gemini for intent detection and natural language processing
 */

// Simple in-memory cache for intent detection (prevents redundant API calls)
const intentCache = new Map<string, { result: VoiceIntent; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

interface VoiceIntent {
  intent: 'get_expiring_items' | 'get_makeable_recipes' | 'get_cuisine_recipes' | 'get_inventory' | 'smalltalk' | 'unknown';
  parameters: {
    cuisine?: string;
    timeframe?: string;
    days?: number;
    other?: string;
  };
  confidence: number;
}

/**
 * Detect intent from user's voice query using Gemini (with caching and fallback)
 */
export async function detectIntent(userQuery: string): Promise<VoiceIntent> {
  // 1. Check cache first
  const cacheKey = userQuery.toLowerCase().trim();
  const cached = intentCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('🔄 Using cached intent for:', userQuery);
    return cached.result;
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Gemini API key not configured');
    throw new Error('Gemini API key not configured');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are "Nosh", the AI voice assistant for NoshNurture food management app.

Analyze the user's query and detect their intent. Respond ONLY with valid JSON in this exact format:

{
  "intent": "<one of: get_expiring_items|get_makeable_recipes|get_cuisine_recipes|get_inventory|smalltalk>",
  "parameters": {
    "cuisine": "<if asking about cuisine-based recipes, e.g., Indian, Italian, Chinese>",
    "timeframe": "<if asking about time-based expiry: today, tomorrow, this week>",
    "days": <number of days if asking about expiry within X days>,
    "other": "<any other relevant context>"
  },
  "confidence": <0.0 to 1.0>
}

Intent definitions and examples:

get_expiring_items: User asks about items expiring soon, expired, or expiry status
  Examples: "What items are expiring soon?", "What's expiring?", "Do I have anything going bad?", "What should I use quickly?", "Items expiring soon?"

get_makeable_recipes: User asks what they can cook, make, or prepare with current inventory
  Examples: "What can I make?", "What recipes can I make?", "What should I cook?", "What should I prepare?", "What can I cook today?"

get_cuisine_recipes: User asks for specific cuisine recipes (Indian, Italian, Chinese, etc.)
  Examples: "Show me Indian recipes", "What Indian food can I make?", "Give me Italian recipes", "Thai dishes?"

get_inventory: User asks what items they have, inventory status, or stock
  Examples: "What's in my inventory?", "What items do I have?", "Show my inventory", "What's in my kitchen?"

smalltalk: General greetings, thanks, or casual conversation
  Examples: "Hi", "Hello", "Thanks", "How are you?", "Good morning"

User query: "${userQuery}"

IMPORTANT:
- If the query clearly matches one of the main intents (expiring, makeable recipes, cuisine, inventory), set confidence to 0.9+
- If it's partially related or needs clarification, set confidence to 0.6-0.8
- Only set confidence below 0.5 if the query is truly ambiguous or off-topic
- Always pick the best matching intent, never return "unknown"
- For queries like "what can I make" → get_makeable_recipes with high confidence (0.95)
- For queries like "what's expiring" → get_expiring_items with high confidence (0.95)

Respond with ONLY the JSON object, no other text.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      if (response.status === 429) {
        console.warn('Rate limited by Gemini API, using keyword fallback');
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    console.log('Gemini raw response:', text.substring(0, 100));
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    
    const result = JSON.parse(jsonStr) as VoiceIntent;
    
    // Ensure confidence is a number and within valid range
    if (typeof result.confidence !== 'number') {
      result.confidence = Number(result.confidence) || 0.5;
    }
    result.confidence = Math.max(0, Math.min(1, result.confidence));
    
    // Log for debugging
    console.log('Intent detected from Gemini:', {
      query: userQuery,
      intent: result.intent,
      confidence: result.confidence,
      parameters: result.parameters,
    });
    
    // Cache the result
    intentCache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;

  } catch (error) {
    console.error('Intent detection error:', error);
    console.log('Using keyword-based fallback for:', userQuery);
    
    // Fallback: Use keyword matching for common patterns
    const queryLower = userQuery.toLowerCase();
    
    if (queryLower.includes('expir') || queryLower.includes('bad') || queryLower.includes('spoil') || queryLower.includes('soon')) {
      const result = {
        intent: 'get_expiring_items' as const,
        parameters: { days: 7 },
        confidence: 0.85,
      };
      intentCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
    
    if (queryLower.includes('make') || queryLower.includes('cook') || queryLower.includes('prepare') || queryLower.includes('recipe')) {
      if (queryLower.includes('indian') || queryLower.includes('italian') || queryLower.includes('chinese') || queryLower.includes('thai') || queryLower.includes('mexican')) {
        const cuisineMatch = queryLower.match(/(indian|italian|chinese|thai|mexican|french)/);
        const result = {
          intent: 'get_cuisine_recipes' as const,
          parameters: { cuisine: cuisineMatch ? cuisineMatch[1] : '' },
          confidence: 0.85,
        };
        intentCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }
      const result = {
        intent: 'get_makeable_recipes' as const,
        parameters: {},
        confidence: 0.85,
      };
      intentCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
    
    if (queryLower.includes('inventory') || queryLower.includes('have') || queryLower.includes('items') || queryLower.includes('stock')) {
      const result = {
        intent: 'get_inventory' as const,
        parameters: {},
        confidence: 0.85,
      };
      intentCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
    
    if (queryLower.includes('hi') || queryLower.includes('hello') || queryLower.includes('hey') || queryLower.includes('thanks') || queryLower.includes('thank')) {
      const result = {
        intent: 'smalltalk' as const,
        parameters: {},
        confidence: 0.85,
      };
      intentCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
    
    const result = {
      intent: 'unknown' as const,
      parameters: {},
      confidence: 0,
    };
    return result;
  }
}

/**
 * Generate natural language response
 */
export function generateResponse(
  intent: VoiceIntent,
  data: any
): string {
  switch (intent.intent) {
    case 'get_expiring_items':
      if (!data || data.length === 0) {
        return "Good news! You don't have any items expiring soon. Your inventory is looking fresh! 🎉";
      }
      const count = data.length;
      const itemNames = data.slice(0, 3).map((item: any) => item.product_name).join(', ');
      return `You have ${count} item${count > 1 ? 's' : ''} expiring soon: ${itemNames}${count > 3 ? ', and more' : ''}. Check your inventory to use them before they expire!`;

    case 'get_makeable_recipes':
      if (!data || data.length === 0) {
        return "Hmm, I couldn't find recipes with your current ingredients. Try adding more items to your inventory!";
      }
      const recipeCount = Math.min(data.length, 3);
      const recipeNames = data.slice(0, 3).map((r: any) => r.title).join(', ');
      return `You can make ${recipeCount} recipe${recipeCount > 1 ? 's' : ''}: ${recipeNames}. Would you like to try one?`;

    case 'get_cuisine_recipes':
      const cuisine = intent.parameters.cuisine || 'your favorite';
      if (!data || data.length === 0) {
        return `I don't have any ${cuisine} recipes that match your inventory right now. Try a different cuisine or add more ingredients!`;
      }
      const cuisineRecipes = data.slice(0, 3).map((r: any) => r.title).join(', ');
      return `Here are some ${cuisine} recipes you can make: ${cuisineRecipes}. Sounds delicious!`;

    case 'get_inventory':
      if (!data || data.length === 0) {
        return "Your inventory is currently empty. Start by scanning groceries or adding items manually!";
      }
      const inventoryCount = data.length;
      const categories = [...new Set(data.slice(0, 5).map((item: any) => item.category))].join(', ');
      return `You have ${inventoryCount} items in your inventory, including ${categories}. Looking good!`;

    case 'smalltalk':
      const greetings = [
        "Hey there! I'm Nosh, your kitchen buddy. How can I help you today?",
        "Hi! Ready to make some delicious meals? Ask me anything about your inventory!",
        "Hello! I'm here to help you manage your food and find great recipes. What would you like to know?",
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];

    case 'unknown':
    default:
      return "I didn't catch that. You can ask me about expiring items, recipes you can make, your inventory, or cuisine-specific recipes. What would you like to know?";
  }
}

/**
 * Speak text using browser TTS
 */
export function speakText(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not available');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Use a pleasant voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Female')
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
}
