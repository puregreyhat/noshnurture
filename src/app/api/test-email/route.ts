
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendExpiryReminderEmail } from '@/lib/email/resend';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Mock item for test
        const testItem = {
            product_name: "Test Red Apple (Sample)",
            expiry_date: new Date().toISOString(),
            days_until_expiry: 2,
            quantity: 1,
            unit: 'pc'
        };

        const result = await sendExpiryReminderEmail({
            to: user.email,
            userName: user.email.split('@')[0] || 'User',
            items: [testItem]
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Test email error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
