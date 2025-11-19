/**
 * Manual trigger for expiry reminders (for testing)
 * This bypasses the cron secret check and can be called from the UI
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendExpiryReminderEmail } from '@/lib/email/resend';
import { sendExpiryReminder } from '@/lib/telegram/bot';

export const runtime = 'edge';

interface UserItems {
  userId: string;
  email: string;
  items: Array<{
    product_name: string;
    expiry_date: string;
    days_until_expiry: number;
    quantity: number;
    unit: string;
  }>;
}

// Robust date parser supporting ISO, YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY
function parseExpiryDate(dateStr: string): Date {
  if (!dateStr) return new Date('');
  // If ISO-like, let Date parse
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(dateStr)) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }
  // DD-MM-YYYY
  const dash = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dash) {
    const [_, dd, mm, yyyy] = dash;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }
  // DD/MM/YYYY
  const slash = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    const [_, dd, mm, yyyy] = slash;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }
  // Timestamp or fallback
  const asNum = Number(dateStr);
  if (!Number.isNaN(asNum) && asNum > 0) {
    const d = new Date(asNum);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(dateStr);
}

function calculateDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = parseExpiryDate(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's non-consumed inventory items
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('user_id, product_name, expiry_date, quantity, unit')
      .eq('is_consumed', false)
      .eq('user_id', user.id);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'No items to process', stats: { emailsSent: 0, telegramSent: 0 } }, { status: 200 });
    }

    // Calculate days until expiry and filter relevant items
    const relevantItems = items
      .map(item => ({
        ...item,
        days_until_expiry: calculateDaysUntilExpiry(item.expiry_date),
      }))
      .filter(item => 
        item.days_until_expiry >= -1 && item.days_until_expiry <= 7 // Include today and expired yesterday
      );

    console.log('[Test Reminder] Total items:', items.length, 'Relevant:', relevantItems.length);
    console.log('[Test Reminder] Sample raw dates:', items.slice(0, 5).map(i => i.expiry_date));
    console.log('[Test Reminder] Relevant items:', relevantItems.map(i => `${i.product_name}: ${i.days_until_expiry} days (${i.expiry_date})`));

    if (relevantItems.length === 0) {
      return NextResponse.json({ message: 'No items expiring soon', stats: { emailsSent: 0, telegramSent: 0, totalItems: 0 } }, { status: 200 });
    }

    // Get user preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('[Test Reminder] Preferences fetch error:', prefError);
    }

    const enableEmail = preferences?.enable_email ?? true;
    const enableTelegram = preferences?.enable_telegram ?? false;
    const telegramChatId = preferences?.telegram_chat_id;

    console.log('[Test Reminder] Full Preferences:', { 
      enableEmail, 
      enableTelegram, 
      telegramChatId,
      prefError: prefError?.code,
      userEmail: user.email 
    });

    let emailsSent = 0;
    let telegramSent = 0;
    const userName = user.email?.split('@')[0] || 'there';

    // Send Email if enabled
    if (enableEmail && user.email) {
      console.log('[Test Reminder] ATTEMPTING EMAIL to:', user.email, 'Items:', relevantItems.length);
      const result = await sendExpiryReminderEmail({
        to: user.email,
        userName,
        items: relevantItems,
      });
      console.log('[Test Reminder] Email result:', result);
      if (result.success) {
        emailsSent = 1;
        console.log('[Test Reminder] ✓ Email marked as sent');
      } else {
        console.log('[Test Reminder] ✗ Email failed:', result);
      }
    } else {
      console.log('[Test Reminder] EMAIL SKIPPED:', { enableEmail, hasEmail: !!user.email });
    }

    // Send Telegram if enabled and connected
    if (enableTelegram && telegramChatId) {
      console.log('[Test Reminder] ATTEMPTING TELEGRAM to:', telegramChatId, 'Items:', relevantItems.length);
      const telegramResult = await sendExpiryReminder(
        telegramChatId,
        userName,
        relevantItems
      );
      console.log('[Test Reminder] Telegram result:', telegramResult);
      if (telegramResult.success) {
        telegramSent = 1;
        console.log('[Test Reminder] ✓ Telegram marked as sent');
      } else {
        console.log('[Test Reminder] ✗ Telegram failed:', telegramResult);
      }
    } else {
      console.log('[Test Reminder] TELEGRAM SKIPPED:', { enableTelegram, hasChatId: !!telegramChatId });
    }

    // Send browser notification if permission granted
    const sendBrowserNotif = relevantItems.length > 0;

    return NextResponse.json({
      success: true,
      message: 'Reminders sent',
      stats: {
        totalItems: relevantItems.length,
        emailsSent,
        telegramSent,
        browserNotif: sendBrowserNotif,
      },
    });

  } catch (error) {
    console.error('Manual reminder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
