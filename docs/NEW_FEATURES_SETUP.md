# 🚀 New Features Setup Guide - NoshNurture

## Overview
This guide covers setup for three major new features added to NoshNurture:

1. **📧 Email Reminders** - Automated expiry notifications
2. **🛒 Shopping List Generator** - Smart grocery planning
3. **🎤 Hey Nosh Voice Assistant** - AI-powered kitchen helper

---

## Feature 1: Email Reminders for Expiring Items

### What It Does
Sends automated email reminders every morning at 7 AM IST when items in your inventory are:
- Expiring today (0 days)
- Expiring tomorrow (1 day)
- Expiring in 3 days

### Setup Steps

#### 1. Get Resend API Key
```
1. Go to https://resend.com
2. Sign up for free account (100 emails/day free)
3. Generate API key from Dashboard
4. Copy the key
```

#### 2. Configure Environment Variables
Add to your `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
CRON_SECRET=your_random_secret_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Get SUPABASE_SERVICE_ROLE_KEY:**
```
1. Go to Supabase Dashboard
2. Settings → API
3. Copy "service_role" secret key (NOT the anon key)
```

**Generate CRON_SECRET:**
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3. Deploy to Vercel
The `vercel.json` file is already configured with:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-expiry-reminders",
      "schedule": "30 1 * * *"
    }
  ]
}
```

This runs at **7:00 AM IST** (1:30 AM UTC).

#### 4. Set Cron Secret in Vercel
```
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add: CRON_SECRET = your_random_secret_here
4. Redeploy
```

#### 5. Configure Resend Domain (Optional but Recommended)
```
1. In Resend Dashboard → Domains
2. Add your domain (e.g., noshnurture.app)
3. Add DNS records to your domain provider
4. Update from address in src/lib/email/resend.ts
   from: 'NoshNurture <noreply@noshnurture.app>'
```

### Testing
Test the cron endpoint manually:
```bash
curl -X GET https://your-app.vercel.app/api/cron/send-expiry-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Feature 2: Shopping List Generator

### What It Does
- **Auto-detect missing ingredients** for recipes
- **Flag low-stock items** (quantity < 2)
- **Manual item addition**
- **Mark as purchased** (removes from list)

### Setup Steps

#### 1. Run Database Migration
Execute in Supabase SQL Editor:
```sql
-- Copy contents from database-migration-shopping-list.sql
-- This creates the shopping_list table with RLS policies
```

**Quick steps:**
```
1. Go to Supabase Dashboard → SQL Editor
2. Open database-migration-shopping-list.sql
3. Copy entire contents
4. Paste in SQL Editor
5. Click "Run"
6. Verify: Should see success message
```

#### 2. Verify Table Creation
Run this query:
```sql
SELECT * FROM pg_tables WHERE tablename = 'shopping_list';
```
Should return 1 row.

#### 3. Test RLS Policies
```sql
-- Should show 5 policies
SELECT * FROM pg_policies WHERE tablename = 'shopping_list';
```

### Usage

#### Add Items from Recipes
1. Go to Recipes page
2. Click on a recipe
3. Click "Add Missing to Shopping List"
4. Missing ingredients auto-added

#### Add Low-Stock Items
1. Go to Shopping List page
2. Click "Low Stock" button
3. Select items to add

#### Manual Addition
1. Click "Add Item"
2. Enter name, quantity, unit
3. Submit

---

## Feature 3: Hey Nosh Voice Assistant

### What It Does
AI-powered voice assistant that can:
- Answer "What's expiring soon?"
- Suggest recipes you can make
- Filter by cuisine (Indian, Italian, Chinese, etc.)
- Show inventory status
- Text-to-speech responses

### Setup Steps

#### 1. Browser Requirements
**Supported Browsers:**
- ✅ Chrome (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ❌ Firefox (limited support)

#### 2. Permissions
Users must grant **microphone permission** when first using.

Browser will show:
```
"noshnurture.app wants to use your microphone"
[Allow] [Block]
```

#### 3. Configure Gemini API
Already configured if you have:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
```

No additional setup needed!

### Usage

#### Desktop
1. Click purple mic button (bottom-right, above nav)
2. Click large mic button in modal
3. Speak your query
4. Listen to response

#### Mobile
1. Tap purple mic button
2. Tap to speak
3. Voice recognition starts
4. Get spoken response

#### Example Queries
```
✅ "What items are expiring soon?"
✅ "What can I cook today?"
✅ "Show me Indian recipes"
✅ "What's in my inventory?"
✅ "Do I have any expired items?"
```

---

## Post-Deployment Checklist

### Email Reminders
- [ ] Resend API key added to Vercel
- [ ] CRON_SECRET added to Vercel
- [ ] SUPABASE_SERVICE_ROLE_KEY added to Vercel
- [ ] Deployed to Vercel
- [ ] Tested cron endpoint manually
- [ ] Verified emails arrive (check spam folder)

### Shopping List
- [ ] Database migration run successfully
- [ ] Table `shopping_list` exists
- [ ] RLS policies active (5 policies)
- [ ] Can add items manually
- [ ] Can delete items
- [ ] Low-stock detection works

### Voice Assistant
- [ ] Gemini API key configured
- [ ] Tested on Chrome/Edge
- [ ] Microphone permission granted
- [ ] Speech recognition works
- [ ] Text-to-speech works
- [ ] Intent detection accurate

---

## Troubleshooting

### Email Reminders

**Emails not sending?**
```
1. Check Resend Dashboard → Logs
2. Verify API key is correct
3. Check Vercel logs for errors
4. Ensure CRON_SECRET matches
```

**Wrong time?**
```
Cron runs at 1:30 AM UTC = 7:00 AM IST
Adjust in vercel.json if needed:
"schedule": "30 1 * * *"  # minute hour day month weekday
```

### Shopping List

**Table not created?**
```sql
-- Check if table exists
\dt shopping_list

-- If missing, re-run migration
-- Copy from database-migration-shopping-list.sql
```

**RLS errors?**
```
Error: "new row violates row-level security policy"
→ User not authenticated
→ Check auth.uid() is set
```

### Voice Assistant

**Microphone not working?**
```
- Check browser permissions
- Use HTTPS (required for mic access)
- Try Chrome/Edge instead of Firefox
- Check system microphone settings
```

**Intent detection failing?**
```
- Verify Gemini API key is valid
- Check API quota not exceeded
- Look at browser console for errors
```

**No voice output?**
```
- Check device volume
- Verify speechSynthesis API available
- Try reloading page
```

---

## File Reference

### Email Reminders
```
src/lib/email/resend.ts               # Email service
src/app/api/cron/send-expiry-reminders/route.ts  # Cron job
vercel.json                            # Cron schedule
```

### Shopping List
```
database-migration-shopping-list.sql   # Database schema
src/app/api/shopping-list/route.ts     # CRUD operations
src/app/api/shopping-list/missing-ingredients/route.ts
src/app/api/shopping-list/low-stock/route.ts
src/app/shopping-list/page.tsx         # UI page
```

### Voice Assistant
```
src/lib/voice-assistant/nosh-service.ts  # Intent detection
src/app/api/voice-assistant/query/route.ts  # Backend logic
src/components/HeyNoshAssistant.tsx    # UI component
```

---

## Environment Variables Complete Reference

```env
# ===== Core Supabase =====
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # NEW: For cron jobs

# ===== Gemini AI =====
NEXT_PUBLIC_GEMINI_API_KEY=xxx

# ===== Email Service =====
RESEND_API_KEY=re_xxx  # NEW: For email reminders

# ===== Cron Security =====
CRON_SECRET=xxx  # NEW: Random secret for cron endpoint

# ===== V-Kart Integration =====
VKART_BASE_URL=https://v-it.netlify.app
VKART_API_KEY=xxx
VKART_SYNC_WINDOW_HOURS=24
```

---

## Support

For issues:
1. Check browser console for errors
2. Verify all environment variables set
3. Check Supabase/Vercel logs
4. Review troubleshooting section above

---

**🎉 Congratulations! All three features are now set up and ready to use!**
