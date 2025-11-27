# 🏠 Local Testing Guide for Telegram Bot

## Why Webhooks Don't Work on Localhost

Telegram webhooks require a **public HTTPS URL** that Telegram servers can reach. Your `localhost:3000` is  accessible on your machine, so Telegram can't send messages to it.

## ✅ Solution: Use Polling or Direct Testing

You have 3 options for testing locally:

---

## Option 1: Quick Direct Test (Easiest - 2 minutes)

### Step 1: Get Your Chat ID

1. Open Telegram and send **any message** to `@noshnurture_bot`
2. Open this URL in your browser (replace `<TOKEN>` with your bot token):
   ```
   https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/getUpdates
   ```
3. Look for this in the response:
   ```json
   {
     "message": {
       "chat": {
         "id": 123456789  // ← This is your chat ID
       }
     }
   }
   ```

### Step 2: Run Quick Test

```bash
cd "/Users/akash/Downloads/Compressed/AI NOSH"
node scripts/quick-telegram-test.js 123456789
```

Replace `123456789` with your actual chat ID from Step 1.

**What this does:**
- ✅ Tests bot connection
- ✅ Sends test message
- ✅ Sends message with button
- ✅ Sends sample expiry reminder
- ✅ Sends sample recipe suggestions

You'll receive **4 messages** in Telegram showing all notification types!

---

## Option 2: Polling Bot (For Testing Commands)

This actively checks for new messages and responds to `/start`, `/help`, `/status`.

### Run Polling Bot

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start polling bot
node scripts/test-telegram-bot.js
```

### Test Commands

Now send these to `@noshnurture_bot` in Telegram:

- `/start` - Get welcome message
- `/start USER_abc123` - Simulate deep link connection
- `/help` - Show help message
- `/status` - Check connection status

**The bot will respond in real-time!**

---

## Option 3: ngrok Tunnel (For Full Webhook Testing)

If you want to test the **actual webhook flow**, use ngrok to expose localhost.

### Step 1: Install ngrok

```bash
brew install ngrok
# or download from: https://ngrok.com/download
```

### Step 2: Start ngrok

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000
```

You'll see:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### Step 3: Set Webhook

```bash
curl -X POST "https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/setWebhook?url=https://abc123.ngrok.io/api/telegram/webhook"
```

Replace `abc123.ngrok.io` with your actual ngrok URL.

### Step 4: Test

Send `/start` to `@noshnurture_bot` - it will now hit your local webhook!

---

## 🧪 Testing Different Features

### Test 1: Basic Connection
```bash
node scripts/quick-telegram-test.js <YOUR_CHAT_ID>
```

### Test 2: Expiry Reminders
```bash
# Manually trigger cron endpoint
curl -X GET "http://localhost:3000/api/cron/send-expiry-reminders?secret=qPikjousnN"
```

### Test 3: Recipe Notifications
```bash
# Manually trigger recipe notification
curl -X POST "http://localhost:3000/api/telegram/send-recipes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SUPABASE_JWT>" \
  -d '{
    "recipes": [
      {"title": "Mango Lassi", "cuisine": "Indian"},
      {"title": "Banana Ice Cream", "cuisine": "American"}
    ],
    "recipeCount": 15
  }'
```

### Test 4: Connect Telegram API
```bash
# Save chat ID to database
curl -X POST "http://localhost:3000/api/telegram/connect" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SUPABASE_JWT>" \
  -d '{"chatId": "123456789"}'
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Bot not responding"
**Cause:** Webhook set to a URL that's not reachable
**Solution:** Delete webhook and use polling instead
```bash
curl -X POST "https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/deleteWebhook"
```

### Issue 2: "Unauthorized" errors
**Cause:** Invalid bot token
**Solution:** Check `.env` file has correct `TELEGRAM_BOT_TOKEN`

### Issue 3: "Chat not found"
**Cause:** Wrong chat ID
**Solution:** Get chat ID again using the `/getUpdates` URL

### Issue 4: "Can't send messages"
**Cause:** You haven't started a conversation with the bot
**Solution:** Open Telegram, search `@noshnurture_bot`, click "Start"

---

## 📊 Debugging Commands

### Check bot info
```bash
curl https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/getMe
```

### Check webhook status
```bash
curl https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/getWebhookInfo
```

### Get recent messages
```bash
curl https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/getUpdates
```

### Delete webhook (for local testing)
```bash
curl -X POST "https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/deleteWebhook"
```

### Send test message manually
```bash
curl -X POST "https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "YOUR_CHAT_ID",
    "text": "Hello from localhost!",
    "parse_mode": "Markdown"
  }'
```

---

## 🎯 Recommended Local Testing Workflow

1. **First time setup:**
   ```bash
   # Get your chat ID
   # Open: https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/getUpdates
   
   # Run quick test
   node scripts/quick-telegram-test.js <YOUR_CHAT_ID>
   ```

2. **Daily development:**
   ```bash
   # Terminal 1: Dev server
   npm run dev
   
   # Terminal 2: Polling bot (for testing commands)
   node scripts/test-telegram-bot.js
   ```

3. **Testing specific features:**
   - Use direct API calls (curl commands above)
   - Or use the quick test script with your chat ID

4. **Before deploying:**
   ```bash
   # Test all message types
   node scripts/quick-telegram-test.js <YOUR_CHAT_ID>
   
   # Then deploy and set webhook for production
   ```

---

## 🚀 Moving to Production (Vercel)

When you're ready to deploy:

1. **Delete local webhook:**
   ```bash
   curl -X POST "https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/deleteWebhook"
   ```

2. **Deploy to Vercel:**
   ```bash
   git add -A
   git commit -m "Add Telegram bot integration"
   git push origin main
   ```

3. **Set production webhook:**
   ```bash
   curl -X POST "https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/setWebhook?url=https://noshnurture.vercel.app/api/telegram/webhook"
   ```

4. **Verify:**
   ```bash
   curl https://api.telegram.org/bot8487060397:AAH3fN05g3bObS6o1lQkVktGxutJTiTdiz4/getWebhookInfo
   ```

---

## 📝 Summary

**For localhost testing:**
- ❌ Webhooks won't work (Telegram can't reach localhost)
- ✅ Use polling bot or direct API calls
- ✅ Use `scripts/quick-telegram-test.js` for quick tests
- ✅ Use `scripts/test-telegram-bot.js` for command testing

**For production:**
- ✅ Webhooks work perfectly (public HTTPS URL)
- ✅ Set webhook to your Vercel URL
- ✅ No polling needed

**Quick start now:**
```bash
# Get chat ID from browser, then:
node scripts/quick-telegram-test.js <YOUR_CHAT_ID>
```
