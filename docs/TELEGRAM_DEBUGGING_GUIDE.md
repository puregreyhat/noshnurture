# Telegram Bot Debugging Guide

## ✅ What's Been Added

### 1. Test Notification Buttons
- **Browser Notifications**: Test button appears when push notifications are enabled
- **Telegram**: Test button appears when Telegram is connected and enabled
- Both buttons provide instant feedback on success/error

### 2. Comprehensive Webhook Logging
Added 15+ console.log statements to `/api/telegram/webhook/route.ts`:
- `[Telegram Webhook] Received update:` - Full JSON payload
- `[Telegram Webhook] Processing message:` - chatId, text, userName
- `[Telegram Webhook] Connecting user:` - userId to chatId mapping
- `[Telegram Webhook] Database error:` - Upsert failures
- `[Telegram Webhook] Successfully saved to database`
- `[Telegram Webhook] Send message result:` - Telegram API response

### 3. Test Telegram API Endpoint
Created `/api/telegram/test` endpoint:
- Validates connection and enabled status
- Sends test message with inline keyboard
- Returns detailed error messages

## 🔍 How to Debug Telegram Bot

### Step 1: Verify Webhook is Set
```bash
curl https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/getWebhookInfo
```

Expected response:
```json
{
  "ok": true,
  "result": {
    "url": "https://noshnurture.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

If `url` is empty or different, set it:
```bash
curl -X POST "https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/setWebhook?url=https://noshnurture.vercel.app/api/telegram/webhook"
```

### Step 2: Check Vercel Environment Variables
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
- `TELEGRAM_BOT_TOKEN` = `8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` = Your bot username (without @)
- `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
- `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase URL

**IMPORTANT**: After adding/changing env vars, redeploy the project!

### Step 3: Test the Webhook
Send `/start` to your Telegram bot, then check Vercel logs:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Click "Runtime Logs" tab
4. Look for `[Telegram Webhook]` entries

**What to look for:**
- ✅ `Received update:` - Webhook is receiving messages
- ✅ `Processing message:` - Message parsing works
- ✅ `Connecting user:` - User ID extracted from deep link
- ✅ `Successfully saved to database` - Database connection works
- ✅ `Send message result:` - Telegram API responds
- ❌ `Missing Supabase credentials` - Env vars not set
- ❌ `Database error:` - Supabase connection issue

### Step 4: Test with Test Button
1. Deploy the latest changes to Vercel
2. Go to Settings page
3. Connect Telegram (if not connected)
4. Enable Telegram notifications
5. Click "Send Test" button in Telegram section
6. Check your Telegram bot for the test message

### Step 5: Manual Webhook Test (Optional)
Send a test update directly to your webhook:
```bash
curl -X POST https://noshnurture.vercel.app/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": {"id": 123456789},
      "text": "/start YOUR_USER_ID",
      "from": {"id": 123456789, "first_name": "Test"}
    }
  }'
```

Replace:
- `123456789` with your Telegram chat ID
- `YOUR_USER_ID` with your actual user ID from Supabase

## 🧪 Testing Browser Notifications

### Step 1: Enable Push Notifications
1. Go to Settings page
2. Toggle "Browser Notifications" ON
3. Click "Allow" when browser prompts for permission

### Step 2: Test Notification
1. Click "Send Test" button in Browser Notifications section
2. You should see a notification with:
   - Title: "🍲 NoshNurture Test"
   - Body: "This is a test notification. If you see this, notifications are working!"
   - Clicking it should focus the window

## 🐛 Common Issues & Solutions

### Issue 1: Telegram bot doesn't respond to /start
**Possible Causes:**
1. Webhook not set or wrong URL
   - Solution: Run `getWebhookInfo` and `setWebhook` commands above
2. Environment variables missing in Vercel
   - Solution: Add all required env vars and redeploy
3. Database connection failing
   - Solution: Check `SUPABASE_SERVICE_ROLE_KEY` is correct
4. Edge runtime issue
   - Solution: Logs will show specific error

**Debugging:**
- Check Vercel Runtime Logs for `[Telegram Webhook]` entries
- Look for error messages in logs
- Verify webhook URL matches your deployment URL

### Issue 2: Test Telegram button shows error
**Error: "Not connected to Telegram"**
- Solution: Click "Connect" button first, send `/start` to bot

**Error: "Telegram notifications are disabled"**
- Solution: Toggle Telegram notifications ON (green)

**Error: "Failed to send test message"**
- Solution: Check Vercel logs, verify bot token is correct

### Issue 3: Browser notification doesn't appear
**Possible Causes:**
1. Permission denied
   - Solution: Check browser settings, allow notifications for your site
2. Browser doesn't support notifications
   - Solution: Use Chrome, Firefox, or Edge (latest versions)
3. System Do Not Disturb enabled
   - Solution: Check OS notification settings

## 📋 Checklist

Before asking for help, verify:
- [ ] Webhook URL is set correctly (`getWebhookInfo`)
- [ ] All environment variables exist in Vercel
- [ ] Latest code is deployed (after adding env vars)
- [ ] Checked Vercel Runtime Logs for errors
- [ ] Browser allows notifications (for push testing)
- [ ] Telegram bot username is correct

## 🚀 Next Steps After Successful Testing

Once both test buttons work:
1. Set your notification time in Settings
2. Add ingredients to your pantry
3. System will send notifications at your chosen time
4. You'll get recipe suggestions when ingredients are about to expire

## 📞 Getting Your Telegram Chat ID

If you need your chat ID for testing:
1. Message your bot: `/start`
2. Go to: `https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/getUpdates`
3. Look for `"chat":{"id":123456789}` in the response
4. Your chat ID is the number after `"id":`

## 🔗 Useful Links

- **Telegram Bot API Docs**: https://core.telegram.org/bots/api
- **Test Webhook**: https://noshnurture.vercel.app/api/telegram/webhook
- **Test Telegram Endpoint**: https://noshnurture.vercel.app/api/telegram/test
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard

---

**Last Updated**: After adding test buttons and comprehensive logging
