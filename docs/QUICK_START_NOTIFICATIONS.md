# 🚀 QUICK START: Multi-Channel Notifications

## 1️⃣ Create Telegram Bot (2 minutes)
```
1. Open Telegram → Search @BotFather
2. Send: /newbot
3. Name: NoshNurture Reminder Bot
4. Username: noshnurture_bot
5. Copy token: 123456789:ABCdef...
```

## 2️⃣ Set Environment Variables in Vercel
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdef...
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=noshnurture_bot
```

## 3️⃣ Run Database Migration
```sql
-- Copy & paste from: database-migration-notifications.sql
-- Run in: Supabase SQL Editor
```

## 4️⃣ Set Webhook
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<YOUR_DOMAIN>/api/telegram/webhook"
```

## 5️⃣ Deploy & Test
```
1. Push to Vercel
2. Go to Settings page
3. Set notification time
4. Click "Connect Telegram"
5. Send /start in bot
6. ✅ Done!
```

---

## 📱 What Users Get

### Daily Reminders (at chosen time)
- Email (if enabled)
- Telegram (if connected)
- Browser push (coming soon)

### Recipe Notifications (when recipes > 0)
- Automatic Telegram message
- Top 10 recipes with match %
- "View All Recipes" button

---

## 🎯 Key Features

✅ Customizable notification time (5 AM, 7 AM, 10 AM, etc.)
✅ Multi-channel (Email + Telegram + Web Push)
✅ Recipe suggestions when available
✅ One-click Telegram connection
✅ Hourly cron for flexible timing
✅ Respects user preferences

---

## 📊 Files Created/Modified

### New Files (7)
- `src/lib/telegram/bot.ts`
- `src/app/api/telegram/connect/route.ts`
- `src/app/api/telegram/webhook/route.ts`
- `src/app/api/telegram/send-recipes/route.ts`
- `src/app/api/user/preferences/route.ts`
- `database-migration-notifications.sql`
- `TELEGRAM_SETUP_GUIDE.md`

### Modified Files (4)
- `src/app/settings/page.tsx` (notification UI)
- `src/app/api/cron/send-expiry-reminders/route.ts` (multi-channel)
- `vercel.json` (hourly cron)
- `src/components/pages/Dashboard.tsx` (recipe trigger)

---

## 🐛 Quick Troubleshooting

**Bot not responding?**
```bash
curl https://api.telegram.org/bot<TOKEN>/getMe
```

**Webhook not working?**
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

**Notifications not sending?**
1. Check env vars in Vercel
2. Verify database migration ran
3. Check user has `enable_telegram: true`
4. Verify `telegram_chat_id` stored

---

## 📚 Documentation

- **Full guide:** `NOTIFICATION_SYSTEM_COMPLETE.md`
- **Setup:** `TELEGRAM_SETUP_GUIDE.md`
- **Database:** `database-migration-notifications.sql`

---

**Status:** ✅ READY TO DEPLOY
