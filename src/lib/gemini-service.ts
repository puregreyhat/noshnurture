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

interface BillProduct {
  productName: string;
  quantity: string;
  unit: string;
  size: string;
  price?: string;
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
2. **Product Name** (IMPORTANT: Extract the COMPLETE product name including BRAND NAME + PRODUCT TYPE. Examples: "Fabsta Corn Flakes", "Good Day Biscuits", "Maggi Noodles". Do NOT extract just one word - find the main brand/product combination visible on the front label)
3. **Batch/Lot Number** (Look for: "Batch", "Lot", "B/C")
4. **Manufacturing Date** (Look for: "Mfg Date", "Manufactured On", "Date of Mfg", "MFD")

Important formatting rules:
- For dates: Convert to DD-MM-YYYY format
- If only month/year is visible, assume the last day of that month
- For Indian packaging: Look for "Exp" followed by date
- Common patterns: 01/06/2025, 01-06-2025, June 2025, 06/2025
- For product names: Capture the full visible name (brand + category), not just the first word

Return ONLY a JSON object with this exact structure:
{
  "expiryDate": "DD-MM-YYYY or null if not found",
  "productName": "full brand + product name",
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
      const errorText = await response.text();
      let errorMessage = `Gemini API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
          errorMessage += ` - ${errorJson.error.message}`;
        } else {
          errorMessage += ` - ${errorText}`;
        }
      } catch (e) {
        errorMessage += ` - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No response from Gemini API');
    }

    const parsedResult = parseJsonFromContent(content);

    // Helper function to parse date string to Date object
    const parseDate = (dateStr: string | null): Date | null => {
      if (!dateStr) return null;
      // Handle DD-MM-YYYY format
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        return new Date(year, month - 1, day);
      }
      return null;
    };

    // Get both dates
    let expiryDate = parsedResult.expiryDate;
    const mfgDate = parsedResult.manufacturingDate;

    // If we have both dates, use the larger one as expiry date
    if (expiryDate && mfgDate) {
      const expDate = parseDate(expiryDate);
      const mfDate = parseDate(mfgDate);

      if (expDate && mfDate) {
        // If mfg date is larger, it might actually be the expiry date
        // Expiry should always be after manufacturing
        if (mfDate > expDate) {
          expiryDate = mfgDate;
          // Move what was detected as expiry to manufacturing
          parsedResult.manufacturingDate = parsedResult.expiryDate;
        }
      }
    }

    return {
      expiryDate: expiryDate,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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

If the user does NOT mention any expiry and the item is fresh produce (vegetable, fruit, herb, grain) set "expiryDate": null.

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
If no date given and expiryDate is null, that's acceptable for produce.
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

    const parsedResult = parseJsonFromContent(content);

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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

    return parseJsonFromContent(content);
  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    return [];
  }
}

/**
 * Extract product details from conversational speech input
 * Used for multi-turn inventory input where user speaks product name, quantity, and expiry
 */
export async function extractProductDetailsFromSpeech(
  userInput: string
): Promise<{
  productName: string | null;
  quantity: string | null;
  unit: string | null;
  expiryDate: string | null;
  confidence: number;
}> {
  try {
    const apiKey = getGeminiApiKey();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
                  text: `You are an expert at parsing natural language product inventory information spoken by users.
TODAY'S DATE IS: ${todayStr}

Analyze this user input and extract product details:
"${userInput}"

Extract the following information if present:
1. **Product Name** - The brand and product type (e.g., "Fortune Biryani Rice", "Good Day Biscuits")
2. **Quantity** - The numeric amount (e.g., "1", "5", "10")
3. **Unit** - The unit of measurement (e.g., "kg", "liter", "pieces", "boxes", "packets")
4. **Expiry Date** - The expiration date in any format (e.g., "29 06 2026", "29-06-2026", "June 2026", "a year after", "6 months from now")

Return ONLY a JSON object with this exact structure:
{
  "productName": "extracted product name or null",
  "quantity": "extracted quantity number or null",
  "unit": "extracted unit or null",
  "expiryDate": "extracted date in DD-MM-YYYY format or null",
  "confidence": 0.95,
  "notes": "any observations about the input"
}

Important rules:
- Convert dates to DD-MM-YYYY format (e.g., "29 06 2026" → "29-06-2026")
- For dates like "June 2026", use the last day of month: "30-06-2026"
- For RELATIVE dates:
  - "a year after" = add 365 days to today
  - "6 months from now" = add 6 months to today
  - "next month" = first day of next month from today
  - "in 3 months" = add 3 months to today
- Extract ONLY what is mentioned, set others to null
- Confidence: 1.0 = all fields found, 0.5 = some fields found, 0.3 = very unclear`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No response from Gemini API');
    }

    const parsedResult = parseJsonFromContent(content);

    return {
      productName: parsedResult.productName || null,
      quantity: parsedResult.quantity || null,
      unit: parsedResult.unit || null,
      expiryDate: parsedResult.expiryDate || null,
      confidence: parsedResult.confidence || 0.5,
    };
  } catch (error) {
    console.error('Error extracting product details from speech:', error);
    return {
      productName: null,
      quantity: null,
      unit: null,
      expiryDate: null,
      confidence: 0,
    };
  }
}

/**
 * Extract products from bill/receipt image or PDF
 * Used for bill upload feature - extracts all line items with quantity, size, price
 */
export async function extractProductsFromBill(
  imageBase64: string,
  fileType: 'image' | 'pdf' = 'image'
): Promise<BillProduct[]> {
  try {
    const apiKey = getGeminiApiKey();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
                  text: `You are an expert at reading bills, receipts, and invoices. Your job is to extract ONLY food and grocery items (perishable and non-perishable).

IMPORTANT: Filter out non-food items like clothing, bedsheets, books, cosmetics, electronics, etc. Extract ONLY:
- Dairy products (milk, yogurt, butter, cheese, etc.)
- Fruits and vegetables
- Grains, cereals, and flour
- Beverages (juice, tea, coffee, etc.)
- Packaged snacks and foods
- Oils, spices, and condiments
- Meat and seafood
- Bakery items

DO NOT extract: Clothing, bedsheets, books, cosmetics, electronics, household items, or any non-food products.

For each FOOD product found, extract:
1. Product Name - The full product name/description as shown on bill
2. Quantity - The numeric quantity (e.g., "1", "5", "10")
3. Unit - Unit of measurement (boxes, packets, kg, liters, pieces, etc.)
4. Size - The size/weight mentioned (e.g., "250g", "1L", "500ml"). If not mentioned, use "1"
5. Price - Price per unit if visible, else null

Important rules:
- Extract product names EXACTLY as they appear on bill (keep brand + product type)
- If bill has abbreviated names, use the full form if visible
- Quantity: Extract only the number before unit
- Size: Extract weight/volume mentioned on product line
- DO NOT merge products - if same product appears twice, list as separate rows
- Include ONLY food/grocery items, exclude everything else

Return ONLY a JSON array:
[
  {
    "productName": "exact name from bill",
    "quantity": "number",
    "unit": "boxes/packets/kg/liters/etc",
    "size": "weight or volume",
    "price": "price or null"
  }
]

Example format for Indian bills (FOOD ITEMS ONLY):
[
  {
    "productName": "Fabsta Corn Flakes",
    "quantity": "1",
    "unit": "box",
    "size": "250g",
    "price": "120"
  },
  {
    "productName": "Amul Milk",
    "quantity": "2",
    "unit": "liters",
    "size": "1L",
    "price": "60"
  }
]

If the bill contains NO food items, return an empty array: []`,
                },
                {
                  inlineData: {
                    mimeType: fileType === 'pdf' ? 'application/pdf' : 'image/jpeg',
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
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No response from Gemini API');
    }

    const products = parseJsonFromContent(content) as BillProduct[];
    return products;
  } catch (error) {
    console.error('Error extracting products from bill:', error);
    return [];
  }
}

/**
 * Parse natural language date input and convert to DD-MM-YYYY format
 * Supports: "tomorrow", "next week", "29 06 2026", "June 2026", etc.
 */
export async function parseNaturalLanguageDate(dateInput: string): Promise<string | null> {
  try {
    const apiKey = getGeminiApiKey();

    const today = new Date();
    const todayStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
                  text: `Convert this natural language date input to DD-MM-YYYY format.

Today's date is: ${todayStr}

User input: "${dateInput}"

Rules:
- "tomorrow" → tomorrow's date in DD-MM-YYYY
- "next week" → 7 days from today in DD-MM-YYYY
- "in 2 weeks" → 14 days from today
- "in 6 months" → 6 months from today
- "29 06 2026" → "29-06-2026"
- "June 2026" → "30-06-2026" (last day of month)
- "29-06-2026" → "29-06-2026"
- "06/29/2026" → "29-06-2026"
- Any specific date format → convert to DD-MM-YYYY

Return ONLY the date in DD-MM-YYYY format. No explanation.
Example output: "29-06-2026"

If you cannot parse the date, return "INVALID"`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!content || content === 'INVALID') {
      return null;
    }

    // Validate date format
    const dateRegex = /\d{1,2}-\d{1,2}-\d{4}/;
    if (dateRegex.test(content)) {
      return content;
    }

    return null;
  } catch (error) {
    console.error('Error parsing natural language date:', error);
    return null;
  }
}

export type { BillProduct };

/**
 * Helper to parse JSON from Gemini response
 * Handles markdown code blocks and raw JSON
 */
function parseJsonFromContent(content: string): any {
  try {
    // 1. Extract from Code Block if present
    const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) {
      content = codeBlock[1];
    }

    // 2. Find JSON object or array
    const firstBrace = content.indexOf('{');
    const firstBracket = content.indexOf('[');

    let start = -1;
    let end = -1;

    // Determine if we are looking for object or array (whichever comes first)
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = content.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = content.lastIndexOf(']');
    }

    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = content.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }

    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('JSON parsing error:', error);
    throw new Error('Could not parse Gemini response');
  }
}

