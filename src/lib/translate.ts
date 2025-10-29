// Translation service - works both locally and on production
// - Localhost: Uses Ollama (free, local)
// - Production: Uses Sarvam AI (best for Indian languages) → LibreTranslate (fallback)
import { Language } from './translations';

const LANGUAGE_CODES: Record<Language, string> = {
  'en': 'English',
  'hi': 'Hindi',
  'mr': 'Marathi',
  'ta': 'Tamil',
  'te': 'Telugu',
  'kn': 'Kannada',
  'gu': 'Gujarati',
  'bn': 'Bengali',
};

// Sarvam AI language codes (optimized for Indian languages)
const SARVAM_LANGUAGE_CODES: Record<Language, string> = {
  'en': 'en-IN',
  'hi': 'hi-IN',
  'mr': 'mr-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'kn': 'kn-IN',
  'gu': 'gu-IN',
  'bn': 'bn-IN',
};

// LibreTranslate language codes
// Supports 30+ languages including all Indian languages
const LIBRETRANSLATE_CODES: Record<Language, string> = {
  'en': 'en',
  'hi': 'hi',
  'mr': 'mr',
  'ta': 'ta',
  'te': 'te',
  'kn': 'kn',
  'gu': 'gu',
  'bn': 'bn',
};

// Cache translations
const translationCache = new Map<string, Map<Language, string>>();

// Check if browser supports native Translation API
const supportsNativeTranslation = () => {
  if (typeof window === 'undefined') return false;
  return 'translation' in window;
};

// Check if in development (Ollama available)
const isDevelopment = () => {
  if (typeof window === 'undefined') return true;
  return process.env.NODE_ENV === 'development';
};

// Use Sarvam AI for translation (best for Indian languages)
async function translateWithSarvamAI(
  text: string,
  targetLanguage: Language,
): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_SARVAM_API_KEY;
    if (!apiKey) {
      console.warn('Sarvam AI API key not configured');
      return text;
    }

    const response = await fetch('https://api.sarvam.ai/text/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: 'en-IN',
        target_language_code: SARVAM_LANGUAGE_CODES[targetLanguage],
        mode: 'formal',
        model: 'sarvam-translate:v1',
        numerals_format: 'native',
        speaker_gender: 'Male',
        enable_preprocessing: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam AI error:', response.status, errorText);
      throw new Error(`Sarvam AI HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json() as { translated_text?: string };
    if (!data.translated_text) {
      console.error('Sarvam AI returned empty translation:', data);
      throw new Error('Sarvam AI returned empty translation');
    }
    console.log('✓ Sarvam AI translation successful');
    return data.translated_text;
  } catch (error) {
    console.warn('Sarvam AI translation failed, will try fallback:', error);
    throw error; // Throw error to trigger fallback chain
  }
}

// Use LibreTranslate API (free, public instance)
async function translateWithLibreTranslate(
  text: string,
  targetLanguage: Language,
): Promise<string> {
  try {
    // Using libre.io public instance (free, no API key needed)
    const response = await fetch('https://api.libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: LIBRETRANSLATE_CODES[targetLanguage],
      }),
    });

    if (!response.ok) {
      console.warn('LibreTranslate API error:', response.status);
      return text;
    }

    const data = await response.json() as { translatedText?: string };
    return data.translatedText || text;
  } catch (error) {
    console.warn('LibreTranslate translation failed:', error);
    return text;
  }
}

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
    // Try Sarvam AI FIRST (production AND development)
    // It's the best quality for Indian languages
    try {
      console.log('🔄 Trying Sarvam AI for', targetLanguage);
      const sarvamTranslation = await translateWithSarvamAI(text, targetLanguage);
      if (sarvamTranslation && sarvamTranslation !== text) {
        console.log('✅ Sarvam AI successful');
        cacheTranslation(text, targetLanguage, sarvamTranslation);
        return sarvamTranslation;
      }
    } catch (e) {
      console.log('❌ Sarvam AI failed:', e);
    }

    // Try browser's native Translation API
    if (supportsNativeTranslation()) {
      try {
        console.log('🔄 Trying Browser Translation API');
        const translator = await (window as any).translation?.createTranslator({
          sourceLanguage: 'en',
          targetLanguage: LIBRETRANSLATE_CODES[targetLanguage],
        });
        if (translator) {
          const translatedText = await translator.translate(text);
          console.log('✅ Browser API successful');
          cacheTranslation(text, targetLanguage, translatedText);
          return translatedText;
        }
      } catch (e) {
        console.log('❌ Browser API failed:', e);
      }
    }

    // Development (localhost): Use Ollama as second priority
    if (isDevelopment()) {
      try {
        console.log('🔄 Trying Ollama (development)');
        const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434';
        const response = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'mistral',
            prompt: `Translate to ${LANGUAGE_CODES[targetLanguage]}: "${text}"\n\nTranslation:`,
            stream: false,
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = await response.json() as { response?: string };
          const translatedText = data.response?.trim() || text;
          if (translatedText && translatedText !== text) {
            console.log('✅ Ollama successful');
            cacheTranslation(text, targetLanguage, translatedText);
            return translatedText;
          }
        }
      } catch (error) {
        console.warn('❌ Ollama failed:', error);
      }
    }

    // Fallback: Use LibreTranslate API
    console.log('🔄 Trying LibreTranslate (fallback)');
    const libreTranslation = await translateWithLibreTranslate(text, targetLanguage);
    if (libreTranslation && libreTranslation !== text) {
      console.log('✅ LibreTranslate successful');
      cacheTranslation(text, targetLanguage, libreTranslation);
      return libreTranslation;
    }

    console.warn('⚠️ All translation services failed, using English');
    return text;
  } catch (error) {
    console.warn('Translation error:', error);
    return text;
  }
}

function cacheTranslation(text: string, targetLanguage: Language, translatedText: string) {
  if (!translationCache.has(text)) {
    translationCache.set(text, new Map());
  }
  translationCache.get(text)!.set(targetLanguage, translatedText);
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
