/**
 * Test endpoint to send a sample expiry email to the logged-in user
 * Use this to verify Resend is working before relying on the cron job
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendExpiryReminderEmail } from '@/lib/email/resend';

export async function POST() {
  try {
    // Get current user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Not authenticated or no email found' },
        { status: 401 }
      );
    }

    // Create sample expiry items for testing
    const testItems = [
      {
        product_name: 'Milk',
        expiry_date: new Date().toISOString().split('T')[0], // Today
        days_until_expiry: 0,
        quantity: 1,
        unit: 'L',
      },
      {
        product_name: 'Bread',
        expiry_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        days_until_expiry: 1,
        quantity: 1,
        unit: 'pack',
      },
      {
        product_name: 'Yogurt',
        expiry_date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days
        days_until_expiry: 3,
        quantity: 2,
        unit: 'cups',
      },
    ];

    // Extract username from email
    const userName = user.email.split('@')[0];

    // Send test email
    const result = await sendExpiryReminderEmail({
      to: user.email,
      userName,
      items: testItems,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Email failed: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${user.email}`,
      sentTo: user.email,
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
