# 🚀 Pre-Deployment Checklist - NoshNurture Multi-Channel Notifications

## 📋 Overview
This checklist verifies all three notification channels (Email, Browser, Telegram) are ready for production deployment.

**Current Status:**
- ✅ Build: Production-ready (27 routes compiled)
- ✅ Email: Working (verified emailsSent: 1)
- ✅ Browser Notifications: Working (Service Worker registered)
- ⚠️ Telegram: Infrastructure ready, needs service role key + connection test
- ✅ Database: Schema created, auto-migration fallbacks in place

---

## Phase 1: LOCAL TESTING (Before Deployment)

### Step 1.1: Verify Build Compiles
```bash
npm run build
```
**Expected:** All 27 routes compile, no errors in output
**Check:** 
- [ ] Build completes in ~10 seconds
- [ ] No red "error" messages
- [ ] Output shows all routes compiled
- [ ] Settings page size ~7KB

**If failed:** Check for TypeScript errors with `npm run type-check`

---

### Step 1.2: Start Dev Server
```bash
npm run dev
```
**Expected:** Dev server running on http://localhost:3000

**Check:**
- [ ] Server starts without errors
- [ ] Terminal shows "ready - started server on 0.0.0.0:3000"
- [ ] Can access http://localhost:3000 in browser

---

### Step 1.3: Test Email Notifications
Go to: http://localhost:3000/settings

**Steps:**
1. Scroll to "Email Notifications"
2. Verify toggle is ON (blue) → **enable_email: true**
3. Click "Send Now" button
4. Check console (F12 → Console tab)

**Expected Output:**
```
[Settings] Reminder response: {
  "success": true,
  "stats": {
    "totalItems": X,
    "emailsSent": 1,
    "telegramSent": 0,
    "browserNotif": "pending"
  }
}
```

**Check:**
- [ ] Console shows `emailsSent: 1`
- [ ] Check your email inbox for notification
- [ ] Email subject: "🕐 Food Expiring Soon"
- [ ] Email contains items expiring in next 7 days

**If failed:**
- Check `.env` has `RESEND_API_KEY`
- Check console for errors in Network tab (F12)
- Verify items exist in inventory with expiry dates

---

### Step 1.4: Test Browser Notifications
**Prerequisites:**
- Enable notifications in Chrome/Safari (browser will ask permission)
- If using localhost, browser notifications require either:
  - Served over HTTPS (use tunnel like `ngrok`)
  - Or fallback to console notification

**Steps:**
1. Go to http://localhost:3000/settings
2. Scroll to "Browser Push Notifications"
3. Click "Send Notification" 
4. Check browser notification appears

**Expected:**
- Notification popup appears with title and message
- Clicking notification should focus the window

**Check:**
- [ ] Service Worker registered: `SW registered: ServiceWorkerRegistration`
- [ ] No errors in console
- [ ] Notification appears or appears in console as fallback

**If failed:**
- Check browser console: no errors about "Illegal constructor"
- Check that `/public/sw.js` exists
- Check browser permissions for notifications

---

### Step 1.5: Test Telegram Connection (Localhost Simulation)
**Important:** Telegram webhook won't work on localhost (Telegram can't reach your local machine), but we can simulate it.

```bash
./test-telegram-locally.sh
```

**What it does:**
1. Asks for your Supabase user ID
2. Simulates a Telegram `/start` command
3. Checks webhook endpoint responds
4. Provides manual testing instructions

**To get your user ID:**
1. Go to https://supabase.com/dashboard
2. Select your project → Authentication → Users
3. Find your user row, copy the `id` column (UUID format)
4. Paste into the script when prompted

**After script runs, manual test:**
1. Go to http://localhost:3000/settings
2. Scroll to "Telegram Notifications"
3. Click "Connect Telegram" button
   - Opens bot chat window
   - Click "Start" or send `/start`
4. Bot responds with verification message
5. Click "✅ Verify & Open Settings"
6. Status should show "Connected" (or pending initial verification)

**Check:**
- [ ] Script runs without errors
- [ ] Webhook endpoint responds (HTTP 200)
- [ ] Can manually connect through bot
- [ ] Settings page recognizes connection

---

### Step 1.6: Verify Database Setup
**Check that user_preferences table exists:**

1. Go to Supabase Dashboard
2. SQL Editor
3. Run this query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' AND table_name='user_preferences';
```

**Expected:** One row returned with `user_preferences`

**If not found:** Run the migration:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `/database-migration-user-preferences.sql`
3. Paste and run

**Check:**
- [ ] Table exists in Supabase
- [ ] RLS policies are enabled
- [ ] Can query: `SELECT * FROM user_preferences WHERE user_id = 'YOUR_USER_ID'`

---

### Step 1.7: Verify Environment Variables
Check `.env` file has all required keys:

```bash
grep -E "SUPABASE_URL|SUPABASE_ANON_KEY|RESEND_API_KEY|CRON_SECRET|SERVICE_ROLE" .env
```

**Expected output:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
RESEND_API_KEY=re_xxx
CRON_SECRET=your_secret_here
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  ← CRITICAL FOR PRODUCTION
```

**Check:**
- [ ] SUPABASE_URL: ✅ Present
- [ ] SUPABASE_ANON_KEY: ✅ Present
- [ ] RESEND_API_KEY: ✅ Present (with valid API key)
- [ ] CRON_SECRET: ✅ Present
- [ ] SUPABASE_SERVICE_ROLE_KEY: ⚠️ **Needed for production**

**Get SUPABASE_SERVICE_ROLE_KEY:**
1. Go to Supabase Dashboard
2. Project Settings (gear icon) → API
3. Copy the `service_role` key (NOT the anon key)
4. Add to `.env`: `SUPABASE_SERVICE_ROLE_KEY=your_key_here`

---

## Phase 2: PRODUCTION DEPLOYMENT

### Step 2.1: Get Missing Environment Variable
**Critical:** Without this, Telegram webhook won't save connections in production.

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Settings" (gear icon) → "API"
4. Copy the `service_role` secret key
5. Keep it secure (contains admin access)

---

### Step 2.2: Add to Vercel Environment
1. Go to https://vercel.com/dashboard
2. Select "noshnurture" project
3. Go to Settings → Environment Variables
4. Click "Add New"
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Paste the key from Supabase
   - **Environments:** ✅ Production ✅ Preview ✅ Development
5. Click "Add"

**Check:**
- [ ] Variable added to all environments
- [ ] Can see masked key in list

---

### Step 2.3: Verify Telegram Bot Webhook
The bot must know where to send messages.

1. Get your Telegram bot token (from BotFather)
2. Go to: `https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo`
3. You should see current webhook URL

**Set webhook to production:**

```bash
# Replace YOUR_BOT_TOKEN and noshnurture.vercel.app with your actual domain
curl -X POST \
  "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -d "url=https://noshnurture.vercel.app/api/telegram/webhook"
```

**Expected response:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

**Check:**
- [ ] Webhook URL set to: `https://YOUR_DOMAIN.vercel.app/api/telegram/webhook`
- [ ] Response shows `"ok": true`

---

### Step 2.4: Deploy to Vercel
```bash
git add .
git commit -m "chore: production deployment - add telegram service role key"
git push origin main
```

**Vercel auto-deploys on push to main branch**

**Check deployment:**
1. Go to https://vercel.com/dashboard
2. Select "noshnurture" project
3. Wait for deployment to complete (green checkmark)
4. Note the deployment URL (usually noshnurture.vercel.app)

**Check:**
- [ ] Deployment shows green checkmark
- [ ] Build logs show no errors
- [ ] Settings page accessible at https://YOUR_DOMAIN/settings

---

## Phase 3: PRODUCTION VERIFICATION

### Step 3.1: Test Settings Page on Production
1. Go to https://YOUR_DOMAIN/settings
2. Check all three notification sections load
3. Open browser DevTools (F12) → Console
4. Should see: `[Settings] Preferences loaded: {...}`

**Check:**
- [ ] Page loads without errors
- [ ] All three notification toggles visible
- [ ] No red errors in console

---

### Step 3.2: Test Email on Production
1. Go to https://YOUR_DOMAIN/settings
2. Scroll to "Email Notifications"
3. Toggle should be ON
4. Click "Send Now"
5. Check console for response

**Expected:**
```
[Settings] Reminder response: {
  "success": true,
  "stats": {
    "emailsSent": 1,
    ...
  }
}
```

**Check:**
- [ ] Console shows `emailsSent: 1`
- [ ] Email received in inbox
- [ ] No authentication errors in Network tab

---

### Step 3.3: Test Browser Notifications on Production
1. Go to https://YOUR_DOMAIN/settings
2. Browser will ask for notification permission → Click "Allow"
3. Scroll to "Browser Push Notifications"
4. Click "Send Notification"
5. Notification should appear on screen

**Check:**
- [ ] Permission request appears
- [ ] Notification shows on screen
- [ ] No errors in console

---

### Step 3.4: Test Telegram Connection on Production
1. Go to https://YOUR_DOMAIN/settings
2. Scroll to "Telegram Notifications"
3. Click "Connect Telegram"
4. Opens Telegram chat
5. Click "Start" or send `/start`
6. Bot responds with verification link
7. Click link
8. Should be redirected back to settings
9. Status should show "Connected"

**Steps after connection:**
1. Click "Send Now" to test notification
2. Should show: "Email: 1, Telegram: 1"
3. Check Telegram for notification message

**Check:**
- [ ] Bot responds to `/start`
- [ ] Verification button works
- [ ] Status updates to "Connected"
- [ ] Can send test notification to Telegram
- [ ] Telegram shows notification with items

---

### Step 3.5: Check Logs
**Email logs:**
```bash
# Go to Vercel Dashboard → Deployments → Production → Logs
# Look for successful email sends
```

**Telegram logs:**
```bash
# Vercel → Deployments → Production → Logs
# Look for webhook calls from Telegram
# Should see: "Received Telegram webhook message"
```

**Check:**
- [ ] No "ERROR" messages in logs
- [ ] Email sends logged correctly
- [ ] Telegram webhook calls logged

---

## Phase 4: FINAL CHECKLIST

### Pre-Deployment ✅
- [ ] Build compiles: `npm run build` succeeds
- [ ] Dev server runs: `npm run dev` works
- [ ] Email works locally: "Send Now" shows `emailsSent: 1`
- [ ] Browser notifications work: Notification appears
- [ ] Database table exists: Query returns user_preferences
- [ ] All env variables present locally

### Production Ready ✅
- [ ] SUPABASE_SERVICE_ROLE_KEY added to Vercel
- [ ] Telegram webhook URL set in BotFather
- [ ] Deployed to Vercel: `git push origin main`
- [ ] Vercel shows green deployment checkmark

### Production Testing ✅
- [ ] Settings page loads on production HTTPS
- [ ] Email works: Received notification
- [ ] Browser notifications work: Saw notification popup
- [ ] Telegram connects: Status shows "Connected"
- [ ] Telegram sends: Bot delivers notification
- [ ] No errors in Vercel logs

### Success! 🎉
All three notification channels working in production:
- 📧 Email: Resend API sending messages
- 🔔 Browser: Service Worker push notifications
- 💬 Telegram: Bot webhook receiving and storing connections

---

## Troubleshooting

### Email Not Sending
**Problem:** `emailsSent: 0` or error in console

**Solutions:**
1. Check `.env` has valid `RESEND_API_KEY`
2. Check inventory has items with expiry dates
3. Check console Network tab for API errors
4. Verify items expire within next 7 days

### Browser Notification Failed
**Problem:** "Illegal constructor" or notification doesn't appear

**Solutions:**
1. Browser must be HTTPS (exception: localhost)
2. Browser must grant notification permission
3. Service Worker must register: Check console for `SW registered`
4. Check `/public/sw.js` exists
5. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Telegram Not Connecting
**Problem:** Bot doesn't respond to `/start`

**Solutions:**
1. Check bot token is valid: `/getMe` endpoint
2. Check webhook URL set correctly (must be HTTPS, no localhost)
3. Check webhook receiving calls: `getWebhookInfo`
4. Check Vercel logs for webhook errors
5. Verify SUPABASE_SERVICE_ROLE_KEY added to Vercel

### Preferences Not Saving
**Problem:** Toggles reset after page refresh

**Solutions:**
1. Check user_preferences table exists in Supabase
2. Check RLS policies allow read/write
3. Check authentication working: Look for user ID in preferences
4. Check Supabase anon key is correct

---

## Rollback Plan
If deployment has critical issues:

1. Revert last commit: `git revert HEAD`
2. Push to main: `git push origin main`
3. Vercel will auto-deploy previous version
4. Identify issue, fix, deploy again

---

## Success Criteria
Production deployment is successful when:

✅ No errors on settings page  
✅ All three notification channels functional  
✅ Email notifications arrive in inbox  
✅ Browser notifications appear on screen  
✅ Telegram bot connects and sends messages  
✅ Preferences persist across page refreshes  
✅ No red errors in Vercel logs  

**Estimated deployment time:** 15-30 minutes including testing
