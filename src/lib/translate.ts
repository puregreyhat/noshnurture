// Translation service - works both locally and on production
// - Localhost: Uses Ollama (free, local)
// - Vercel: Uses browser's native Translation API
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
    // Production (Vercel): Use browser's native Translation API
    if (!isDevelopment() && supportsNativeTranslation()) {
      try {
        const translator = await (window as any).translation?.createTranslator({
          sourceLanguage: 'en',
          targetLanguage: LANGUAGE_CODES[targetLanguage],
        });
        if (translator) {
          const translatedText = await translator.translate(text);
          cacheTranslation(text, targetLanguage, translatedText);
          return translatedText;
        }
      } catch (e) {
        console.log('Browser translation unavailable');
      }
    }

    // Development (localhost): Use Ollama
    if (isDevelopment()) {
      try {
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
          cacheTranslation(text, targetLanguage, translatedText);
          return translatedText;
        }
      } catch (error) {
        console.warn('Ollama unavailable, returning original text');
      }
    }

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
