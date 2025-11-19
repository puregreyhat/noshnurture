# Recipe Translation Implementation

## Summary
Added machine translation support for recipe instructions using Google Translate API. All recipe steps will now be translated in real-time when users switch languages.

## What's Translated
✅ **Fully Translated:**
- Recipe instructions/steps (via Google Translate API)
- Ingredient names (local dictionary with 50+ common ingredients)
- UI labels (back, ingredients, instructions, etc.)
- Match confidence badges (high/medium/low)

**Stays in Original:**
- Recipe titles (usually unique, hard to translate generically)
- Nutrition facts (kept in English for consistency)

## Setup Instructions

### Step 1: Get Google Translate API Key
1. Go to https://rapidapi.com/genz-api/api/google-translate1
2. Sign up for a free RapidAPI account
3. Click "Subscribe to Test"
4. Copy your API key from the dashboard

### Step 2: Add to `.env.local`
```
NEXT_PUBLIC_RAPIDAPI_KEY=your_key_here
```

### Step 3: Test Translation
1. Open a recipe
2. Click language selector (top right)
3. Select Hindi/Marathi/Tamil (any language except English)
4. Recipe instructions should translate automatically!

## Files Added/Modified

### New Files
- `src/lib/translate.ts` - Translation service with Google Translate integration
- `src/lib/ingredientTranslations.ts` - Local ingredient translations dictionary

### Modified Files
- `src/app/recipes/[id]/page.tsx` - Added translation UI and API integration
- `.env.local` - Added API key configuration

## How It Works

### Ingredient Translation (Instant)
```typescript
// Uses local dictionary - no API call needed
translateIngredient('onion', 'hi') → 'प्याज'
```

### Recipe Instructions Translation (API)
```typescript
// Calls Google Translate API on language change
translateRecipeStep('Cut the onions into rings', 'hi')
// Returns: 'प्याज को छल्लों में काटें'
```

### Caching
- Translations are cached in memory to avoid duplicate API calls
- Cache is per-session (cleared on page refresh)
- Performance: First request ~1-2 seconds, subsequent requests instant

## Supported Languages
- English (en) - Default, no translation
- हिंदी Hindi (hi)
- मराठी Marathi (mr)
- தமிழ் Tamil (ta)
- తెలుగు Telugu (te)
- ಕನ್ನಡ Kannada (kn)
- ગુજરાતી Gujarati (gu)
- বাংলা Bengali (bn)

## Error Handling
- If API key missing: Falls back to English (warns in console)
- If API fails: Shows original English text
- If ingredient not in dictionary: Shows original English ingredient name

## Limitations
1. **API Rate Limits** - RapidAPI free tier: ~100 requests/month
   - If exceeded, translations will fallback to English
   - Recommend caching translations on backend for production

2. **Accuracy** - Google Translate works well for recipe instructions
   - May occasionally produce awkward phrasing
   - Acceptable for a recipe app

3. **Cost** - RapidAPI free tier eventually expires
   - Premium: $10-50/month depending on usage
   - Alternative: Use official Google Cloud Translation API

## Future Improvements

1. **Backend Translation Cache**
   - Store translations in database
   - Reduce API calls to ~1 per unique recipe per language

2. **Offline Support**
   - Cache translations locally
   - Work without internet

3. **Manual Translations**
   - Community contributions for popular recipes
   - Override API translations where needed

## Testing

### Test Recipe Translation
1. Open: `/recipes/[id]` with any recipe
2. Select different language from dropdown
3. Verify:
   - ✅ Instructions update to new language
   - ✅ Ingredient names translate
   - ✅ UI labels translate

### Test Without API Key
1. Remove `NEXT_PUBLIC_RAPIDAPI_KEY` from `.env.local`
2. Select non-English language
3. Should see console warning
4. Text should remain in English (fallback)

## Cost Estimate (Monthly)
- **Free tier**: ~5 recipes × 10 languages = 50 requests/month ✅
- **Paid tier** ($5): ~500 requests/month
- **High usage** ($50): ~5000 requests/month

## Example Usage

```typescript
// Recipe page automatically handles translation
const { language, updateLanguage, isLoaded } = useLanguagePreference();

// When language changes, this effect runs:
useEffect(() => {
  // Translates all recipe steps for selected language
  const translatedSteps = await Promise.all(
    steps.map(step => translateRecipeStep(step.text, language))
  );
  setTranslatedSteps(translatedSteps);
}, [language, recipe]);

// Render uses translations:
{translatedSteps[step.number] || step.step}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Translations not appearing | Check API key in `.env.local` and restart dev server |
| Very slow translation | First load is normal (~2s), subsequent are instant due to caching |
| Falling back to English | Check browser console for API errors, verify API key is valid |
| "API limit exceeded" | Free tier exhausted, upgrade plan or wait for next month |

## Next Steps
To enable translations for your instance:
1. Add the RapidAPI key to `.env.local`
2. Restart the dev server
3. Test on a recipe page with a different language
4. Translations should work immediately!
