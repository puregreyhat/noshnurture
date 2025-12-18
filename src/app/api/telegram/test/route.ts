
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTelegramMessage } from '@/lib/telegram/bot';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get chat ID
        const { data: prefs } = await supabase
            .from('user_preferences')
            .select('telegram_chat_id')
            .eq('user_id', user.id)
            .single();

        if (!prefs?.telegram_chat_id) {
            return NextResponse.json({ error: 'Telegram not connected. Please connect via Settings.' }, { status: 400 });
        }

        const result = await sendTelegramMessage({
            chat_id: prefs.telegram_chat_id,
            text: "🔔 *Test Notification*\n\nThis is a test message from NoshNurture to confirm your connection is working!\n\n/status - Check connection",
            parse_mode: 'Markdown'
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[API] Test Telegram error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
