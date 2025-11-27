# Telegram Bot Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Choose a name: `NoshNurture Reminder Bot`
4. Choose a username: `noshnurture_bot` (or your choice, must end with `bot`)
5. Copy the **API Token** (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Set Webhook (Optional - for instant connection)

Run this command (replace `YOUR_BOT_TOKEN` and `YOUR_VERCEL_URL`):

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_VERCEL_URL/api/telegram/webhook"
```

Example:
```bash
curl -X POST "https://api.telegram.org/bot123456789:ABCdef/setWebhook?url=https://noshnurture.vercel.app/api/telegram/webhook"
```

### Step 3: Add Environment Variables

Add these to your Vercel dashboard (Settings → Environment Variables):

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=noshnurture_bot
```

### Step 4: Deploy

Push your code to Vercel. The bot will be active immediately!

---

## How Users Connect

### Method 1: Click Connect Button (Easiest)

1. User goes to Settings page
2. Clicks "Connect Telegram" button
3. Opens Telegram automatically
4. Clicks "Start" in bot chat
5. ✅ Connected!

### Method 2: Manual Connection

1. User opens Telegram
2. Searches for `@noshnurture_bot`
3. Sends `/start`
4. Bot replies with their Chat ID
5. User copies Chat ID and pastes in Settings

---

## Bot Commands

- `/start` - Connect account
- `/help` - Show help message
- `/status` - Check connection status

---

## Telegram Features

### 1. Daily Reminders

Bot sends at user's chosen time (customizable in Settings):

```
🍲 NoshNurture Reminder

Hi akash! 👋

Here are items that need your attention:

🟡 Expires Tomorrow
• Milk (1 item)

🟠 Expires in 2 Days
• Dahi (1 kg)

💡 What can you do?
• Check recipe suggestions
• Cook meals using expiring items
• Share or donate if you can't use them

[🌐 Visit NoshNurture]
```

### 2. Recipe Suggestions (When Available)

When recipes > 0, bot automatically sends:

```
🍳 Recipe Suggestions Available!

Hi akash! 👋

You can now make 15 recipes with items in your inventory!

1. Mango Lassi (100% match)
2. Banana Ice Cream (50% match)
3. Kheer (Rice Pudding) (40% match)
4. Dalgona Coffee (33% match)
5. Chocolate Mug Cake (25% match)

...and 10 more recipes!

👨‍🍳 Ready to cook? Visit NoshNurture to see full recipes!

[👀 View All Recipes]
```

---

## Testing

### Test Bot Connection
```bash
curl https://api.telegram.org/botYOUR_TOKEN/getMe
```

### Test Sending Message
```bash
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"YOUR_CHAT_ID","text":"Test message"}'
```

### Get Chat ID
1. Send any message to your bot
2. Visit: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`
3. Find `"chat":{"id":123456789}` in the response

---

## Recipe Notification Trigger

Create a new API endpoint to trigger recipe notifications:

**File:** `src/app/api/telegram/send-recipes/route.ts`

```typescript
import { sendRecipeSuggestions } from '@/lib/telegram/bot';

export async function POST(request: Request) {
  const { chatId, userName, recipes, recipeCount } = await request.json();
  
  const result = await sendRecipeSuggestions(
    chatId,
    userName,
    recipes,
    recipeCount
  );
  
  return Response.json(result);
}
```

**Trigger when recipes > 0:**

```typescript
// In your dashboard page or recipe fetch logic
if (recipes.length > 0 && user.enableTelegram && user.telegramChatId) {
  await fetch('/api/telegram/send-recipes', {
    method: 'POST',
    body: JSON.stringify({
      chatId: user.telegramChatId,
      userName: user.name,
      recipes: recipes.slice(0, 10),
      recipeCount: recipes.length,
    }),
  });
}
```

---

## Troubleshooting

**Bot not responding?**
- Check TELEGRAM_BOT_TOKEN is correct
- Verify webhook is set: `https://api.telegram.org/botTOKEN/getWebhookInfo`
- Check Vercel logs for errors

**Users can't connect?**
- Ensure NEXT_PUBLIC_TELEGRAM_BOT_USERNAME matches your bot username
- Check database migration ran successfully
- Verify user_preferences table exists

**Notifications not sending?**
- Check user has `enable_telegram: true` in database
- Verify `telegram_chat_id` is stored
- Check cron job logs in Vercel

---

## Security Notes

- Never commit `TELEGRAM_BOT_TOKEN` to git
- Use environment variables only
- Webhook URL should be HTTPS
- Validate user IDs before connecting accounts
