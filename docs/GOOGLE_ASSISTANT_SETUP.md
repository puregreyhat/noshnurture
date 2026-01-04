# Google Assistant Integration Setup Guide

## ✅ Implementation Complete

Your web app now has full Google Assistant integration support with the following endpoints:

### 🔗 Created Endpoints

1. **Webhook Handler** - `/api/assistant/webhook`
   - Handles all Dialogflow fulfillment requests
   - Supports: add items, check inventory, check expiring, remove items, get recipes

2. **OAuth Authorization** - `/api/assistant/auth`
   - Redirects users to account linking page

3. **OAuth Token Exchange** - `/api/assistant/token`
   - Exchanges authorization codes for access tokens

4. **Account Linking UI** - `/auth/assistant-link`
   - Beautiful UI for users to link their Google account

---

## 📋 Step-by-Step Setup in Google Actions Console

### Step 1: Create Actions Project

1. Go to [Google Actions Console](https://console.actions.google.com/)
2. Click **"New Project"**
3. Name: **"HeyNosh"** (or your preferred name)
4. Select **"Custom"** action type
5. Choose **"Blank project"**

### Step 2: Setup Invocation

1. Click **"Invocation"** in the left menu
2. Set **Display name**: `HeyNosh`
3. Set **Invocation name**: `hey nosh` or `nosh nurture`
4. Click **Save**

### Step 3: Create Dialogflow Agent

1. In Actions Console, click **"Actions"** → **"Add your first action"**
2. Select **"Custom intent"** → **Build**
3. This will open Dialogflow ES console

### Step 4: Configure Intents in Dialogflow

#### Intent 1: AddProduct

**Training Phrases:**
```
add tomato
add 2 kg tomato
add milk to inventory
put banana in my list
store 3 apples
add chicken to fridge
```

**Action and parameters:**
```
product_name: @sys.any (required)
quantity: @sys.number (optional, default: 1)
unit: @sys.unit-volume or @sys.unit-weight (optional, default: "pcs")
storage_type: @sys.any (optional, default: "refrigerator")
```

**Fulfillment:** Enable webhook

---

#### Intent 2: CheckInventory

**Training Phrases:**
```
what do I have
check my inventory
list my products
what's in my fridge
show me my food items
what items do I have
```

**Fulfillment:** Enable webhook

---

#### Intent 3: CheckExpiring

**Training Phrases:**
```
what's expiring soon
check expiry dates
what will go bad
expiring items
items about to expire
what's expiring this week
what expires tomorrow
```

**Action and parameters:**
```
days: @sys.number (optional, default: 7)
```

**Fulfillment:** Enable webhook

---

#### Intent 4: RemoveProduct

**Training Phrases:**
```
remove tomato
delete milk
I finished the bread
used up chicken
mark banana as consumed
remove 2 apples
```

**Action and parameters:**
```
product_name: @sys.any (required)
```

**Fulfillment:** Enable webhook

---

#### Intent 5: GetRecipes

**Training Phrases:**
```
what can I cook
recipe suggestions
suggest recipes
what should I make
cooking ideas
what can I make with my ingredients
give me recipe ideas
```

**Fulfillment:** Enable webhook

---

### Step 5: Configure Webhook in Dialogflow

1. In Dialogflow, click **"Fulfillment"** in left menu
2. Enable **"Webhook"**
3. Enter your webhook URL:

```
https://your-app-domain.vercel.app/api/assistant/webhook
```

**For Production:**
```
https://noshnurture.vercel.app/api/assistant/webhook
```

**For Testing (with ngrok):**
```
https://your-ngrok-url.ngrok.io/api/assistant/webhook
```

4. Add custom headers (optional but recommended):
```
Authorization: Bearer YOUR_SECRET_TOKEN
```

5. Click **Save**

---

### Step 6: Setup Account Linking (CRITICAL)

1. In Actions Console, go to **"Develop"** → **"Account linking"**

2. **Account creation:**
   - Select: `No, I only want to allow account creation on my website`

3. **Linking type:**
   - Select: `OAuth` → `Authorization code`

4. **Client information:**
   ```
   Client ID: your-client-id (generate a random string)
   Client Secret: your-client-secret (generate a random string)
   ```

5. **Authorization URL:**
   ```
   https://your-app-domain.vercel.app/api/assistant/auth
   ```

6. **Token URL:**
   ```
   https://your-app-domain.vercel.app/api/assistant/token
   ```

7. **Scopes:**
   ```
   profile
   email
   ```

8. Click **Save**

---

### Step 7: Environment Variables

Add these to your `.env.local` or Vercel environment:

```bash
# Google Assistant Configuration
GOOGLE_ASSISTANT_CLIENT_ID=your-generated-client-id
GOOGLE_ASSISTANT_CLIENT_SECRET=your-generated-client-secret
GOOGLE_ASSISTANT_WEBHOOK_SECRET=your-webhook-secret-token

# App URL (automatically set by Vercel, or set manually)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Generate secure random strings:
```bash
# On Mac/Linux
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 8: Test Your Integration

#### In Dialogflow Simulator:

1. Click **"Try it now"** in Dialogflow
2. Type: `add tomato`
3. Should return: "Added 1 pcs of tomato to your inventory..."

#### In Google Assistant Simulator:

1. In Actions Console, click **"Test"** in top menu
2. Type: `Talk to HeyNosh`
3. Try commands:
   - `add 2 kg tomato`
   - `what's expiring soon`
   - `check my inventory`
   - `suggest recipes`

#### On Real Device:

1. Open Google Home app on your phone
2. Go to **Settings** → **Assistant** → **Your apps**
3. Find **HeyNosh**
4. Click **Link account**
5. Complete sign-in flow
6. Say: **"Hey Google, ask HeyNosh what's expiring"**

---

## 🎯 Supported Voice Commands

### Add Items
```
"Hey Google, ask HeyNosh to add tomato"
"Hey Google, tell HeyNosh to add 2 kg chicken"
"Hey Google, ask HeyNosh to add milk to inventory"
```

### Check Inventory
```
"Hey Google, ask HeyNosh what I have"
"Hey Google, ask HeyNosh to check my inventory"
"Hey Google, ask HeyNosh what's in my fridge"
```

### Check Expiring Items
```
"Hey Google, ask HeyNosh what's expiring soon"
"Hey Google, ask HeyNosh what expires this week"
"Hey Google, ask HeyNosh to check expiry dates"
```

### Remove Items
```
"Hey Google, ask HeyNosh to remove tomato"
"Hey Google, tell HeyNosh I finished the milk"
"Hey Google, ask HeyNosh to delete banana"
```

### Get Recipes
```
"Hey Google, ask HeyNosh for recipe ideas"
"Hey Google, ask HeyNosh what I can cook"
"Hey Google, ask HeyNosh for cooking suggestions"
```

---

## 🔒 Security Best Practices

1. **Webhook Authentication:**
   - Set `GOOGLE_ASSISTANT_WEBHOOK_SECRET` in environment
   - Verify `Authorization` header in webhook requests

2. **OAuth Security:**
   - Use secure random strings for client ID/secret
   - Store in environment variables (never in code)
   - Rotate tokens periodically

3. **Rate Limiting:**
   - Consider adding rate limiting to webhook endpoint
   - Prevent abuse from unauthorized requests

4. **HTTPS Only:**
   - All endpoints must use HTTPS
   - Vercel provides this automatically

---

## 📱 Testing Workflow

### Local Testing with ngrok:

1. Install ngrok: `brew install ngrok` (Mac) or download from ngrok.com

2. Start your dev server:
   ```bash
   npm run dev
   ```

3. Start ngrok tunnel:
   ```bash
   ngrok http 3000
   ```

4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

5. Update Dialogflow webhook URL to:
   ```
   https://abc123.ngrok.io/api/assistant/webhook
   ```

6. Test in Dialogflow simulator

### Production Testing:

1. Deploy to Vercel:
   ```bash
   git push origin main
   ```

2. Update Dialogflow webhook to production URL

3. Test on real devices with Google Assistant

---

## 🐛 Troubleshooting

### "Account linking failed"
- Check OAuth URLs are correct and accessible
- Verify environment variables are set
- Check Supabase auth is working

### "Webhook returned error"
- Check server logs in Vercel dashboard
- Verify webhook URL is correct and HTTPS
- Test webhook directly with Postman

### "User not authenticated"
- Ensure account linking is complete
- Check access token is being passed correctly
- Verify Supabase session is valid

### "Intent not recognized"
- Add more training phrases in Dialogflow
- Check intent name matches webhook handler
- Verify fulfillment is enabled for intent

---

## 📊 Analytics & Monitoring

Monitor your integration in:

1. **Dialogflow Console:**
   - Intent matching rates
   - Webhook response times
   - Error rates

2. **Actions Console:**
   - User engagement
   - Command usage statistics
   - Account linking success rate

3. **Vercel Dashboard:**
   - API endpoint performance
   - Error logs
   - Request volume

---

## 🚀 Next Steps

1. ✅ Deploy webhook endpoints to production
2. ✅ Configure Google Actions project
3. ✅ Setup account linking
4. ✅ Test on simulator
5. ✅ Test on real device
6. Submit for Actions review (for public release)
7. Add more intents (shopping list, meal planning, etc.)
8. Implement rich responses (images, cards)
9. Add multi-language support

---

## 📞 Support

If you encounter issues:

1. Check Vercel logs for API errors
2. Review Dialogflow history for failed intents
3. Test webhook directly with curl/Postman
4. Verify environment variables are set correctly

For more help, refer to:
- [Dialogflow Documentation](https://cloud.google.com/dialogflow/docs)
- [Actions on Google Documentation](https://developers.google.com/assistant)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

---

**Status:** ✅ Integration Complete - Ready to Deploy and Test
