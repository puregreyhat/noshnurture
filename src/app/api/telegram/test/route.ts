/**
 * API endpoint to send a test Telegram message
 * Helps verify Telegram bot is working correctly
 */

import { sendTelegramMessage } from '@/lib/telegram/bot';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('telegram_chat_id, enable_telegram')
      .eq('user_id', user.id)
      .single();

    if (!preferences?.telegram_chat_id) {
      return Response.json({ 
        error: 'Telegram not connected',
        message: 'Please connect your Telegram account first'
      }, { status: 400 });
    }

    if (!preferences.enable_telegram) {
      return Response.json({ 
        error: 'Telegram notifications disabled',
        message: 'Please enable Telegram notifications in Settings'
      }, { status: 400 });
    }

    // Send test message
    const result = await sendTelegramMessage({
      chat_id: preferences.telegram_chat_id,
      text: `🧪 *Test Notification*\n\nHi! This is a test message from NoshNurture.\n\nYou will receive daily expiry reminders and recipe suggestions here.\n\n✅ Your Telegram notifications are working perfectly!`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '⚙️ Open Settings', url: 'https://noshnurture.vercel.app/settings' }
        ]]
      }
    });

    if (!result.success) {
      return Response.json({ 
        error: result.error,
        message: 'Failed to send test message'
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Test message sent successfully! Check your Telegram.',
      chatId: preferences.telegram_chat_id,
    });

  } catch (error) {
    console.error('Error in test-telegram API:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return Response.json({ 
    status: 'ok',
    endpoint: 'telegram/test',
    description: 'Send a test Telegram notification'
  });
}
