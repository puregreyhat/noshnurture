import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Survey API] Received submission:', {
      userId: body.userId,
      userType: body.userType,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    const {
      userId,
      firstName,
      lastName,
      userType,
      householdSize,
      expiryForgetfulness,
      cookingStress,
      duplicateBuying,
      groceryManagement,
      wantsExpiryAlerts,
      wantsMultilingual,
      wantsVoiceAssistant,
      wantsShoppingList,
      featureRatings,
      additionalFeedback,
    } = body;

    // Validate required fields
    if (!userId) {
      console.error('[Survey API] Missing userId');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Insert survey response
    const { data, error } = await supabase.from('survey_responses').insert([
      {
        user_id: userId,
        first_name: firstName || null,
        last_name: lastName || null,
        user_type: userType,
        household_size: parseInt(householdSize) || null,
        expiry_forgetfulness: expiryForgetfulness,
        cooking_stress: cookingStress,
        duplicate_buying: duplicateBuying,
        grocery_management: groceryManagement,
        wants_expiry_alerts: wantsExpiryAlerts,
        wants_multilingual: wantsMultilingual,
        wants_voice_assistant: wantsVoiceAssistant,
        wants_shopping_list: wantsShoppingList,
        feature_ratings: featureRatings,
        additional_feedback: additionalFeedback,
      },
    ]);

    if (error) {
      console.error('[Survey API] Supabase insert error:', error);
      console.error('[Survey API] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return NextResponse.json(
        {
          error: 'Failed to save survey response',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log('[Survey API] Survey saved successfully:', data);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('[Survey API] Internal server error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
