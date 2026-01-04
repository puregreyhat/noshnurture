# Translation Not Working - Debugging Guide

## What You Saw
- ⏳ "Translating recipe instructions..." message appeared
- ❌ But instructions didn't translate / stayed in English

## What We Fixed

### Issue 1: Silent Sarvam AI Failures
**Problem:** If Sarvam AI failed, it would silently return the original text instead of trying fallbacks.

**Fix:** Now throws proper errors so fallback chain continues:
```typescript
// Before: Silently returned original text
const sarvamTranslation = await translateWithSarvamAI(...);
if (sarvamTranslation !== text) {  // ← Bug: Returns text even on error!
  return sarvamTranslation;
}

// After: Throws error to trigger fallback
const sarvamTranslation = await translateWithSarvamAI(...);
// If fails, throws error → tries Browser API → LibreTranslate → Ollama
```

### Issue 2: Missing Console Logging
**Problem:** Couldn't see which translation service was being tried or failing.

**Fix:** Added detailed console logging:
```
🔄 Trying Sarvam AI for hi
❌ Sarvam AI failed, trying Browser API...
🔄 Trying Browser Translation API  
❌ Browser API failed, trying LibreTranslate...
🔄 Trying LibreTranslate (fallback)
✅ LibreTranslate successful
```

### Issue 3: Poor Error Messages
**Problem:** Toast notifications didn't show which service worked.

**Fix:** Now shows:
- ✅ Fully translated (all steps)
- ⚠️ Partially translated (some steps failed)
- ❌ Completely failed (no steps translated)

## How to Debug

### Step 1: Open Browser Console
```
On your recipe page:
1. Press: Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows)
2. Click: "Console" tab
3. Keep this open while translating
```

### Step 2: Click Translate Button
When you click "Translate" button, you'll see logs like:

**If working:**
```
Starting translation of 6 steps to hi
🔄 Trying Sarvam AI for hi
✓ Sarvam AI translation successful
✓ Step 1 translated successfully
✓ Step 2 translated successfully
[... more steps ...]
✅ Recipe instructions translated!
```

**If Sarvam AI fails:**
```
🔄 Trying Sarvam AI for hi
❌ Sarvam AI error: 401 Unauthorized  // ← Check this!
❌ Sarvam AI failed, trying Browser API...
🔄 Trying Browser Translation API
❌ Browser API failed, trying LibreTranslate...
🔄 Trying LibreTranslate (fallback)
✅ LibreTranslate successful
✅ Recipe instructions translated!
```

## Common Issues & Solutions

### Issue: "Sarvam AI error: 401 Unauthorized"
**Cause:** API key invalid or expired

**Solution:**
1. Go to: https://console.sarvam.ai
2. Check if your API key is still valid
3. Update `.env.local` with new key:
   ```
   NEXT_PUBLIC_SARVAM_API_KEY=sk_xxxxx
   ```
4. Restart: `npm run dev` or redeploy to Vercel

### Issue: "Sarvam AI error: 429 Too Many Requests"
**Cause:** Rate limit exceeded

**Solution:**
1. Wait a few minutes
2. Try again
3. System will auto-fallback to LibreTranslate

### Issue: "Sarvam AI returned empty translation"
**Cause:** API returned but no text in response

**Solution:**
1. Try translating a shorter sentence
2. Check Sarvam AI dashboard for service status
3. Try different language

### Issue: No logs appearing in console
**Cause:** Build cache or development mode issue

**Solution:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run dev
# Try translating again
```

## Network Tab Debugging

### See Which API is Being Called

1. Open DevTools → **Network** tab
2. Filter for: `api.sarvam.ai` or `libretranslate.de`
3. Click Translate button
4. Look for requests:

**Sarvam AI request:**
```
POST https://api.sarvam.ai/text/translate
Headers:
  Authorization: Bearer sk_xxxxx
  Content-Type: application/json

Body:
{
  "input": "Heat butter in a pan",
  "source_language_code": "en-IN",
  "target_language_code": "hi-IN",
  "model": "sarvam-translate:v1"
}

Response:
{
  "translated_text": "एक पैन में मक्खन गर्म करें"
}
```

**LibreTranslate request (fallback):**
```
POST https://api.libretranslate.de/translate
Body:
{
  "q": "Heat butter in a pan",
  "source": "en",
  "target": "hi"
}

Response:
{
  "translatedText": "एक पैन में मक्खन गर्म करें"
}
```

## Testing Locally vs Vercel

### Local (npm run dev)
- Tries: Sarvam AI → Browser API → LibreTranslate → Ollama → English
- Logs should show which one works

### Vercel (noshnuriture.vercel.app)
- Tries: Sarvam AI → Browser API → LibreTranslate → English
- (Ollama not available on production)

## Expected Behavior Now

| Scenario | Before | After |
|----------|--------|-------|
| Safari | ❌ Error | ✅ Works via Sarvam AI/Libre |
| Firefox | ❌ Error | ✅ Works via Sarvam AI/Libre |
| Chrome 119 | ❌ Error | ✅ Works via Sarvam AI |
| Chrome 140+ | ✅ Works | ✅ Works (faster via Browser API) |
| Sarvam AI fails | ❌ Error | ✅ Falls back to Libre |
| All fail | ❌ Error | ✅ Shows English (readable) |

## What to Try

### Test 1: Simple Language (Hindi)
```
1. Go to recipe
2. Change to: 🇮🇳 हिंदी
3. Click Translate
4. Check console
```

### Test 2: Different Language (Tamil)
```
1. Change to: 🇮🇳 தமிழ்
2. Click Translate
3. Should work (tests fallback quality)
```

### Test 3: Force Fallback (English to English)
```
1. Stay in English
2. Manually call in console:
   ```
   const {translateText} = await import('./lib/translate.ts');
   await translateText('hello', 'en');
   ```
3. Should return instantly

### Test 4: Check Cached Translation
```
1. Click Translate for Hindi
2. Wait for first result
3. Click Translate again for same language
4. Should be instant (shows in console: "< 100ms cached")
```

## Still Not Working? Check:

```bash
# 1. Is API key set?
echo $NEXT_PUBLIC_SARVAM_API_KEY

# 2. Is key valid at Sarvam console?
# Visit: https://console.sarvam.ai

# 3. Try LibreTranslate directly in console:
fetch('https://api.libretranslate.de/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    q: 'hello',
    source: 'en',
    target: 'hi'
  })
}).then(r => r.json()).then(d => console.log(d.translatedText))

# 4. Check network connectivity
# Are you behind VPN/firewall?
```

## Report Format

If translation still isn't working, check console for these errors and let me know:

```
Browser: [Safari/Firefox/Chrome/Edge]
Language: [हिंदी/मराठी/etc]
Console shows: [paste error messages]
Network tab shows: [request URL and response status]
```

---

**Summary:** The system now has 5 fallback tiers with detailed logging. Check your browser console to see which service worked or why it failed!
