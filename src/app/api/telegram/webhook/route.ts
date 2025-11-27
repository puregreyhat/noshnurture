/**
 * Telegram Webhook Handler
 * Receives messages from Telegram and connects users
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage } from '@/lib/telegram/bot';

export const runtime = 'edge';

interface TelegramUpdate {
  message?: {
    chat: {
      id: number;
      first_name?: string;
      username?: string;
    };
    text?: string;
    from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
  };
}

export async function POST(request: Request) {
  try {
    const update: TelegramUpdate = await request.json();
    console.log('[Telegram Webhook] Received update:', JSON.stringify(update));

    if (!update.message) {
      console.log('[Telegram Webhook] No message in update');
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text || '';
    const userName = update.message.from?.first_name || 'there';
    console.log('[Telegram Webhook] Processing message:', { chatId, text, userName });

    // Handle /start command
    if (text.startsWith('/start')) {
      // Extract payload robustly (Telegram deep link may come as '/start<payload>' or '/start <payload>')
      let userId: string | null = null;
      const rawAfterStart = text.slice(6); // remove '/start'
      if (rawAfterStart) {
        const trimmed = rawAfterStart.trim();
        if (trimmed.length > 0) {
          userId = trimmed.split(/\s+/)[0]; // first token only
        }
      }
      // Legacy space separated fallback
      if (!userId) {
        const parts = text.split(' ');
        if (parts.length > 1 && parts[1].trim().length > 0) {
          userId = parts[1].trim();
        }
      }
      console.log('[Telegram Webhook] Parsed /start payload:', { text, userId });

      if (userId) {
        // Connect this Telegram chat to the user
        console.log('[Telegram Webhook] Connecting user:', userId, 'to chat:', chatId);
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          const { error: upsertError } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: userId,
              telegram_chat_id: chatId.toString(),
              enable_telegram: true,
            }, {
              onConflict: 'user_id',
            });

          if (upsertError) {
            console.error('[Telegram Webhook] Database error:', upsertError);
          } else {
            console.log('[Telegram Webhook] Successfully saved to database');
          }

          const result = await sendTelegramMessage({
            chat_id: chatId,
            text: `🎉 *Connected Successfully!*\n\nHi ${userName}! Your NoshNurture account is now linked.\n\nNotifications enabled:\n• Daily expiry reminders (at your set time)\n• Recipe suggestions when ingredients match\n\nClick the button below to verify and update your status.`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '✅ Verify & Open Settings',
                    url: `https://noshnurture.vercel.app/telegram/success?user=${userId}`,
                  },
                ],
              ],
            },
          });

            console.log('[Telegram Webhook] Send message result:', result);
          } else {
            console.error('[Telegram Webhook] Missing Supabase credentials');
            await sendTelegramMessage({
              chat_id: chatId,
              text: `⚠️ Unable to finalize connection right now (server config missing).\nYour Chat ID: \`${chatId}\`\nPlease try again later or contact support.`,
              parse_mode: 'Markdown',
            });
        }
      } else {
        // No user_id in link - send instructions
        await sendTelegramMessage({
          chat_id: chatId,
          text: `👋 Welcome to *NoshNurture Bot*!\n\nTo connect your account:\n1. Go to noshnurture.vercel.app\n2. Open Settings\n3. Click "Connect Telegram"\n4. You'll be redirected here automatically!\n\nOr send me your Chat ID: \`${chatId}\``,
          parse_mode: 'Markdown',
        });
      }

      return NextResponse.json({ ok: true });
    }

    // Handle other commands
    if (text === '/help') {
      await sendTelegramMessage({
        chat_id: chatId,
        text: `🍲 *NoshNurture Bot Commands*\n\n/start - Connect your account\n/help - Show this message\n/status - Check connection status\n\nYour Chat ID: \`${chatId}\``,
        parse_mode: 'Markdown',
      });
      return NextResponse.json({ ok: true });
    }

    if (text === '/status') {
      await sendTelegramMessage({
        chat_id: chatId,
        text: `✅ Bot is active!\n\nYour Chat ID: \`${chatId}\`\n\nUse this ID to connect in NoshNurture Settings.`,
        parse_mode: 'Markdown',
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: true }); // Always return ok to Telegram
  }
}
