/**
 * Send expiry email with REAL inventory items for the logged-in user
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendExpiryReminderEmail } from '@/lib/email/resend';

/**
 * Calculate days until expiry dynamically
 */
function calculateDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

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

    // Fetch user's actual inventory items with WARNING or CAUTION status (same as inventory filter)
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('product_name, expiry_date, quantity, unit, status, days_until_expiry')
      .eq('user_id', user.id)
      .eq('is_consumed', false)
      .in('status', ['warning', 'caution'])
      .order('days_until_expiry', { ascending: true });

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { message: 'No items in warning or caution status (nothing expiring soon)' },
        { status: 200 }
      );
    }

    // Use items directly with their existing days_until_expiry from DB
    const relevantItems = items.map(item => ({
      product_name: item.product_name,
      expiry_date: item.expiry_date,
      quantity: item.quantity,
      unit: item.unit,
      days_until_expiry: item.days_until_expiry,
    }));

    // Extract username from email
    const userName = user.email.split('@')[0];

    // Send email with real inventory
    const result = await sendExpiryReminderEmail({
      to: user.email,
      userName,
      items: relevantItems,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Email failed: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${user.email} with ${relevantItems.length} expiring items`,
      sentTo: user.email,
      itemsIncluded: relevantItems.length,
      items: relevantItems.map(i => `${i.product_name} (${i.days_until_expiry} days)`),
    });

  } catch (error) {
    console.error('Real expiry email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
