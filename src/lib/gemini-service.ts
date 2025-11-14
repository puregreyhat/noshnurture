/**
 * Gemini AI Service for OCR and Voice Processing
 * Handles image analysis and expiry date extraction
 */

interface ExpiryExtractionResult {
  expiryDate: string | null;
  confidence: number;
  productName: string | null;
  batchNumber: string | null;
  manufacturingDate: string | null;
  rawText: string;
}

interface VoiceProcessingResult {
  productName: string;
  expiryDate: string;
  quantity?: string;
  unit?: string;
  confidence: number;
}

/**
 * Initialize Gemini API with your API key
 * Store API key in environment variable: NEXT_PUBLIC_GEMINI_API_KEY
 */
const getGeminiApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables');
  }
  return apiKey;
};

/**
 * Convert image file to base64 for Gemini API
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

/**
 * Extract expiry date from product image using Gemini Vision API
 */
export async function extractExpiryFromImage(
  imageBase64: string
): Promise<ExpiryExtractionResult> {
  try {
    const apiKey = getGeminiApiKey();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert at reading product packaging and labels. 
                  
Please analyze this product image and extract the following information:
1. **Expiry Date** (Look for: "Expiry Date", "Best Before", "Use By", "Expires On", "EXP:", "EXP", "Exp.", "Validity")
2. **Product Name** (Brand and product type)
3. **Batch/Lot Number** (Look for: "Batch", "Lot", "B/C")
4. **Manufacturing Date** (Look for: "Mfg Date", "Manufactured On", "Date of Mfg", "MFD")

Important formatting rules:
- For dates: Convert to DD-MM-YYYY format
- If only month/year is visible, assume the last day of that month
- For Indian packaging: Look for "Exp" followed by date
- Common patterns: 01/06/2025, 01-06-2025, June 2025, 06/2025

Return ONLY a JSON object with this exact structure:
{
  "expiryDate": "DD-MM-YYYY or null if not found",
  "productName": "product name or null",
  "batchNumber": "batch number or null",
  "manufacturingDate": "DD-MM-YYYY or null",
  "rawText": "all visible text on the label",
  "confidence": 0.95,
  "notes": "any additional observations"
}

If you cannot read the date clearly, set confidence to a lower value (0.3-0.7).`,
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No response from Gemini API');
    }

    // Parse JSON response from Gemini
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse Gemini response');
    }

    const parsedResult = JSON.parse(jsonMatch[0]);

    return {
      expiryDate: parsedResult.expiryDate,
      confidence: parsedResult.confidence || 0.8,
      productName: parsedResult.productName,
      batchNumber: parsedResult.batchNumber,
      manufacturingDate: parsedResult.manufacturingDate,
      rawText: parsedResult.rawText,
    };
  } catch (error) {
    console.error('Error extracting expiry from image:', error);
    throw error;
  }
}

/**
 * Process voice input using Gemini API
 * Converts spoken text to structured product data
 */
export async function processVoiceInput(
  transcript: string
): Promise<VoiceProcessingResult> {
  try {
    const apiKey = getGeminiApiKey();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an assistant helping users add grocery items to their inventory via voice.

User said: "${transcript}"

Extract and structure this information:
1. **Product Name** (What item are they adding?)
2. **Expiry Date** (When does it expire? Convert to DD-MM-YYYY)
3. **Quantity** (How much? e.g., 1 liter, 500g, 2 packets)
4. **Unit** (liter, kg, g, packet, bottle, can, etc.)

Handle these cases:
- "Add milk expiring December 15" → milk, expiry: 15-12-[current year]
- "Add 500g flour expiring next month" → flour, quantity: 500, unit: g
- "Yogurt packet, valid till 10th" → yogurt, expiry: 10-[current month]-[current year]
- "2 liter butter milk valid 5 days" → buttermilk, quantity: 2, unit: liter
- Current date for reference: ${new Date().toISOString()}

Return ONLY a JSON object:
{
  "productName": "product name",
  "expiryDate": "DD-MM-YYYY",
  "quantity": number or null,
  "unit": "unit or null",
  "confidence": 0.9,
  "notes": "any clarifications"
}

If dates are relative (like "5 days from now"), calculate the actual date.
If confidence is low (user was unclear), set it to 0.5 or lower.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No response from Gemini API');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse Gemini response');
    }

    const parsedResult = JSON.parse(jsonMatch[0]);

    return {
      productName: parsedResult.productName,
      expiryDate: parsedResult.expiryDate,
      quantity: parsedResult.quantity,
      unit: parsedResult.unit,
      confidence: parsedResult.confidence || 0.8,
    };
  } catch (error) {
    console.error('Error processing voice input:', error);
    throw error;
  }
}

/**
 * Get recipe suggestions for expiring items
 */
export async function getRecipeSuggestions(
  productName: string,
  daysUntilExpiry: number
): Promise<string[]> {
  try {
    const apiKey = getGeminiApiKey();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Suggest 3-5 quick recipes or uses for ${productName} that expires in ${daysUntilExpiry} days.

Return ONLY a JSON array of recipe names and quick instructions:
[
  "Recipe Name - Quick instruction (2-3 lines)"
]

Focus on:
- Quick recipes (< 30 minutes)
- Common ingredients
- Popular in Indian/South Asian cuisine
- Practical for busy households`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return [];
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    return [];
  }
}
