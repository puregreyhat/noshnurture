/**
 * Google Assistant / Dialogflow Webhook Handler
 * Handles fulfillment requests from Google Actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDefaultExpiryDate, getDefaultExpiryDays } from '@/lib/default-expiry';

interface DialogflowRequest {
  responseId: string;
  queryResult: {
    queryText: string;
    intent: {
      name: string;
      displayName: string;
    };
    parameters: Record<string, any>;
    languageCode: string;
  };
  originalDetectIntentRequest: {
    source: string;
    payload: {
      user: {
        userId: string;
        accessToken?: string;
      };
    };
  };
  session: string;
}

interface DialogflowResponse {
  fulfillmentText?: string;
  fulfillmentMessages?: Array<{
    text: {
      text: string[];
    };
  }>;
  payload?: Record<string, any>;
}

// Helper to create Dialogflow response
function createResponse(text: string): DialogflowResponse {
  return {
    fulfillmentText: text,
    fulfillmentMessages: [
      {
        text: {
          text: [text],
        },
      },
    ],
  };
}

// Verify webhook authenticity (optional but recommended)
function verifyWebhookAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.GOOGLE_ASSISTANT_WEBHOOK_SECRET;
  
  if (!expectedToken) {
    // If no secret is set, allow all requests (development mode)
    return true;
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === expectedToken;
}

// Handler: Add Product to Inventory
async function handleAddProduct(
  supabase: any,
  userId: string,
  params: any
): Promise<DialogflowResponse> {
  try {
    const productName = params.product_name || params['product-name'] || params.product;
    const quantity = params.quantity || 1;
    const unit = params.unit || 'pcs';
    const storageType = params.storage_type || params['storage-type'] || 'refrigerator';

    if (!productName) {
      return createResponse("I didn't catch the product name. Could you try again?");
    }

    // Auto-calculate expiry using existing logic
    const expiryDate = getDefaultExpiryDate(productName, storageType);
    const daysUntilExpiry = getDefaultExpiryDays(productName, storageType);

    // Insert into database
    const { error } = await supabase
      .from('inventory_items')
      .insert({
        user_id: userId,
        product_name: productName,
        quantity: Number(quantity),
        unit: unit,
        expiry_date: expiryDate.toISOString().split('T')[0],
        days_until_expiry: daysUntilExpiry,
        storage_type: storageType,
        is_consumed: false,
        status: daysUntilExpiry <= 2 ? 'warning' : daysUntilExpiry <= 5 ? 'caution' : 'fresh',
      });

    if (error) {
      console.error('Add product error:', error);
      return createResponse(`Sorry, I couldn't add ${productName}. Please try again.`);
    }

    return createResponse(
      `Added ${quantity} ${unit} of ${productName} to your inventory. It will expire in about ${daysUntilExpiry} days.`
    );
  } catch (error) {
    console.error('handleAddProduct error:', error);
    return createResponse('Sorry, something went wrong while adding the item.');
  }
}

// Handler: Check Inventory
async function handleCheckInventory(
  supabase: any,
  userId: string
): Promise<DialogflowResponse> {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('product_name, quantity, unit')
      .eq('user_id', userId)
      .eq('is_consumed', false)
      .limit(10);

    if (error) {
      console.error('Check inventory error:', error);
      return createResponse('Sorry, I had trouble checking your inventory.');
    }

    if (!data || data.length === 0) {
      return createResponse('Your inventory is empty. Start adding items to track your groceries!');
    }

    const itemList = data
      .map((item: any) => `${item.quantity} ${item.unit} of ${item.product_name}`)
      .join(', ');

    return createResponse(`You have ${data.length} items in your inventory: ${itemList}`);
  } catch (error) {
    console.error('handleCheckInventory error:', error);
    return createResponse('Sorry, I had trouble retrieving your inventory.');
  }
}

// Handler: Check Expiring Items
async function handleCheckExpiring(
  supabase: any,
  userId: string,
  params: any
): Promise<DialogflowResponse> {
  try {
    const days = params.days || 7;

    const { data, error } = await supabase
      .from('inventory_items')
      .select('product_name, expiry_date, days_until_expiry')
      .eq('user_id', userId)
      .eq('is_consumed', false)
      .gte('days_until_expiry', 0)
      .lte('days_until_expiry', days)
      .order('days_until_expiry', { ascending: true });

    if (error) {
      console.error('Check expiring error:', error);
      return createResponse('Sorry, I had trouble checking expiring items.');
    }

    if (!data || data.length === 0) {
      return createResponse(`No items are expiring in the next ${days} days. You're all set!`);
    }

    const expiringList = data
      .slice(0, 5) // Limit to 5 items for voice response
      .map((item: any) => {
        const daysLeft = item.days_until_expiry;
        if (daysLeft === 0) {
          return `${item.product_name} expires today`;
        } else if (daysLeft === 1) {
          return `${item.product_name} expires tomorrow`;
        } else {
          return `${item.product_name} in ${daysLeft} days`;
        }
      })
      .join(', ');

    const moreText = data.length > 5 ? ` and ${data.length - 5} more` : '';

    return createResponse(
      `You have ${data.length} item${data.length > 1 ? 's' : ''} expiring soon: ${expiringList}${moreText}. Check the app for details!`
    );
  } catch (error) {
    console.error('handleCheckExpiring error:', error);
    return createResponse('Sorry, I had trouble checking expiring items.');
  }
}

// Handler: Remove Product
async function handleRemoveProduct(
  supabase: any,
  userId: string,
  params: any
): Promise<DialogflowResponse> {
  try {
    const productName = params.product_name || params['product-name'] || params.product;

    if (!productName) {
      return createResponse("I didn't catch the product name. What would you like to remove?");
    }

    // Mark as consumed instead of deleting
    const { data, error } = await supabase
      .from('inventory_items')
      .update({ is_consumed: true })
      .eq('user_id', userId)
      .eq('is_consumed', false)
      .ilike('product_name', `%${productName}%`)
      .select();

    if (error) {
      console.error('Remove product error:', error);
      return createResponse(`Sorry, I couldn't remove ${productName}.`);
    }

    if (!data || data.length === 0) {
      return createResponse(`I couldn't find ${productName} in your inventory.`);
    }

    return createResponse(`Removed ${productName} from your inventory.`);
  } catch (error) {
    console.error('handleRemoveProduct error:', error);
    return createResponse('Sorry, I had trouble removing the item.');
  }
}

// Handler: Get Recipe Suggestions
async function handleGetRecipes(
  supabase: any,
  userId: string,
  params: any
): Promise<DialogflowResponse> {
  try {
    const { data: items } = await supabase
      .from('inventory_items')
      .select('product_name')
      .eq('user_id', userId)
      .eq('is_consumed', false);

    if (!items || items.length === 0) {
      return createResponse('Your inventory is empty. Add some ingredients first!');
    }

    // Try to fetch real recipe suggestions from your API
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/recipes/suggestions?source=sugran&all=false`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const suggestions = data.suggestions || [];

        if (suggestions.length > 0) {
          const recipeList = suggestions
            .slice(0, 3)
            .map((r: any) => r.title)
            .join(', ');

          return createResponse(
            `Based on your ingredients, you can make: ${recipeList}. Open the app to see full recipes and instructions!`
          );
        }
      }
    } catch (fetchError) {
      console.error('Recipe fetch error:', fetchError);
    }

    // Fallback response
    return createResponse(
      `You have ${items.length} ingredients in your inventory. Check the app for personalized recipe suggestions!`
    );
  } catch (error) {
    console.error('handleGetRecipes error:', error);
    return createResponse('Sorry, I had trouble finding recipes.');
  }
}

// Handler: Welcome/Help
function handleWelcome(): DialogflowResponse {
  return createResponse(
    'Welcome to HeyNosh! I can help you manage your food inventory. You can ask me to add items, check what\'s expiring, get recipe suggestions, or see your inventory. What would you like to do?'
  );
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authentication (optional)
    if (!verifyWebhookAuth(request)) {
      return NextResponse.json(
        createResponse('Unauthorized request'),
        { status: 401 }
      );
    }

    const body: DialogflowRequest = await request.json();
    
    // Extract intent and parameters
    const intentName = body.queryResult.intent.displayName;
    const parameters = body.queryResult.parameters;
    const accessToken = body.originalDetectIntentRequest?.payload?.user?.accessToken;

    console.log('Intent:', intentName, 'Parameters:', parameters);

    // Check if user is authenticated via account linking
    if (!accessToken) {
      return NextResponse.json(
        createResponse(
          'Please link your NoshNurture account in the Google Home app to use this feature.'
        )
      );
    }

    // Create Supabase client with user's access token
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        createResponse(
          'Your account link has expired. Please re-link your account in the Google Home app.'
        )
      );
    }

    const userId = user.id;

    // Route to appropriate handler based on intent
    let response: DialogflowResponse;

    switch (intentName) {
      case 'add_product':
      case 'AddProduct':
        response = await handleAddProduct(supabase, userId, parameters);
        break;

      case 'check_inventory':
      case 'CheckInventory':
        response = await handleCheckInventory(supabase, userId);
        break;

      case 'check_expiring':
      case 'CheckExpiring':
        response = await handleCheckExpiring(supabase, userId, parameters);
        break;

      case 'remove_product':
      case 'RemoveProduct':
        response = await handleRemoveProduct(supabase, userId, parameters);
        break;

      case 'get_recipes':
      case 'GetRecipes':
        response = await handleGetRecipes(supabase, userId, parameters);
        break;

      case 'Default Welcome Intent':
      case 'welcome':
        response = handleWelcome();
        break;

      default:
        response = createResponse(
          "I'm not sure how to help with that. You can ask me to add items, check expiring items, or get recipe suggestions."
        );
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      createResponse('Sorry, something went wrong. Please try again.'),
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
