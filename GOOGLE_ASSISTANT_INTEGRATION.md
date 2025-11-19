# Google Assistant Integration for NoshNurture

## 🎙️ Overview

Integrate Google Assistant to allow hands-free inventory management:
- "Hey Google, add tomato to NoshNurture"
- "Hey Google, ask NoshNurture what's expiring soon"
- "Hey Google, tell NoshNurture to remove milk"

---

## 📋 Implementation Steps

### Phase 1: Create Google Actions Project (1-2 hours)

1. **Go to Actions Console**
   - Visit: https://console.actions.google.com/
   - Click "New Project"
   - Name: "NoshNurture"

2. **Choose Action Type**
   - Select: "Custom"
   - Click "Build your Action"

3. **Setup Invocation**
   ```
   Invocation Name: "NoshNurture"
   Display Name: "NoshNurture Inventory Manager"
   ```

---

### Phase 2: Define Intents (2-3 hours)

#### Intent 1: `add_product`
**Training Phrases:**
```
- add tomato
- add 2 kg tomato
- add milk to inventory
- put banana in my list
- store chicken in fridge
```

**Parameters:**
```yaml
product_name: @sys.any (required)
quantity: @sys.number (optional)
unit: @sys.unit (optional)
```

**Response:**
```
"Added {quantity} {unit} {product_name} to your inventory"
```

---

#### Intent 2: `check_inventory`
**Training Phrases:**
```
- what do I have
- check my inventory
- list my products
- what's in my fridge
- show me my food items
```

**Response:**
```
"You have {count} items: {item_list}"
```

---

#### Intent 3: `check_expiring`
**Training Phrases:**
```
- what's expiring soon
- check expiry dates
- what will go bad
- expiring items
- items about to expire
```

**Response:**
```
"You have {count} items expiring soon: {expiring_list}"
```

---

#### Intent 4: `remove_product`
**Training Phrases:**
```
- remove tomato
- delete milk
- I finished the bread
- used up chicken
```

**Parameters:**
```yaml
product_name: @sys.any (required)
```

**Response:**
```
"Removed {product_name} from your inventory"
```

---

#### Intent 5: `get_recipes`
**Training Phrases:**
```
- what can I cook
- recipe suggestions
- suggest recipes
- what should I make
- cooking ideas
```

**Response:**
```
"Based on your inventory, you can make: {recipe_list}"
```

---

### Phase 3: Create Fulfillment Webhook (3-4 hours)

**File:** `src/app/api/assistant/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Google Assistant Webhook Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract intent and parameters
    const intent = body.queryResult.intent.displayName;
    const parameters = body.queryResult.parameters;
    const userId = body.originalDetectIntentRequest.payload.user.userId;
    
    // Get user from session (you'll need to map Google user to your user)
    const supabase = await createClient();
    
    // Route to appropriate handler
    switch (intent) {
      case 'add_product':
        return handleAddProduct(supabase, userId, parameters);
      
      case 'check_inventory':
        return handleCheckInventory(supabase, userId);
      
      case 'check_expiring':
        return handleCheckExpiring(supabase, userId);
      
      case 'remove_product':
        return handleRemoveProduct(supabase, userId, parameters);
      
      case 'get_recipes':
        return handleGetRecipes(supabase, userId);
      
      default:
        return NextResponse.json({
          fulfillmentText: "Sorry, I didn't understand that command."
        });
    }
  } catch (error) {
    console.error('Assistant webhook error:', error);
    return NextResponse.json({
      fulfillmentText: "Sorry, something went wrong. Please try again."
    }, { status: 500 });
  }
}

// Handler: Add Product
async function handleAddProduct(supabase: any, userId: string, params: any) {
  const { product_name, quantity, unit } = params;
  
  // Auto-calculate expiry
  const { getDefaultExpiryDate } = await import('@/lib/default-expiry');
  const expiryDate = getDefaultExpiryDate(product_name, 'refrigerator');
  
  // Insert into database
  const { error } = await supabase
    .from('inventory_items')
    .insert({
      user_id: userId,
      product_name: product_name,
      quantity: quantity || 1,
      unit: unit || 'pcs',
      expiry_date: expiryDate.toISOString().split('T')[0],
      storage_type: 'refrigerator',
      category: 'other'
    });
  
  if (error) {
    return NextResponse.json({
      fulfillmentText: `Sorry, I couldn't add ${product_name}. Please try again.`
    });
  }
  
  const days = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return NextResponse.json({
    fulfillmentText: `Added ${quantity || 1} ${unit || 'piece'} of ${product_name}. It will expire in ${days} days.`
  });
}

// Handler: Check Inventory
async function handleCheckInventory(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('product_name, quantity, unit')
    .eq('user_id', userId)
    .limit(10);
  
  if (error || !data || data.length === 0) {
    return NextResponse.json({
      fulfillmentText: "Your inventory is empty."
    });
  }
  
  const itemList = data
    .map((item: any) => `${item.quantity} ${item.unit} ${item.product_name}`)
    .join(', ');
  
  return NextResponse.json({
    fulfillmentText: `You have ${data.length} items: ${itemList}`
  });
}

// Handler: Check Expiring Items
async function handleCheckExpiring(supabase: any, userId: string) {
  const today = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(today.getDate() + 7);
  
  const { data, error } = await supabase
    .from('inventory_items')
    .select('product_name, expiry_date')
    .eq('user_id', userId)
    .lte('expiry_date', sevenDaysLater.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });
  
  if (error || !data || data.length === 0) {
    return NextResponse.json({
      fulfillmentText: "No items are expiring soon. You're all good!"
    });
  }
  
  const expiringList = data
    .map((item: any) => {
      const expiry = new Date(item.expiry_date);
      const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return `${item.product_name} (${days} days)`;
    })
    .join(', ');
  
  return NextResponse.json({
    fulfillmentText: `You have ${data.length} items expiring soon: ${expiringList}`
  });
}

// Handler: Remove Product
async function handleRemoveProduct(supabase: any, userId: string, params: any) {
  const { product_name } = params;
  
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('user_id', userId)
    .ilike('product_name', product_name);
  
  if (error) {
    return NextResponse.json({
      fulfillmentText: `Sorry, I couldn't remove ${product_name}. Please try again.`
    });
  }
  
  return NextResponse.json({
    fulfillmentText: `Removed ${product_name} from your inventory.`
  });
}

// Handler: Get Recipe Suggestions
async function handleGetRecipes(supabase: any, userId: string) {
  // Get user's inventory
  const { data: items } = await supabase
    .from('inventory_items')
    .select('product_name')
    .eq('user_id', userId);
  
  if (!items || items.length === 0) {
    return NextResponse.json({
      fulfillmentText: "Your inventory is empty. Add some items first!"
    });
  }
  
  // Fetch recipe suggestions (simplified - you can integrate with your recipe API)
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/recipes/suggestions?userId=${userId}`);
  const { suggestions } = await response.json();
  
  if (!suggestions || suggestions.length === 0) {
    return NextResponse.json({
      fulfillmentText: "I couldn't find any recipes. Try adding more ingredients!"
    });
  }
  
  const recipeList = suggestions
    .slice(0, 3)
    .map((r: any) => r.title)
    .join(', ');
  
  return NextResponse.json({
    fulfillmentText: `Based on your ingredients, you can make: ${recipeList}. Check the app for full recipes!`
  });
}
```

---

### Phase 4: Configure Webhook in Actions Console

1. **Go to Fulfillment Section**
   - Click "Webhook"
   - Enable webhook

2. **Add Webhook URL**
   ```
   https://your-app.vercel.app/api/assistant/webhook
   ```

3. **Add Headers** (for security)
   ```
   Authorization: Bearer YOUR_SECRET_TOKEN
   ```

4. **Enable for All Intents**
   - Check "Enable webhook for all domains"

---

### Phase 5: User Authentication & Linking (CRITICAL)

**Problem:** Google Assistant doesn't know which NoshNurture user is speaking.

**Solution:** Account Linking

1. **In Actions Console → Account Linking**
   ```
   OAuth 2.0 Authorization Code Flow
   
   Client ID: <from Supabase>
   Client Secret: <from Supabase>
   Authorization URL: https://your-app.vercel.app/api/assistant/auth
   Token URL: https://your-app.vercel.app/api/assistant/token
   ```

2. **Create Auth Endpoints**

**File:** `src/app/api/assistant/auth/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  
  // Redirect to your login page
  return NextResponse.redirect(
    `/auth/google-assistant?redirect_uri=${redirectUri}&state=${state}`
  );
}
```

**File:** `src/app/api/assistant/token/route.ts`
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code } = body;
  
  // Exchange code for Supabase token
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }
  
  return NextResponse.json({
    access_token: data.session.access_token,
    token_type: 'Bearer',
    expires_in: 3600
  });
}
```

---

### Phase 6: Testing (1-2 hours)

1. **Test in Simulator**
   - Actions Console → Test tab
   - Type: "Talk to NoshNurture"
   - Try: "Add tomato"

2. **Test on Phone**
   - Enable testing on your device
   - Say: "Hey Google, talk to NoshNurture"

3. **Debug**
   - Check webhook logs in Vercel
   - Check Supabase database

---

### Phase 7: Deploy to Production

1. **Submit for Review**
   - Actions Console → Deploy
   - Fill out app details
   - Add privacy policy
   - Submit

2. **Approval Timeline**
   - Usually 3-5 business days
   - Google will test your Action

3. **Go Live**
   - Once approved, available to all users
   - Users can enable: "Hey Google, talk to NoshNurture"

---

## 🎯 User Flow Example

```
User: "Hey Google, talk to NoshNurture"
Assistant: "Sure, NoshNurture is ready. What would you like to do?"

User: "Add 2 kg tomato"
Assistant: "Added 2 kg tomato to your inventory. It will expire in 7 days."

User: "What's expiring soon?"
Assistant: "You have 3 items expiring soon: Milk (2 days), Bread (1 day), Tomato (7 days)"

User: "Suggest recipes"
Assistant: "Based on your ingredients, you can make: Tomato Soup, Bread Pizza, Milk Tea. Check the app for full recipes!"
```

---

## 🔐 Security Considerations

1. **Webhook Authentication**
   - Verify requests come from Google
   - Use Authorization header

2. **User Data**
   - Only access linked user's data
   - Don't expose sensitive info in voice responses

3. **Rate Limiting**
   - Prevent abuse
   - Limit requests per user

---

## 📊 Analytics

Track usage:
- Most used intents
- Success/failure rates
- User engagement
- Popular commands

---

## 🚀 Next Steps

1. Create webhook endpoint (3-4 hours)
2. Setup Actions Console project (1-2 hours)
3. Test with simulator (1 hour)
4. Implement account linking (2-3 hours)
5. Test on real device (1 hour)
6. Submit for approval (1 hour)
7. **Total time: 9-14 hours**

Want me to start implementing the webhook endpoint now?
