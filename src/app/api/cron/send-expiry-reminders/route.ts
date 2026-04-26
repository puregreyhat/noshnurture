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
  // Cron logic moved or disabled for viva
  return NextResponse.json({ message: 'Cron job disabled' }, { status: 200 });
}
