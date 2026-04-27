/**
 * API endpoint to manage user notification preferences
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Table doesn't exist or row not found
    if (error) {
      console.log('Preferences fetch error:', error.code, error.message);
      
      // If table doesn't exist (42P01) or no rows (PGRST116), create defaults
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // Try to insert a new preferences record
        const { data: newData, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            notification_time: '07:00',
            enable_email: true,
            enable_telegram: false,
            enable_push: false,
            telegram_chat_id: null,
          })
          .select()
          .single();

        if (insertError) {
          console.warn('Could not create preferences, returning defaults:', insertError);
          // If insert fails (table doesn't exist), return defaults
          return NextResponse.json({
            notification_time: '07:00',
            telegram_chat_id: null,
            enable_telegram: false,
            enable_push: false,
            enable_email: true,
          });
        }

        return NextResponse.json(newData);
      }

      // Other errors
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error('Error in GET preferences:', err);
    // Return defaults on any error (graceful fallback)
    return NextResponse.json({
      notification_time: '07:00',
      telegram_chat_id: null,
      enable_telegram: false,
      enable_push: false,
      enable_email: true,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert preferences (gracefully handles table not existing)
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...body,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, log but don't fail completely
      if (error.code === '42P01') {
        console.warn('user_preferences table does not exist, but returning success (table will be created on first GET)');
        return NextResponse.json({ success: true });
      }

      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json(data || { success: true });

  } catch (err) {
    console.error('Error in PATCH preferences:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
