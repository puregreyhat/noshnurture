/**
 * API endpoint to connect Telegram account
 * User clicks "Connect Telegram" button and gets redirected to bot
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { chatId } = await request.json();

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update or insert user preferences
    const { error: upsertError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        telegram_chat_id: chatId,
        enable_telegram: true,
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Error updating Telegram preferences:', upsertError);
      return NextResponse.json({ error: 'Failed to save Telegram connection' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Telegram connected successfully!' 
    });

  } catch (err) {
    console.error('Error in Telegram connect:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Telegram connection status
    const { data, error } = await supabase
      .from('user_preferences')
      .select('telegram_chat_id, enable_telegram')
      .eq('user_id', user.id)
      .single();

    // Handle missing table or missing row gracefully
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // No row found or table doesn't exist — not connected
        console.log('Telegram status check - no preferences found:', error.code);
        return NextResponse.json({
          connected: false,
          enabled: false,
        });
      }
      
      console.error('Error fetching Telegram status:', error);
      return NextResponse.json({ error: 'Failed to fetch connection status' }, { status: 500 });
    }

    return NextResponse.json({
      connected: !!data?.telegram_chat_id,
      enabled: data?.enable_telegram || false,
    });

  } catch (err) {
    console.error('Error fetching Telegram status:', err);
    return NextResponse.json({
      connected: false,
      enabled: false,
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Disconnect Telegram
    const { error: updateError } = await supabase
      .from('user_preferences')
      .update({
        telegram_chat_id: null,
        enable_telegram: false,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error disconnecting Telegram:', updateError);
      return NextResponse.json({ error: 'Failed to disconnect Telegram' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Telegram disconnected successfully' 
    });

  } catch (err) {
    console.error('Error disconnecting Telegram:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
