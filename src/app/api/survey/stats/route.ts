import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Fetch all survey responses
    const { data: responses, error } = await supabase
      .from('survey_responses')
      .select('*');

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch survey data' }, { status: 500 });
    }

    if (!responses || responses.length === 0) {
      return NextResponse.json(
        {
          totalResponses: 0,
          userTypeDistribution: {},
          averageHouseholdSize: 0,
          expiryForgetfulnessAvg: 0,
          cookingStressAvg: 0,
          groceryManagementAvg: 0,
          featurePreferences: {},
          featureRatings: {},
          duplicateBuyingPercentage: 0,
        },
        { status: 200 }
      );
    }

    // Calculate statistics
    const stats = calculateStats(responses);

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateStats(responses: any[]) {
  const total = responses.length;

  // User type distribution
  const userTypeDistribution = responses.reduce(
    (acc, r) => {
      acc[r.user_type || 'Unknown'] = (acc[r.user_type || 'Unknown'] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Average household size
  const averageHouseholdSize =
    responses.reduce((sum, r) => sum + (r.household_size || 0), 0) / total;

  // Average metrics (0-3 scale, display as 1-4)
  const expiryForgetfulnessAvg =
    responses.reduce((sum, r) => sum + (r.expiry_forgetfulness || 0) + 1, 0) / total;

  const cookingStressAvg = responses.reduce((sum, r) => sum + (r.cooking_stress || 0) + 1, 0) / total;

  const groceryManagementAvg =
    responses.reduce((sum, r) => sum + (r.grocery_management || 0) + 1, 0) / total;

  // Feature preferences (percentage of users who want them)
  const wantsExpiryAlerts = (responses.filter((r) => r.wants_expiry_alerts).length / total) * 100;
  const wantsMultilingual =
    (responses.filter((r) => r.wants_multilingual).length / total) * 100;
  const wantsVoiceAssistant =
    (responses.filter((r) => r.wants_voice_assistant).length / total) * 100;
  const wantsShoppingList =
    (responses.filter((r) => r.wants_shopping_list).length / total) * 100;

  const featurePreferences = {
    'Expiry Alerts': Math.round(wantsExpiryAlerts),
    'Multilingual Recipes': Math.round(wantsMultilingual),
    'Voice Assistant': Math.round(wantsVoiceAssistant),
    'Shopping List': Math.round(wantsShoppingList),
  };

  // Feature ratings (average of 0-5 scale, convert to 1-5 for display)
  const featureRatings: Record<string, number> = {};
  const features = [
    'expiryAlerts',
    'recipeSuggestions',
    'billUpload',
    'voiceAssistant',
    'shoppingList',
    'aiLabelScanner',
  ];

  features.forEach((feature) => {
    const ratings = responses
      .filter((r) => r.feature_ratings && r.feature_ratings[feature])
      .map((r) => r.feature_ratings[feature]);

    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0;
    
    // Map feature keys to display names
    const featureNameMap: Record<string, string> = {
      'expiryAlerts': 'Expiry Alerts',
      'recipeSuggestions': 'Recipe Suggestions',
      'billUpload': 'Bill Upload',
      'voiceAssistant': 'Voice Assistant',
      'shoppingList': 'Shopping List',
      'aiLabelScanner': 'Ai Label Scanner'
    };
    
    const featureName = featureNameMap[feature] || feature;
    featureRatings[featureName] = avg;
  });

  // Duplicate buying percentage
  const duplicateBuyingPercentage = Math.round(
    (responses.filter((r) => r.duplicate_buying).length / total) * 100
  );

  return {
    totalResponses: total,
    userTypeDistribution,
    averageHouseholdSize,
    expiryForgetfulnessAvg,
    cookingStressAvg,
    groceryManagementAvg,
    featurePreferences,
    featureRatings,
    duplicateBuyingPercentage,
  };
}
