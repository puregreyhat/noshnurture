
import { NextResponse } from 'next/server';
import { verifyTelegramBot, sendTelegramMessage } from '@/lib/telegram/bot';
import { sendExpiryReminderEmail } from '@/lib/email/resend';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const chatId = searchParams.get('chatId');

    const results: any = {
        telegram: {
            bot_verification: null,
            message_test: null,
        },
        email: {
            send_test: null,
        },
    };

    // 1. Verify Telegram Bot
    try {
        const botCheck = await verifyTelegramBot();
        results.telegram.bot_verification = botCheck;

        // 2. Send Test Message if verification succeeded and chatId provided
        if (botCheck.success && chatId) {
            const msgResult = await sendTelegramMessage({
                chat_id: chatId,
                text: '🔔 This is a test notification from NoshNurture! Your bot is working correctly.',
                parse_mode: 'Markdown',
            });
            results.telegram.message_test = msgResult;
        }
    } catch (error) {
        results.telegram.error = String(error);
    }

    // 3. Verify Email if address provided
    if (email) {
        try {
            // Mock item for test email
            const testItem = {
                product_name: "Test Apple",
                expiry_date: new Date().toISOString().split('T')[0],
                days_until_expiry: 2,
                quantity: 1,
                unit: 'pc'
            };

            const emailResult = await sendExpiryReminderEmail({
                to: email,
                userName: "Test User",
                items: [testItem]
            });
            results.email.send_test = emailResult;
        } catch (error) {
            results.email.error = String(error);
        }
    } else {
        results.email.status = "Skipped (no 'email' query param provided)";
    }

    return NextResponse.json(results);
}
