// Test file to debug Gemini intent detection
// Run this in browser console to see what Gemini returns

async function testGeminiIntent(query) {
  const apiKey = 'YOUR_GEMINI_API_KEY'; // Replace with actual key
  
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

User query: "${query}"

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

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    console.log('Raw Gemini Response:', text);
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    const result = JSON.parse(jsonStr);
    
    console.log('Parsed Intent:', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test with the problematic query
testGeminiIntent("what's expiring soon");
