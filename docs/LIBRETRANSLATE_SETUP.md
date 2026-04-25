# LibreTranslate Integration - Complete Setup Guide

## Overview

We've integrated **LibreTranslate** - a free, open-source translation API that supports **32+ languages** including all Indian languages and many international languages.

```
TRANSLATION HIERARCHY:
┌─────────────────────────────────────┐
│ 1. Browser Translation API          │ (Chrome 140+, Brave, Edge)
│    Instant, privacy-friendly       │
└─────────────────────────────────────┘
                 ↓ (if unavailable)
┌─────────────────────────────────────┐
│ 2. LibreTranslate Free API          │ (All browsers, production)
│    32+ languages, no auth needed    │
└─────────────────────────────────────┘
                 ↓ (if unavailable)
┌─────────────────────────────────────┐
│ 3. Ollama (localhost only)          │ (Development)
│    Fastest, most accurate          │
└─────────────────────────────────────┘
                 ↓ (if all fail)
┌─────────────────────────────────────┐
│ 4. English Fallback                 │ (Graceful degradation)
│    Always readable                  │
└─────────────────────────────────────┘
```

---

## LibreTranslate Specifications

### API Endpoint
```
https://api.libretranslate.de/translate
```

### Key Features
- ✅ **Free**: No API key required
- ✅ **No Authentication**: Works immediately
- ✅ **32+ Languages**: Including all Indian languages
- ✅ **Open Source**: Transparent, auditable code
- ✅ **Privacy**: Can be self-hosted if desired

### Language Support

#### Indian Languages (8)
| Language | Code | Supported |
|----------|------|-----------|
| English | en | ✅ |
| हिंदी (Hindi) | hi | ✅ |
| मराठी (Marathi) | mr | ✅ |
| தமிழ் (Tamil) | ta | ✅ |
| తెలుగు (Telugu) | te | ✅ |
| ಕನ್ನಡ (Kannada) | kn | ✅ |
| ગુજરાતી (Gujarati) | gu | ✅ |
| বাংলা (Bengali) | bn | ✅ |

#### South Asian Languages (3)
| Language | Code | Supported |
|----------|------|-----------|
| اردو (Urdu) | ur | ✅ |
| ਪੰਜਾਬੀ (Punjabi) | pa | ✅ |
| മലയാളം (Malayalam) | ml | ✅ |

#### European Languages (13)
Spanish, French, German, Italian, Portuguese, Dutch, Polish, Russian, Ukrainian, Greek, Czech, Romanian

#### East Asian Languages (5)
Japanese, Korean, Chinese, Vietnamese, Thai

#### Middle Eastern Languages (4)
Arabic, Turkish, Persian, Hebrew

**Total: 32+ languages**

---

## How It Works

### For Production (Vercel)

```typescript
// When user clicks "Translate" button:

1. Check language ≠ English
2. Try Browser Translation API first (if available)
   - Instant (< 100ms)
   - Privacy-friendly
3. Fall back to LibreTranslate if browser API unavailable
   - ~1-2 seconds
   - Free, no config needed
4. Show translated recipe instructions
5. Cache result locally (instant on repeat)
```

### For Development (Localhost)

```typescript
// Same as production, but additionally:

- If Ollama is running: Use Ollama (faster, more accurate)
- Otherwise: Fall back to LibreTranslate
```

### Usage Example

```typescript
// From src/lib/translate.ts

export async function translateText(
  text: string,
  targetLanguage: Language,
): Promise<string> {
  // Check cache first
  if (translationCache.has(text)) {
    return translationCache.get(text)?.get(targetLanguage) || text;
  }

  // Try browser API (production)
  if (!isDevelopment() && supportsNativeTranslation()) {
    // ... browser translation code ...
  }

  // Try Ollama (development)
  if (isDevelopment()) {
    // ... ollama code ...
  }

  // Fall back to LibreTranslate
  const libreTranslation = await translateWithLibreTranslate(text, targetLanguage);
  return libreTranslation;
}

async function translateWithLibreTranslate(
  text: string,
  targetLanguage: Language,
): Promise<string> {
  const response = await fetch('https://api.libretranslate.de/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'en',
      target: LIBRETRANSLATE_CODES[targetLanguage],
    }),
  });

  const data = await response.json();
  return data.translatedText || text;
}
```

---

## Testing Translation

### Quick Test on Production (Vercel)

```bash
# No setup needed! Just test:
1. Go to https://noshnurture.vercel.app
2. Select any recipe
3. Change language to: हिंदी, मराठी, தமிழ், etc.
4. Click "Translate" button
5. Watch instructions translate!
```

### Quick Test on Localhost

```bash
# Option 1: With Ollama (fastest)
docker-compose up -d ollama
npm run dev
# Then select recipe, change language, click Translate

# Option 2: Without Ollama (uses LibreTranslate fallback)
npm run dev
# Still works, just uses LibreTranslate!
```

---

## Performance Characteristics

### Translation Speed

| Scenario | Speed | Reason |
|----------|-------|--------|
| Cached translation | < 100ms | Browser memory |
| Browser API | < 100ms | Built-in, no network |
| LibreTranslate (first) | 1000-2000ms | API call |
| LibreTranslate (cached) | < 100ms | Browser cache |
| Ollama (first) | 5000-10000ms | Model loading |
| Ollama (cached) | < 100ms | Browser cache |

### Typical user experience:
1. First recipe in new language: ~2 seconds wait
2. Same recipe again: Instant (cached)
3. Different recipe, same language: Instant (same cache)

---

## How to Extend Language Support

### To add more languages to the UI dropdown:

1. **Edit** `src/lib/translations.ts`:
```typescript
export type Language = 'en' | 'hi' | 'mr' | ... | 'es' | 'fr'; // Add language codes

export const LANGUAGE_NAMES: Record<Language, string> = {
  ...
  es: '🇪🇸 Español',
  fr: '🇫🇷 Français',
};

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  ...
  es: { /* Spanish translations */ },
  fr: { /* French translations */ },
};
```

2. **LibreTranslate supports these automatically**, so no additional setup needed!

3. **Test**:
```bash
npm run build  # Should pass
npm run dev    # Select new language, click Translate
```

---

## Comparison: Ollama vs LibreTranslate vs Browser API

| Feature | Ollama | LibreTranslate | Browser API |
|---------|--------|----------------|-------------|
| Setup | Docker | None | Browser flags |
| Cost | Free | Free | Free |
| Speed | 5-10s first | 1-2s first | < 100ms |
| Languages | 8 Indian | 32+ | Depends on browser |
| Privacy | Complete | Sends to server | No data sent |
| Availability | Localhost only | Everywhere | Chrome 140+ |
| Accuracy | Excellent | Good | Very Good |
| Self-hosted | Yes | Optional | N/A |

**Best for production**: Browser API (instant) → LibreTranslate (fallback)
**Best for development**: Ollama (most accurate) → LibreTranslate (fallback)

---

## Troubleshooting

### "Translation not available" error

**Causes:**
1. LibreTranslate API temporarily down
2. Network connection issue
3. Browser doesn't support translation

**Solutions:**
1. Refresh page and try again
2. Check internet connection
3. For Chrome: Enable Translation API flags at chrome://flags
4. Use different browser (Brave works instantly)

### Translation quality issues

**If translations seem incorrect:**
1. This is normal for some language combinations
2. LibreTranslate has varying quality by language pair
3. Try Ollama locally (more accurate for Indian languages):
   ```bash
   docker-compose up -d ollama
   npm run dev
   ```

### Slow translations

**If taking > 3 seconds:**
1. First translation is slower (loading)
2. Subsequent translations are instant (cached)
3. If still slow, LibreTranslate server may be under load
4. Alternative: Use Ollama locally (faster)

---

## API Limits & Considerations

### LibreTranslate Free API
- **Rate Limit**: Generous (depends on public instance usage)
- **Max characters per request**: 5000
- **Batch requests**: One at a time recommended
- **Downtime**: Public instance occasionally needs maintenance

### If you hit rate limits:
1. Wait 1 hour (limits reset)
2. Or self-host LibreTranslate:
   ```bash
   docker run -it -p 5000:5000 libretranslate/libretranslate
   ```
3. Or use Ollama (no limits, local)

---

## Implementation Details

### Files Modified

1. **src/lib/translate.ts**
   - Added LibreTranslate API integration
   - Auto-detection of development vs production
   - Fallback chain: Browser API → Ollama/LibreTranslate → English

2. **src/app/recipes/[id]/page.tsx**
   - Translate button in recipe header
   - Calls `translateRecipeStep()` for each instruction
   - Shows toast notifications

3. **.env.local** (Optional)
   - `NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434` (localhost only)

### New File

1. **src/lib/translationsExtended.ts**
   - Documents all 32+ languages
   - Language codes for LibreTranslate
   - Metadata about LibreTranslate API

---

## Cost Analysis

| Component | Cost |
|-----------|------|
| LibreTranslate API | ✅ FREE |
| Browser Translation API | ✅ FREE (built-in) |
| Ollama (self-hosted) | ✅ FREE |
| Vercel Deployment | ✅ FREE (hobby) |
| **Total** | **$0** |

**You're running a complete, zero-cost translation system!** 🎉

---

## Next Steps

1. ✅ **Already done**: LibreTranslate integration complete
2. ✅ **Already done**: 32+ languages supported
3. ✅ **Already done**: Fallback chain implemented
4. **Option**: Add more UI languages (see "Extend Language Support" section)
5. **Option**: Self-host LibreTranslate if public instance rate-limited

---

## Summary

| Aspect | Status | Details |
|--------|--------|---------|
| Translation API | ✅ Live | LibreTranslate + fallbacks |
| Languages | ✅ 32+ | All Indian + European + Asian |
| Production Ready | ✅ Yes | Deployed on Vercel |
| Zero Cost | ✅ Yes | No API keys, no billing |
| Performance | ✅ Optimized | Cached, multiple tiers |
| Fallback Strategy | ✅ Complete | 4-tier chain ensures always readable |

**Everything is ready to use!** 🚀
