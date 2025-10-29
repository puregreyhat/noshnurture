// Translation service using Google Translate API (free tier via RapidAPI)
import { Language } from './translations';

const GOOGLE_TRANSLATE_API_URL = 'https://google-translate1.p.rapidapi.com/language/translate/v2';

const LANGUAGE_CODES: Record<Language, string> = {
  'en': 'en',
  'hi': 'hi',
  'mr': 'mr',
  'ta': 'ta',
  'te': 'te',
  'kn': 'kn',
  'gu': 'gu',
  'bn': 'bn',
};

// Cache translations to avoid repeated API calls
const translationCache = new Map<string, Map<Language, string>>();

export async function translateText(
  text: string,
  targetLanguage: Language,
): Promise<string> {
  // Don't translate if already in English
  if (targetLanguage === 'en' || !text) {
    return text;
  }

  // Check cache first
  if (translationCache.has(text)) {
    const cached = translationCache.get(text);
    if (cached?.has(targetLanguage)) {
      return cached.get(targetLanguage) || text;
    }
  }

  try {
    // Use browser's built-in translation or fallback to API
    const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
    
    if (!apiKey) {
      console.warn('Translation API key not configured, returning original text');
      return text;
    }

    const response = await fetch(GOOGLE_TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'google-translate1.p.rapidapi.com',
      },
      body: new URLSearchParams({
        q: text,
        target: LANGUAGE_CODES[targetLanguage],
        source: 'en',
      }).toString(),
    });

    if (!response.ok) {
      console.error('Translation API error:', response.status);
      return text;
    }

    const data = await response.json() as {
      data?: {
        translations?: Array<{ translatedText: string }>;
      };
    };

    const translatedText = data.data?.translations?.[0]?.translatedText || text;

    // Cache the translation
    if (!translationCache.has(text)) {
      translationCache.set(text, new Map());
    }
    translationCache.get(text)!.set(targetLanguage, translatedText);

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

export async function translateRecipeInstructions(
  instructions: string,
  targetLanguage: Language,
): Promise<string> {
  if (targetLanguage === 'en' || !instructions) {
    return instructions;
  }

  // Split by steps (numbered steps typically)
  const steps = instructions.split(/(?=\d+\.)/);
  const translatedSteps = await Promise.all(
    steps.map((step) => translateText(step.trim(), targetLanguage))
  );

  return translatedSteps.join('\n');
}

export async function translateRecipeStep(
  step: string,
  targetLanguage: Language,
): Promise<string> {
  return translateText(step, targetLanguage);
}

// Batch translation for multiple items
export async function translateBatch(
  texts: string[],
  targetLanguage: Language,
): Promise<string[]> {
  return Promise.all(texts.map((text) => translateText(text, targetLanguage)));
}
