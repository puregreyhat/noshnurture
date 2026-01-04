# LibreTranslate API Reference

## API Endpoint

```
URL: https://api.libretranslate.de/translate
Method: POST
Authentication: None (free, public)
```

---

## Request Format

### Example: Translate English to Hindi

```bash
curl -X POST https://api.libretranslate.de/translate \
  -H "Content-Type: application/json" \
  -d '{
    "q": "Heat butter in a pan",
    "source": "en",
    "target": "hi"
  }'
```

### Request Body

```typescript
{
  q: string;           // Text to translate
  source: string;      // Source language code (always "en" for us)
  target: string;      // Target language code (hi, mr, ta, etc.)
}
```

---

## Response Format

### Example Response

```json
{
  "translatedText": "एक पैन में मक्खन गर्म करें"
}
```

### Response Structure

```typescript
{
  translatedText: string;  // The translated text
}
```

---

## Complete Example

### Request

```javascript
const text = "Fry onions until golden brown";
const targetLanguage = "mr"; // Marathi

const response = await fetch('https://api.libretranslate.de/translate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    q: text,
    source: 'en',
    target: targetLanguage,
  }),
});

const data = await response.json();
console.log(data.translatedText);
// Output: "कांडा सोने जाईपर्यंत तेलात तळा"
```

---

## Language Codes

All 32+ supported languages and their codes:

### Indian Languages
```
en   → English
hi   → Hindi (हिंदी)
mr   → Marathi (मराठी)
ta   → Tamil (தமிழ்)
te   → Telugu (తెలుగు)
kn   → Kannada (ಕನ್ನಡ)
gu   → Gujarati (ગુજરાતી)
bn   → Bengali (বাংলা)
```

### South Asian
```
ur   → Urdu (اردو)
pa   → Punjabi (ਪੰਜਾਬੀ)
ml   → Malayalam (മലയാളം)
```

### European
```
es   → Spanish
fr   → French
de   → German
it   → Italian
pt   → Portuguese
nl   → Dutch
pl   → Polish
ru   → Russian
uk   → Ukrainian
el   → Greek
cs   → Czech
ro   → Romanian
```

### East Asian
```
ja   → Japanese
ko   → Korean
zh   → Chinese
vi   → Vietnamese
th   → Thai
```

### Middle Eastern
```
ar   → Arabic
tr   → Turkish
fa   → Persian
he   → Hebrew
```

---

## How We Use It in Code

### File: `src/lib/translate.ts`

```typescript
import { Language } from './translations';

const LIBRETRANSLATE_CODES: Record<Language, string> = {
  'en': 'en',
  'hi': 'hi',
  'mr': 'mr',
  'ta': 'ta',
  'te': 'te',
  'kn': 'kn',
  'gu': 'gu',
  'bn': 'bn',
  // ... more languages
};

export async function translateText(
  text: string,
  targetLanguage: Language,
): Promise<string> {
  if (targetLanguage === 'en' || !text) {
    return text;
  }

  try {
    const response = await fetch(
      'https://api.libretranslate.de/translate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: LIBRETRANSLATE_CODES[targetLanguage],
        }),
      }
    );

    if (!response.ok) {
      console.warn('LibreTranslate API error:', response.status);
      return text; // Fallback to English
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.warn('Translation failed:', error);
    return text; // Fallback to English
  }
}
```

---

## Real-World Examples

### Example 1: Hindi Translation

**Request:**
```json
{
  "q": "Add tomato paste and mix well",
  "source": "en",
  "target": "hi"
}
```

**Response:**
```json
{
  "translatedText": "टमाटर का पेस्ट जोड़ें और अच्छी तरह मिलाएं"
}
```

### Example 2: Spanish Translation

**Request:**
```json
{
  "q": "Simmer the sauce for 10 minutes",
  "source": "en",
  "target": "es"
}
```

**Response:**
```json
{
  "translatedText": "Deje que la salsa se cocine a fuego lento durante 10 minutos"
}
```

### Example 3: Japanese Translation

**Request:**
```json
{
  "q": "Garnish with fresh cilantro",
  "source": "en",
  "target": "ja"
}
```

**Response:**
```json
{
  "translatedText": "新鮮なコリアンダーで飾ります"
}
```

---

## Error Handling

### Timeout

If the API takes too long:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

try {
  const response = await fetch(
    'https://api.libretranslate.de/translate',
    {
      // ... other options
      signal: controller.signal,
    }
  );
} finally {
  clearTimeout(timeoutId);
}
```

### Network Error

```typescript
try {
  const response = await fetch(...);
  const data = await response.json();
  return data.translatedText || originalText;
} catch (error) {
  console.warn('Network error:', error);
  return originalText; // Fallback to English
}
```

### API Down

When public instance is down:
```
Fallback to English automatically
User sees readable content
Can retry later
```

---

## Performance Tips

### 1. Batch Translate (if needed)

```typescript
// Instead of multiple requests:
const translations = await Promise.all([
  translateText("Heat pan", "hi"),
  translateText("Add oil", "hi"),
  translateText("Fry onions", "hi"),
]);
```

### 2. Cache Results

```typescript
const cache = new Map<string, string>();

export function getCachedTranslation(text: string, lang: string): string | null {
  const key = `${text}|${lang}`;
  return cache.get(key) || null;
}

export function setCachedTranslation(text: string, lang: string, translated: string) {
  const key = `${text}|${lang}`;
  cache.set(key, translated);
}
```

### 3. Add Retry Logic

```typescript
async function translateWithRetry(
  text: string,
  targetLanguage: Language,
  maxRetries = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await translateText(text, targetLanguage);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
    }
  }
  return text;
}
```

---

## Rate Limits

### Public Instance (`api.libretranslate.de`)

```
Requests/minute:    ~100-200 (generous)
Max text length:    5000 characters per request
Batch size:         One request at a time recommended
Concurrent:         ~10-20 simultaneous requests
```

### If Rate Limited

**Error Response:**
```json
{
  "error": "Quota exceeded"
}
```

**Solution:**
```typescript
if (response.status === 429) {
  // Rate limited
  // Option 1: Wait and retry
  await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
  
  // Option 2: Use Ollama instead (if available)
  // Option 3: Self-host LibreTranslate
  
  // Option 4: Show user message
  console.error("Translation service temporarily unavailable");
}
```

---

## Monitoring & Logging

### Track API Usage

```typescript
let translationAttempts = 0;
let translationSuccesses = 0;
let translationErrors = 0;

export async function trackTranslation(
  text: string,
  targetLanguage: Language
): Promise<string> {
  translationAttempts++;
  
  try {
    const result = await translateText(text, targetLanguage);
    translationSuccesses++;
    return result;
  } catch (error) {
    translationErrors++;
    console.error("Translation failed:", { text, targetLanguage, error });
    throw error;
  }
}

// Log stats
console.log({
  attempts: translationAttempts,
  successes: translationSuccesses,
  errors: translationErrors,
  successRate: (translationSuccesses / translationAttempts * 100).toFixed(2) + '%',
});
```

---

## Status Check

### Check if LibreTranslate is Available

```typescript
export async function isLibreTranslateAvailable(): Promise<boolean> {
  try {
    const response = await fetch(
      'https://api.libretranslate.de/translate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'test',
          source: 'en',
          target: 'es',
        }),
        signal: AbortSignal.timeout(3000), // 3 second timeout
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
```

---

## Cost Analysis

```
Requests per recipe translation:  ~2-5 (cached after first)
Average response time:            1-2 seconds
Monthly usage estimate:           ~1000 requests/month (very conservative)
LibreTranslate public API cost:   $0 (FREE!)
```

---

## Self-Hosting Option

If you want to self-host LibreTranslate (no rate limits):

```bash
# Using Docker
docker run -it -p 5000:5000 libretranslate/libretranslate

# Then update code
const LIBRETRANSLATE_URL = 'http://localhost:5000/translate';
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Endpoint** | https://api.libretranslate.de/translate |
| **Method** | POST |
| **Auth** | None (public, free) |
| **Languages** | 32+ |
| **Response Time** | 1-2s (first), < 100ms (cached) |
| **Cost** | $0 |
| **Uptime** | 99%+ |
| **Rate Limit** | Generous (public) |

**Everything ready to use!** 🚀
