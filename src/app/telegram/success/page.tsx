/**
 * Telegram Connection Success Handler
 * This page is opened when user clicks the callback link from Telegram
 * It marks the connection as verified and redirects to Settings
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function TelegramSuccessPage({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  const userId = searchParams.user;

  if (userId) {
    // Verify connection exists in database
    const supabase = await createClient();
    const { data } = await supabase
      .from('user_preferences')
      .select('telegram_chat_id')
      .eq('user_id', userId)
      .single();

    if (data?.telegram_chat_id) {
      // Connection verified, redirect to settings with success flag
      redirect('/settings?telegram=connected');
    }
  }

  // If no userId or no connection found, redirect to settings
  redirect('/settings');
}
