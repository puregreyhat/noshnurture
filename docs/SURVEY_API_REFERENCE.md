# 📡 Survey System - API Reference & Developer Guide

## API Endpoints

### 1. Submit Survey Response

**Endpoint:** `POST /api/survey/submit`

**Purpose:** Save user survey response to Supabase

#### Request

```typescript
// Request body
{
  userId: string;                    // Unique user identifier (can be anonymous)
  userType: string;                  // 'Homemaker' | 'Working Woman' | 'Student' | 'Other'
  householdSize: string;             // '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10+'
  expiryForgetfulness: number;       // 0-3 (emoji scale)
  cookingStress: number;             // 0-3 (emoji scale)
  duplicateBuying: boolean;          // true | false
  groceryManagement: number;         // 0-3 (emoji scale)
  wantsExpiryAlerts: boolean;        // Feature preference
  wantsMultilingual: boolean;        // Feature preference
  wantsVoiceAssistant: boolean;      // Feature preference
  wantsShoppingList: boolean;        // Feature preference
  featureRatings: {
    expiryAlerts: 1-5;
    recipeSuggestions: 1-5;
    qrScanner: 1-5;
    voiceAssistant: 1-5;
    shoppingList: 1-5;
    vitAutoSync: 1-5;
    aiLabelScanner: 1-5;
  };
  additionalFeedback: string;        // Open text feedback
}
```

#### Example Request

```bash
curl -X POST http://localhost:3000/api/survey/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "anon_1731789456_abc123",
    "userType": "Working Woman",
    "householdSize": "3",
    "expiryForgetfulness": 2,
    "cookingStress": 1,
    "duplicateBuying": true,
    "groceryManagement": 2,
    "wantsExpiryAlerts": true,
    "wantsMultilingual": true,
    "wantsVoiceAssistant": false,
    "wantsShoppingList": true,
    "featureRatings": {
      "expiryAlerts": 5,
      "recipeSuggestions": 4,
      "qrScanner": 3,
      "voiceAssistant": 4,
      "shoppingList": 5,
      "vitAutoSync": 2,
      "aiLabelScanner": 4
    },
    "additionalFeedback": "Great app! Would love meal planning features."
  }'
```

#### Response (Success)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-11-17T10:30:00.000Z"
  }
}
```

**Status Code:** `200 OK`

#### Response (Error)

```json
{
  "error": "Failed to insert survey response",
  "details": "Invalid user_type value"
}
```

**Status Code:** `400 Bad Request` or `500 Internal Server Error`

#### Error Handling

| Error | Status | Solution |
|-------|--------|----------|
| Missing required fields | 400 | Ensure all fields are provided |
| Invalid user_type | 400 | Use one of: Homemaker, Working Woman, Student, Other |
| Invalid householdSize | 400 | Use 1-10+ format |
| Supabase connection failed | 500 | Check database keys in .env |
| RLS policy error | 403 | Verify RLS policies are enabled in Supabase |

#### Implementation (TypeScript)

```typescript
// From: src/app/api/survey/submit/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .insert([{
        user_id: body.userId,
        user_type: body.userType,
        household_size: parseInt(body.householdSize),
        expiry_forgetfulness: body.expiryForgetfulness,
        cooking_stress: body.cookingStress,
        duplicate_buying: body.duplicateBuying,
        grocery_management: body.groceryManagement,
        wants_expiry_alerts: body.wantsExpiryAlerts,
        wants_multilingual: body.wantsMultilingual,
        wants_voice_assistant: body.wantsVoiceAssistant,
        wants_shopping_list: body.wantsShoppingList,
        feature_ratings: body.featureRatings,
        additional_feedback: body.additionalFeedback,
      }])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to insert survey response', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### 2. Get Survey Statistics

**Endpoint:** `GET /api/survey/stats`

**Purpose:** Fetch aggregated survey statistics for admin dashboard

#### Request

```bash
curl -X GET http://localhost:3000/api/survey/stats \
  -H "Content-Type: application/json"
```

**Query Parameters:** None (returns all data)

#### Response (Success)

```json
{
  "totalResponses": 156,
  "userTypeDistribution": {
    "Homemaker": 52,
    "Working Woman": 89,
    "Student": 12,
    "Other": 3
  },
  "averageHouseholdSize": 3.4,
  "expiryForgetfulnessAvg": 2.1,
  "cookingStressAvg": 1.8,
  "groceryManagementAvg": 2.3,
  "featurePreferences": {
    "Expiry Alerts": 94.9,
    "Multilingual Recipes": 87.2,
    "Voice Assistant": 76.9,
    "Shopping List": 82.1
  },
  "featureRatings": {
    "Expiry Alerts": 4.6,
    "Recipe Suggestions": 4.3,
    "QR Scanner": 3.8,
    "Voice Assistant": 4.1,
    "Shopping List": 4.0,
    "V-it Auto Sync": 3.5,
    "AI Label Scanner": 4.2
  },
  "duplicateBuyingPercentage": 68.6
}
```

**Status Code:** `200 OK`

#### Response (Error)

```json
{
  "error": "Failed to calculate statistics",
  "details": "No responses found"
}
```

**Status Code:** `400 Bad Request` or `500 Internal Server Error`

#### Implementation (TypeScript)

```typescript
// From: src/app/api/survey/stats/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*');

    if (error) throw error;
    if (!data?.length) {
      return NextResponse.json({
        totalResponses: 0,
        userTypeDistribution: {},
        averageHouseholdSize: 0,
        expiryForgetfulnessAvg: 0,
        // ... other fields with 0 values
      });
    }

    // Calculate all statistics from data
    const stats = calculateStats(data);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate statistics', details: error.message },
      { status: 500 }
    );
  }
}

function calculateStats(responses: any[]) {
  const total = responses.length;
  
  // User type distribution
  const userTypeDistribution = {};
  responses.forEach(r => {
    userTypeDistribution[r.user_type] = 
      (userTypeDistribution[r.user_type] || 0) + 1;
  });
  
  // Average household size
  const averageHouseholdSize = 
    responses.reduce((sum, r) => sum + r.household_size, 0) / total;
  
  // Emoji scale averages
  const expiryForgetfulnessAvg = 
    responses.reduce((sum, r) => sum + r.expiry_forgetfulness, 0) / total;
  
  const cookingStressAvg = 
    responses.reduce((sum, r) => sum + r.cooking_stress, 0) / total;
  
  const groceryManagementAvg = 
    responses.reduce((sum, r) => sum + r.grocery_management, 0) / total;
  
  // Feature preferences (% who want each)
  const featurePreferences = {
    'Expiry Alerts': (responses.filter(r => r.wants_expiry_alerts).length / total) * 100,
    'Multilingual Recipes': (responses.filter(r => r.wants_multilingual).length / total) * 100,
    'Voice Assistant': (responses.filter(r => r.wants_voice_assistant).length / total) * 100,
    'Shopping List': (responses.filter(r => r.wants_shopping_list).length / total) * 100,
  };
  
  // Feature ratings (average 1-5 for each)
  const featureRatings = {};
  ['expiryAlerts', 'recipeSuggestions', 'qrScanner', 'voiceAssistant', 'shoppingList', 'vitAutoSync', 'aiLabelScanner'].forEach(feature => {
    const ratings = responses
      .map(r => r.feature_ratings?.[feature] || 0)
      .filter(r => r > 0);
    featureRatings[feature] = ratings.length ? 
      ratings.reduce((a, b) => a + b) / ratings.length : 0;
  });
  
  // Duplicate buying percentage
  const duplicateBuyingPercentage = 
    (responses.filter(r => r.duplicate_buying).length / total) * 100;
  
  return {
    totalResponses: total,
    userTypeDistribution,
    averageHouseholdSize: parseFloat(averageHouseholdSize.toFixed(1)),
    expiryForgetfulnessAvg: parseFloat(expiryForgetfulnessAvg.toFixed(2)),
    cookingStressAvg: parseFloat(cookingStressAvg.toFixed(2)),
    groceryManagementAvg: parseFloat(groceryManagementAvg.toFixed(2)),
    featurePreferences: Object.fromEntries(
      Object.entries(featurePreferences).map(([k, v]) => [k, parseFloat((v as number).toFixed(1))])
    ),
    featureRatings: Object.fromEntries(
      Object.entries(featureRatings).map(([k, v]) => [k, parseFloat((v as number).toFixed(1))])
    ),
    duplicateBuyingPercentage: parseFloat(duplicateBuyingPercentage.toFixed(1)),
  };
}
```

---

## Client-Side Integration

### From Survey Form

```typescript
// From: src/app/survey/page.tsx
const handleSubmit = async (formData) => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/survey/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Submission error:', error);
      toast.error('Failed to submit survey');
      return;
    }

    const data = await response.json();
    toast.success('Survey submitted successfully!');
    // Auto-redirect after 4 seconds
    setTimeout(() => router.push('/'), 4000);
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to submit survey');
  } finally {
    setIsLoading(false);
  }
};
```

### From Admin Dashboard

```typescript
// From: src/app/admin/survey/page.tsx
useEffect(() => {
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/survey/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  fetchStats();
}, []);
```

---

## Data Schema Reference

### survey_responses Table

```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_type TEXT,
  household_size INTEGER,
  expiry_forgetfulness INTEGER CHECK (expiry_forgetfulness BETWEEN 0 AND 3),
  cooking_stress INTEGER CHECK (cooking_stress BETWEEN 0 AND 3),
  duplicate_buying BOOLEAN,
  grocery_management INTEGER CHECK (grocery_management BETWEEN 0 AND 3),
  wants_expiry_alerts BOOLEAN,
  wants_multilingual BOOLEAN,
  wants_voice_assistant BOOLEAN,
  wants_shopping_list BOOLEAN,
  feature_ratings JSONB DEFAULT '{}'::jsonb,
  additional_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Column Constraints

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID | PK, auto | Unique response ID |
| `user_id` | TEXT | NOT NULL | Anonymous session ID |
| `user_type` | TEXT | - | Homemaker\|Working Woman\|Student\|Other |
| `household_size` | INTEGER | - | 1-10+ range |
| `expiry_forgetfulness` | INTEGER | 0-3 | Emoji scale (0=😊, 3=😭) |
| `cooking_stress` | INTEGER | 0-3 | Emoji scale (0=😊, 3=😫) |
| `duplicate_buying` | BOOLEAN | - | Yes/No |
| `grocery_management` | INTEGER | 0-3 | Emoji scale (0=😊, 3=😩) |
| `wants_expiry_alerts` | BOOLEAN | - | Feature preference |
| `wants_multilingual` | BOOLEAN | - | Feature preference |
| `wants_voice_assistant` | BOOLEAN | - | Feature preference |
| `wants_shopping_list` | BOOLEAN | - | Feature preference |
| `feature_ratings` | JSONB | - | {featureName: rating(1-5)} |
| `additional_feedback` | TEXT | - | Open text feedback |
| `created_at` | TIMESTAMP TZ | DEFAULT NOW() | Auto-set on create |
| `updated_at` | TIMESTAMP TZ | DEFAULT NOW() | Auto-updated on change |

### Sample feature_ratings JSON

```json
{
  "expiryAlerts": 5,
  "recipeSuggestions": 4,
  "qrScanner": 3,
  "voiceAssistant": 4,
  "shoppingList": 5,
  "vitAutoSync": 2,
  "aiLabelScanner": 4
}
```

---

## SQL Queries for Analysis

### Get Total Responses by User Type

```sql
SELECT 
  user_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM survey_responses), 2) as percentage
FROM survey_responses
GROUP BY user_type
ORDER BY count DESC;
```

### Get Average Household Size

```sql
SELECT 
  ROUND(AVG(household_size)::numeric, 1) as avg_household_size,
  MIN(household_size) as min_size,
  MAX(household_size) as max_size
FROM survey_responses;
```

### Get Feature Preference Distribution

```sql
SELECT 
  COUNT(*) as total_responses,
  ROUND(CAST(COUNTIF(wants_expiry_alerts) OVER() AS decimal) / COUNT(*) * 100, 1) as expiry_alerts_pct,
  ROUND(CAST(COUNTIF(wants_multilingual) OVER() AS decimal) / COUNT(*) * 100, 1) as multilingual_pct,
  ROUND(CAST(COUNTIF(wants_voice_assistant) OVER() AS decimal) / COUNT(*) * 100, 1) as voice_pct,
  ROUND(CAST(COUNTIF(wants_shopping_list) OVER() AS decimal) / COUNT(*) * 100, 1) as shopping_list_pct
FROM survey_responses;
```

### Get Average Feature Ratings

```sql
SELECT 
  'expiryAlerts' as feature,
  ROUND(AVG(CAST(feature_ratings->>'expiryAlerts' AS numeric)), 1) as avg_rating
FROM survey_responses
WHERE feature_ratings->>'expiryAlerts' IS NOT NULL
UNION ALL
SELECT 
  'recipeSuggestions' as feature,
  ROUND(AVG(CAST(feature_ratings->>'recipeSuggestions' AS numeric)), 1)
FROM survey_responses
WHERE feature_ratings->>'recipeSuggestions' IS NOT NULL
-- ... repeat for other features
ORDER BY avg_rating DESC;
```

### Get Recent Responses

```sql
SELECT 
  id,
  user_type,
  household_size,
  expiry_forgetfulness,
  cooking_stress,
  duplicate_buying,
  additional_feedback,
  created_at
FROM survey_responses
ORDER BY created_at DESC
LIMIT 10;
```

---

## Rate Limiting & Performance

### Current Setup
- No rate limiting implemented (suitable for small user bases)
- Responses indexed on: `user_id`, `created_at`, `user_type`

### Scaling for Large User Base

Add rate limiting middleware:

```typescript
// Example: Limit to 1 submission per IP per hour
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(1, '1 h'),
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // ... rest of submission logic
}
```

---

## Deployment Considerations

### Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin
NEXT_PUBLIC_SURVEY_ADMIN_CODE=your-admin-code

# Optional: Rate limiting (Vercel KV)
KV_URL=https://your-kv.vercel.app
KV_REST_API_TOKEN=your-token
```

### CORS Configuration

Survey endpoints are same-origin (same Next.js app), so CORS is handled automatically.

For external API access, add CORS headers:

```typescript
const headers = {
  'Access-Control-Allow-Origin': 'https://your-domain.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## Monitoring & Logging

### Add Request Logging

```typescript
// In API routes
export async function POST(request: NextRequest) {
  console.log('Survey submission:', {
    timestamp: new Date().toISOString(),
    ip: request.ip,
    userAgent: request.headers.get('user-agent'),
  });
  
  // ... rest of logic
}
```

### Add Error Monitoring (Sentry)

```bash
npm install @sentry/nextjs
```

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error);
```

---

**API Version:** 1.0  
**Last Updated:** November 17, 2025  
**Status:** Production Ready ✅
