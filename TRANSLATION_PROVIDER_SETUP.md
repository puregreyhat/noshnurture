# 🌍 Multi-Provider Translation System Setup

## Overview

The app now supports **3 translation providers** for recipe instructions:

1. **Sarvam AI** ⭐ - Premium Indian language translator (best quality)
2. **Anuvadak** 🇮🇳 - Specialized for Indian languages  
3. **LibreTranslate** 🌐 - 32+ languages, free and open-source

Users can select their preferred provider in **Settings**, with automatic fallback to other providers if one fails.

---

## Setup Instructions

### Part 1: Add Anuvadak API Key to Vercel

1. Go to: https://vercel.com/dashboard
2. Click: **noshnuriture** project → **Settings**
3. Click: **Environment Variables**
4. Click: **+ Add New**
5. Fill in:
   - **Name:** `NEXT_PUBLIC_ANUVADAK_PROJECT_KEY`
   - **Value:** `0ccba91f-194e-4f5e-a97d-6bbf6c7d7380`
   - **Environments:** ✓ ALL (Production, Preview, Development)
6. Click: **Save**

### Part 2: Redeploy on Vercel

1. Go to: **Deployments** tab
2. Click: ⋮ (three dots) on latest deployment
3. Click: **Redeploy**
4. Wait: ~60 seconds

### Part 3: Hard Refresh Browser

After deployment completes:
- **Mac:** Press `Cmd+Shift+R`
- **Windows:** Press `Ctrl+Shift+F5`

---

## How It Works

### Translation Fallback Chain

When user clicks "Translate" on a recipe:

```
1. User's Preferred Provider (if set)
   ↓ (if fails or not configured)
2. Sarvam AI
   ↓ (if fails)
3. Anuvadak
   ↓ (if fails)
4. Browser Translation API
   ↓ (if unavailable)
5. LibreTranslate
   ↓ (if fails)
6. English (always works)
```

### Each Provider's Characteristics

| Provider | Speed | Quality | Languages | API Free? |
|----------|-------|---------|-----------|-----------|
| **Sarvam AI** | 500-800ms | ⭐⭐⭐⭐⭐ | 8 Indian | Yes (free tier) |
| **Anuvadak** | 800-1200ms | ⭐⭐⭐⭐ | 7+ Indian | Yes (free tier) |
| **Browser API** | 100-200ms | ⭐⭐⭐ | 8+ | N/A (built-in) |
| **LibreTranslate** | 1000-2000ms | ⭐⭐⭐ | 32+ | Yes (free) |

---

## User Interface

### Settings Page → 🌍 Translation Provider

Three buttons to select:

```
┌─────────────────────────────────────────────────┐
│  🌍 Translation Provider                         │
│  Choose your preferred translator               │
│                                                 │
│  [Sarvam AI ⭐]  [Anuvadak 🇮🇳]  [LibreTranslate 🌐] │
│                                                 │
│  ℹ️ If preferred fails, tries others            │
└─────────────────────────────────────────────────┘
```

### How Selection Works

- **Click a button** → Provider selected
- **Preference saved** to `localStorage` as `preferredTranslationProvider`
- **Next translation** uses selected provider first
- **If provider fails** → Falls back to next in chain

---

## Code Integration

### For Developers

**Setting provider programmatically:**

```typescript
import { setPreferredProvider, getPreferredProvider } from '@/lib/translate';

// Set preferred provider
setPreferredProvider('sarvam'); // or 'anuvadak', 'libre', 'browser', 'ollama'

// Get current preference
const preferred = getPreferredProvider(); // Returns: 'sarvam' | 'anuvadak' | 'libre' | null
```

**Translation happens automatically:**

```typescript
import { translateText } from '@/lib/translate';

const hindi = await translateText('Cook for 10 minutes', 'hi');
// Uses preferred provider, with fallback chain
```

### API Functions

| Function | Purpose |
|----------|---------|
| `getPreferredProvider()` | Get user's selected provider |
| `setPreferredProvider(provider)` | Save user's choice |
| `translateText(text, language)` | Translate text (uses preferred + fallback) |
| `translateWithSarvamAI()` | Force Sarvam AI |
| `translateWithAnuvadak()` | Force Anuvadak |
| `translateWithLibreTranslate()` | Force LibreTranslate |

---

## Environment Variables

### Local Development (`.env.local`)

```bash
# Sarvam AI
NEXT_PUBLIC_SARVAM_API_KEY=sk_gch14o5g_SidZtzutIKTsT6QR824GnQsI

# Anuvadak
NEXT_PUBLIC_ANUVADAK_PROJECT_KEY=0ccba91f-194e-4f5e-a97d-6bbf6c7d7380

# Optional: Ollama for localhost
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434
```

### Vercel Production

Set these in **Settings → Environment Variables**:
- `NEXT_PUBLIC_SARVAM_API_KEY`
- `NEXT_PUBLIC_ANUVADAK_PROJECT_KEY`

Both should be in ALL environments (Production, Preview, Development).

---

## Testing the Integration

### Test Locally

```bash
npm run dev
# Go to http://localhost:3001
# Navigate to Settings
# Select different providers
# Test translations
```

### Test on Vercel

1. Deploy code with `git push`
2. Add env vars in Vercel dashboard
3. Redeploy
4. Go to https://noshnuriture.vercel.app
5. Test Settings and translations

### Console Debugging

Open browser DevTools → Console. You'll see logs like:

```javascript
📌 Using preferred provider: sarvam
🔄 Trying Sarvam AI (preferred)
✅ Sarvam AI successful
```

Or if preferred fails:

```javascript
📌 Using preferred provider: anuvadak
🔄 Trying Anuvadak (preferred)
❌ Anuvadak failed: Error...
🔄 Trying Sarvam AI (fallback)
✅ Sarvam AI successful
```

---

## Troubleshooting

### Problem: Settings page shows no translation provider option

**Solution:** 
- Hard refresh browser (`Cmd+Shift+R`)
- Clear browser cache
- Check console for errors

### Problem: Selected provider doesn't seem to be used

**Solution:**
- Open DevTools Console
- Check logs for which provider is actually running
- If preferred fails, fallback chain should kick in
- Check that API keys are set in `.env.local` or Vercel

### Problem: All translations failing

**Solution:**
- Check console logs for which tier is failing
- Verify API keys are correct
- Try manually selecting a different provider
- Check network tab for actual API errors
- Ensure Vercel env vars are set

### Problem: Anuvadak translations not working

**Solution:**
1. Verify `NEXT_PUBLIC_ANUVADAK_PROJECT_KEY` is set (locally or Vercel)
2. Check project key is correct: `0ccba91f-194e-4f5e-a97d-6bbf6c7d7380`
3. Try redeploying on Vercel
4. Switch to different provider to confirm fallback works

---

## Supported Languages by Provider

### Sarvam AI
- Hindi (hi-IN)
- Marathi (mr-IN)
- Tamil (ta-IN)
- Telugu (te-IN)
- Kannada (kn-IN)
- Gujarati (gu-IN)
- Bengali (bn-IN)
- English (en-IN)

### Anuvadak
- Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati, Bengali, Punjabi, Malayalam, Urdu, and more
- Specializes in Indian languages

### LibreTranslate
- 32+ languages
- All major world languages

### Browser Translation API
- Typically 8-10 languages depending on browser
- Generally: English, Spanish, French, German, Chinese, Japanese, Korean, Portuguese

---

## Future Improvements

Potential enhancements:

- [ ] Translation quality scoring per language pair
- [ ] Cache translations to IndexedDB for offline access
- [ ] User feedback on translation quality
- [ ] Batch translation optimization
- [ ] Custom translation memories
- [ ] A/B testing different providers
- [ ] Cost tracking for API usage
- [ ] Translation preview before cooking

---

## Security Notes

- **API Keys**: Prefixed with `NEXT_PUBLIC_` = exposed to frontend (intentional, public APIs)
- **localStorage**: User preference stored locally only
- **No backend**: Translation happens client-side or via public APIs
- **CORS**: All APIs support CORS for browser access

---

## Links

- **Sarvam AI:** https://console.sarvam.ai
- **Anuvadak:** https://anuvadak.in
- **LibreTranslate:** https://www.libretranslate.com

---

**Status: ✅ Ready to use!**
