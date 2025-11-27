# 🚀 Vercel Environment Setup Guide

## Problem
You deployed to Vercel, but the Sarvam AI translations don't work because the API key isn't configured on Vercel.

**Root Cause:**
- `.env.local` is **gitignored** and never sent to Vercel
- Vercel needs environment variables set explicitly in the dashboard

## Solution: Add Environment Variables to Vercel (5 minutes)

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Click on your **`noshnuriture`** project

### Step 2: Add Environment Variable
1. Click **Settings** (top navigation bar)
2. Click **Environment Variables** (left sidebar)
3. Click **+ Add New** button

### Step 3: Configure Sarvam AI Key
Fill in the form:
- **Name:** `NEXT_PUBLIC_SARVAM_API_KEY`
- **Value:** `sk_gch14o5g_SidZtzutIKTsT6QR824GnQsI`
- **Environments:** Select ALL (✓ Production, ✓ Preview, ✓ Development)
- Click **Save**

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment (top one)
3. Click the **⋮** (three dots) menu
4. Click **Redeploy**
5. Wait ~60 seconds for deployment to complete

### Step 5: Test
1. Go to https://noshnuriture.vercel.app
2. Select any recipe
3. Change language to **हिंदी** (Hindi)
4. Click **Translate** button
5. Should translate in 1-2 seconds! ✅

---

## Environment Variables Explained

| Var | Value | Purpose | Environment |
|-----|-------|---------|-------------|
| `NEXT_PUBLIC_SARVAM_API_KEY` | `sk_gch14o5g_...` | Premium Indian translation (Sarvam AI) | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Already set ✓ | Database access | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Already set ✓ | Auth token | All |
| `SPOONACULAR_API_KEY` | Already set ✓ | Recipe data | All |
| `VKART_BASE_URL` | Already set ✓ | Order sync | All |

---

## Translation Fallback Chain (After Fix)

```
Tier 1: Sarvam AI ✅ (once env var added)
  ↓ (if fails or no API key)
Tier 2: Browser Translation API (Chrome 140+, Brave, Edge)
  ↓ (if not available)
Tier 3: LibreTranslate (free, public API)
  ↓ (if fails or no network)
Tier 4: English (always available)
```

---

## Troubleshooting

### Still seeing "Sarvam AI API key not configured"?

**Check 1:** Verify env var was added
- Go to Vercel → Settings → Environment Variables
- Look for `NEXT_PUBLIC_SARVAM_API_KEY`
- Should show: `sk_gch14o5g_...` (partial, for security)

**Check 2:** Verify deployment redeployed
- Go to Vercel → Deployments
- Top deployment should show recent timestamp
- If old, click Redeploy button again

**Check 3:** Hard refresh browser
- Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
- Or clear cache: DevTools → Network → "Disable cache" checkbox

**Check 4:** Wait for build
- Sometimes builds take 1-2 minutes
- Check deployment status circle (should be green ✅)

### Getting "Failed to load resource: net::ERR_NAME_NOT_RESOLVED" for LibreTranslate?

This means network connection issue on Vercel or LibreTranslate is down.
- Browser Translation API (Tier 2) should still work
- Try a different browser (Chrome, Edge, Brave support it)

### Getting "Translation not available in your browser"?

Update your browser or use:
- ✅ Chrome 140+
- ✅ Edge 120+
- ✅ Brave (latest)
- ✅ Falls back to LibreTranslate on Safari/Firefox

---

## Command Line Alternative (If Dashboard Issues)

```bash
# Install Vercel CLI
npm install -g vercel

# Link your project
cd nosh
vercel link

# Set environment variable
vercel env add NEXT_PUBLIC_SARVAM_API_KEY
# Paste: sk_gch14o5g_SidZtzutIKTsT6QR824GnQsI

# Redeploy
vercel --prod
```

---

## Files Updated for This Fix

- ✅ `src/lib/translate.ts` - Now checks if API key exists before using Sarvam AI
- ✅ Build tested locally - No errors

---

## Summary

| Before Fix | After Fix |
|-----------|-----------|
| ❌ Localhost: Only Ollama works | ✅ Localhost: Sarvam AI + Ollama + LibreTranslate |
| ❌ Vercel: No translation at all | ✅ Vercel: Sarvam AI + Browser API + LibreTranslate |
| ❌ Only Chrome/Edge work | ✅ All browsers work (via fallback chain) |
| ❌ "API key not configured" error | ✅ Clean skipping to next service |

---

## Need Help?

1. Check Vercel env vars: https://vercel.com/dashboard → Settings → Environment Variables
2. Check deployment status: https://vercel.com/dashboard → Deployments
3. Test locally: `npm run dev` and try translation
4. View build logs: Deployments → Click latest → Logs

---

**Once you add the env var to Vercel and redeploy, translations will work!** 🎉
