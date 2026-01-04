# 🎙️ Google Assistant Quick Reference

## ✅ Integration Status

**Status:** ✅ COMPLETE - Ready to configure in Google Actions Console

**Created Files:**
- ✅ `/api/assistant/webhook/route.ts` - Main webhook handler
- ✅ `/api/assistant/auth/route.ts` - OAuth authorization endpoint
- ✅ `/api/assistant/token/route.ts` - OAuth token exchange
- ✅ `/auth/assistant-link/page.tsx` - Account linking UI
- ✅ `test-google-assistant.sh` - Testing script
- ✅ `docs/GOOGLE_ASSISTANT_SETUP.md` - Complete setup guide

---

## 🚀 Quick Setup (5 Minutes)

### 1. Generate OAuth Credentials
```bash
# Generate secure random strings
openssl rand -hex 32  # Client ID
openssl rand -hex 32  # Client Secret
openssl rand -hex 32  # Webhook Secret
```

### 2. Add to Environment Variables
In Vercel Dashboard or `.env`:
```bash
GOOGLE_ASSISTANT_CLIENT_ID=your-client-id
GOOGLE_ASSISTANT_CLIENT_SECRET=your-client-secret
GOOGLE_ASSISTANT_WEBHOOK_SECRET=your-webhook-secret
```

### 3. Deploy to Production
```bash
git add .
git commit -m "Add Google Assistant integration"
git push origin main
```

### 4. Configure in Google Actions Console
1. Go to [console.actions.google.com](https://console.actions.google.com)
2. Create new project: "HeyNosh"
3. Set invocation name: "hey nosh"
4. Add webhook URL: `https://your-app.vercel.app/api/assistant/webhook`
5. Setup account linking with OAuth endpoints
6. Create intents (see full guide)

---

## 🎯 Supported Intents

| Intent | Example Command | Parameters |
|--------|----------------|------------|
| `add_product` | "add 2 kg tomato" | product_name, quantity, unit, storage_type |
| `check_inventory` | "check my inventory" | - |
| `check_expiring` | "what's expiring soon" | days (default: 7) |
| `remove_product` | "remove tomato" | product_name |
| `get_recipes` | "suggest recipes" | - |

---

## 🧪 Testing

### Local Testing (with ngrok)
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Terminal 3: Test webhook
./test-google-assistant.sh http://localhost:3000
```

### Production Testing
```bash
# Test deployed webhook
./test-google-assistant.sh https://noshnurture.vercel.app
```

### Manual Test with curl
```bash
curl -X POST https://your-app.vercel.app/api/assistant/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "queryResult": {
      "intent": { "displayName": "Default Welcome Intent" },
      "parameters": {}
    },
    "originalDetectIntentRequest": {
      "payload": {
        "user": { "accessToken": "test-token" }
      }
    }
  }'
```

---

## 📱 Voice Commands You Can Use

### Adding Items
```
"Hey Google, ask HeyNosh to add tomato"
"Hey Google, tell HeyNosh to add 2 kg chicken"
"Hey Google, ask HeyNosh to add milk to my fridge"
```

### Checking Inventory
```
"Hey Google, ask HeyNosh what I have"
"Hey Google, ask HeyNosh to check my inventory"
"Hey Google, ask HeyNosh what's in my fridge"
```

### Expiring Items
```
"Hey Google, ask HeyNosh what's expiring soon"
"Hey Google, ask HeyNosh what expires this week"
"Hey Google, ask HeyNosh to check expiry dates"
```

### Removing Items
```
"Hey Google, ask HeyNosh to remove tomato"
"Hey Google, tell HeyNosh I finished the milk"
```

### Recipe Suggestions
```
"Hey Google, ask HeyNosh for recipe ideas"
"Hey Google, ask HeyNosh what I can cook"
"Hey Google, ask HeyNosh for cooking suggestions"
```

---

## 🔧 Configuration URLs

### Webhook Endpoint
```
https://your-app.vercel.app/api/assistant/webhook
```

### OAuth Authorization URL
```
https://your-app.vercel.app/api/assistant/auth
```

### OAuth Token URL
```
https://your-app.vercel.app/api/assistant/token
```

### Account Linking Page
```
https://your-app.vercel.app/auth/assistant-link
```

---

## 📊 Monitoring

### Check Webhook Logs
- Vercel Dashboard → Your Project → Logs
- Filter by `/api/assistant/webhook`

### Check Dialogflow Activity
- Dialogflow Console → History
- View all user interactions and responses

### Test Account Linking
1. Google Home App → Settings → Assistant → Your apps
2. Find "HeyNosh"
3. Click "Link account"
4. Complete OAuth flow

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Account linking failed" | Check OAuth URLs are correct and environment variables are set |
| "Webhook timeout" | Check Vercel logs, ensure Supabase queries are fast |
| "User not authenticated" | Ensure access token is being passed from Google Assistant |
| "Intent not recognized" | Add more training phrases in Dialogflow |

---

## 📚 Documentation

- **Full Setup Guide:** `docs/GOOGLE_ASSISTANT_SETUP.md`
- **Test Script:** `./test-google-assistant.sh`
- **Dialogflow Docs:** https://cloud.google.com/dialogflow/docs
- **Actions on Google:** https://developers.google.com/assistant

---

## ✨ Features

✅ Add items by voice with auto-expiry calculation  
✅ Check inventory hands-free  
✅ Get expiring items alerts  
✅ Remove consumed items  
✅ Recipe suggestions based on inventory  
✅ Secure OAuth account linking  
✅ Full webhook fulfillment  
✅ Production-ready error handling  

---

**Next Steps:**
1. Generate OAuth credentials (5 min)
2. Deploy to Vercel (2 min)
3. Configure Google Actions Console (15 min)
4. Test on Google Home device (5 min)
5. 🎉 Start using voice commands!

---

**Support:** Check `docs/GOOGLE_ASSISTANT_SETUP.md` for detailed troubleshooting
