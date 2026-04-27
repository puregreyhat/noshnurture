
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendExpiryReminder } from '@/lib/telegram/bot';
import { sendExpiryReminderEmail } from '@/lib/email/resend';
import { calculateDaysUntilExpiry } from '@/lib/utils/dateUtils';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch prefs
        const { data: prefs } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Fetch inventory
        const { data: items } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_consumed', false);

        if (!items || items.length === 0) {
            return NextResponse.json({
                stats: { totalItems: 0, emailsSent: 0, telegramSent: 0 }
            });
        }

        // Filter for expiring items (<= 7 days)
        // Recalculate days just to be sure
        const expiringItems = items.map(item => ({
            ...item,
            days_until_expiry: calculateDaysUntilExpiry(item.expiry_date)
        })).filter(item => item.days_until_expiry <= 7);

        if (expiringItems.length === 0) {
            return NextResponse.json({
                stats: { totalItems: 0, emailsSent: 0, telegramSent: 0 }
            });
        }

        let emailSent = false;
        let telegramSent = false;
        const userName = user.email.split('@')[0];

        // Send Email
        if (prefs?.enable_email) {
            const res = await sendExpiryReminderEmail({
                to: user.email,
                userName: userName || 'User',
                items: expiringItems
            });
            if (res.success) emailSent = true;
        }

        // Send Telegram
        if (prefs?.enable_telegram && prefs?.telegram_chat_id) {
            const res = await sendExpiryReminder(
                prefs.telegram_chat_id,
                userName || 'User',
                expiringItems
            );
            if (res.success) telegramSent = true;
        }

        return NextResponse.json({
            stats: {
                totalItems: expiringItems.length,
                emailsSent: emailSent ? 1 : 0,
                telegramSent: telegramSent ? 1 : 0
            }
        });

    } catch (error) {
        console.error('[API] Test reminder error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
