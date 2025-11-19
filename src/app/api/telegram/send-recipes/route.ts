/**
 * API Route: Send Recipe Suggestions via Telegram
 * 
 * Triggered when user has recipes available (count > 0)
 * Sends top 10 recipes with match percentages
 */

import { sendRecipeSuggestions } from '@/lib/telegram/bot';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipes, recipeCount } = body;

    // Validate input
    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      return Response.json({ error: 'Recipes array required' }, { status: 400 });
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('telegram_chat_id, enable_telegram')
      .eq('user_id', user.id)
      .single();

    if (!preferences?.enable_telegram || !preferences?.telegram_chat_id) {
      return Response.json({ 
        error: 'Telegram not connected or disabled',
        connected: false 
      }, { status: 400 });
    }

    // Get user name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || user.email?.split('@')[0] || 'Chef';

    // Send recipe suggestions via Telegram
    const result = await sendRecipeSuggestions(
      preferences.telegram_chat_id,
      userName,
      recipes.slice(0, 10), // Top 10 recipes
      recipeCount || recipes.length
    );

    if (!result.success) {
      return Response.json({ 
        error: result.error
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Recipe suggestions sent via Telegram',
      recipesCount: recipes.length,
      chatId: preferences.telegram_chat_id,
    });

  } catch (error) {
    console.error('Error in send-recipes API:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return Response.json({ 
    status: 'ok',
    endpoint: 'telegram/send-recipes',
    description: 'Send recipe suggestions via Telegram when recipes > 0'
  });
}
