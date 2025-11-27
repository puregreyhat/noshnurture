# ✅ Google Translate API - FREE Setup (500k chars/month)

## Summary
Using **Google Cloud Translation API** with FREE tier (no credit card needed for first year).

**Cost:** $0 for typical usage  
**Setup:** 5 minutes  
**Languages:** ALL Indian languages + 100+ others  
**Accuracy:** 99% (Google's neural translation)  

---

## Why Google Translate?

✅ **All Indian Languages** - Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati, Bengali  
✅ **Best Accuracy** - Google's neural networks  
✅ **Free Tier** - 500,000 characters/month = ~50 recipes × 8 languages × 30 days  
✅ **No Server Needed** - Cloud-hosted, always available  
✅ **Production Ready** - Used by millions of apps  

---

## Setup (5 minutes)

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Sign in with Google account (create free one if needed)
3. Create a new project:
   - Click "Select a Project" (top left)
   - Click "New Project"
   - Name: `NoshNurture`
   - Click "Create"

### Step 2: Enable Translation API

1. Search for "Cloud Translation API" in the search bar
2. Click "Cloud Translation API"
3. Click "Enable"
4. Wait for it to enable (~30 seconds)

### Step 3: Create API Key

1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. ⚠️ **Restrict the key** (important for security):
   - Click on your API key
   - Under "API restrictions" → Select "Cloud Translation API"
   - Click "Save"

### Step 4: Add to `.env.local`

```
NEXT_PUBLIC_GOOGLE_TRANSLATE_KEY=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with your actual key.

### Step 5: Restart Dev Server

```bash
npm run dev
```

---

## Test It

1. Open http://localhost:3000
2. Go to any recipe
3. Click language selector
4. Select Hindi/Marathi/Tamil
5. Recipe instructions should translate! 🎉

---

## Free Tier Details

**Quota:** 500,000 characters/month  

**What counts as 1 character:**
- Letters, numbers, spaces, punctuation = 1 char each
- Average recipe instruction: 200 characters
- 500k chars / 200 = 2,500 recipes/month!

**Typical Usage:**
- 5 recipes/day × 200 chars × 8 languages = 8,000 chars/day
- 8,000 × 30 days = 240,000 chars/month ✅ UNDER LIMIT

---

## Pricing After Free Tier

After first 500k characters:
- **$15 per 1 million characters** = ~$0.000015 per character
- Average recipe (200 chars) × 8 languages = 1,600 chars = $0.024
- 100 recipes/month = $2.40/month

Very affordable! 💰

---

## Alternative: Stay Free Forever

If you want to avoid any charges, use **local ingredient dictionary** only:
- Ingredients: Free (100+ common items translated locally)
- Instructions: Stay in English
- UI: All translated
- Cost: $0

This is a good middle ground!

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid API key" | Double-check key pasted correctly in `.env.local` |
| "API not enabled" | Go to Cloud Translation API page and click Enable |
| "Quota exceeded" | You hit 500k chars - wait until next month or upgrade plan |
| Translations are English | Check if API key is in `.env.local`, restart dev server |

---

## Free Tier Features

- ✅ 500,000 characters/month
- ✅ No credit card required (first year)
- ✅ All 100+ languages
- ✅ Neural Machine Translation (best quality)
- ✅ 99.5% uptime SLA
- ✅ Always available (Google's infrastructure)

---

## When to Upgrade

You should consider paid plan if:
- More than 2,500 recipes translated/month
- More than 1,000 concurrent users
- Production app with heavy usage

---

## Setup Summary

```
1. Create Google Cloud Project
   ↓
2. Enable Cloud Translation API
   ↓
3. Get API Key
   ↓
4. Restrict API Key (security)
   ↓
5. Add to .env.local
   ↓
6. Restart npm run dev
   ↓
7. Done! Test on recipe page
```

---

**Next Step:** Go to https://console.cloud.google.com/ and follow the setup! 🚀
