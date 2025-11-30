/**
 * Cron job to send expiry reminder emails/notifications
 * Runs every hour and checks user preferences for notification time
 * Triggered by Vercel Cron
 */

import { NextResponse } from 'next/server';

// Runtime config for Edge Functions
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Cron job disabled' }, { status: 200 });
}

/*
import { createClient } from '@supabase/supabase-js';
import { sendExpiryReminderEmail } from '@/lib/email/resend';
import { sendExpiryReminder } from '@/lib/telegram/bot';

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

function calculateDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all non-consumed inventory items
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('user_id, product_name, expiry_date, quantity, unit')
      .eq('is_consumed', false);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'No items to process' }, { status: 200 });
    }

    // Calculate days until expiry dynamically and filter relevant items
    const relevantItems = items
      .map(item => ({
        ...item,
        days_until_expiry: calculateDaysUntilExpiry(item.expiry_date),
      }))
      .filter(item => 
        item.days_until_expiry >= 0 && item.days_until_expiry <= 7 // All items expiring in next 7 days
      );

    if (relevantItems.length === 0) {
      return NextResponse.json({ message: 'No items expiring soon' }, { status: 200 });
    }

    // Group items by user
    const userItemsMap = new Map<string, UserItems>();
    
    for (const item of relevantItems) {
      if (!userItemsMap.has(item.user_id)) {
        userItemsMap.set(item.user_id, {
          userId: item.user_id,
          email: '',
          items: [],
        });
      }
      userItemsMap.get(item.user_id)!.items.push({
        product_name: item.product_name,
        expiry_date: item.expiry_date,
        days_until_expiry: item.days_until_expiry,
        quantity: item.quantity,
        unit: item.unit,
      });
    }

    // Fetch user emails from auth and their notification preferences
    const emailsSent: string[] = [];
    const emailsFailed: string[] = [];
    const telegramSent: string[] = [];
    const telegramFailed: string[] = [];

    // Get current time in HH:MM format (IST)
    const now = new Date();
    const currentHour = String(now.getUTCHours() + 5).padStart(2, '0'); // Convert to IST (+5:30 simplified to +5 for hour)
    const currentMinute = String(now.getUTCMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    for (const [userId, userData] of userItemsMap.entries()) {
      try {
        // Get user preferences
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        // Default preferences if not found
        const notificationTime = preferences?.notification_time || '07:00';
        const enableEmail = preferences?.enable_email ?? true;
        const enableTelegram = preferences?.enable_telegram ?? false;
        const telegramChatId = preferences?.telegram_chat_id;

        // Check if it's the right time for this user (within 1 hour window)
        const [targetHour] = notificationTime.split(':');
        if (currentHour !== targetHour) {
          console.log(`Skipping user ${userId} - not their notification time (${currentHour} != ${targetHour})`);
          continue;
        }

        // Get user email from Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

        if (authError || !authUser?.user?.email) {
          console.error(`No email for user ${userId}:`, authError);
          emailsFailed.push(userId);
          continue;
        }

        userData.email = authUser.user.email;

        // Extract user name from email (before @)
        const userName = authUser.user.email.split('@')[0];

        // Send Email if enabled
        if (enableEmail) {
          const result = await sendExpiryReminderEmail({
            to: userData.email,
            userName,
            items: userData.items,
          });

          if (result.success) {
            emailsSent.push(userData.email);
          } else {
            console.error(`Failed to send email to ${userData.email}:`, result.error);
            emailsFailed.push(userData.email);
          }
        }

        // Send Telegram if enabled and connected
        if (enableTelegram && telegramChatId) {
          const telegramResult = await sendExpiryReminder(
            telegramChatId,
            userName,
            userData.items
          );

          if (telegramResult.success) {
            telegramSent.push(userData.email);
          } else {
            console.error(`Failed to send Telegram to ${userData.email}:`, telegramResult.error);
            telegramFailed.push(userData.email);
          }
        }

      } catch (err) {
        console.error(`Error processing user ${userId}:`, err);
        emailsFailed.push(userId);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Expiry reminders processed',
      stats: {
        totalItems: relevantItems.length,
        emailsSent: emailsSent.length,
        emailsFailed: emailsFailed.length,
        telegramSent: telegramSent.length,
        telegramFailed: telegramFailed.length,
        sentTo: emailsSent,
        telegramTo: telegramSent,
      },
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
*/
