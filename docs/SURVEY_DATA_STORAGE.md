# 📊 Survey Data Storage & Stats Location

## Overview
This document explains where survey responses are stored and how to access the statistics.

---

## 🗄️ Database Storage

### **Table Name:** `survey_responses`
**Location:** Supabase PostgreSQL Database

### **Database Schema:**
```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  user_type TEXT,
  household_size INTEGER,
  expiry_forgetfulness INTEGER,
  cooking_stress INTEGER,
  duplicate_buying BOOLEAN,
  grocery_management INTEGER,
  wants_expiry_alerts BOOLEAN,
  wants_multilingual BOOLEAN,
  wants_voice_assistant BOOLEAN,
  wants_shopping_list BOOLEAN,
  feature_ratings JSONB,
  additional_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### **Migration File:**
📁 `/sql/migrations/010_survey_responses_table.sql`

---

## 🔌 API Endpoints

### **Submit Survey:**
- **Endpoint:** `POST /api/survey/submit`
- **File:** `/src/app/api/survey/submit/route.ts`
- **Function:** Saves survey responses to Supabase

**Request Body:**
```json
{
  "userId": "user-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "home_cook",
  "householdSize": "4",
  "expiryForgetfulness": 2,
  "cookingStress": 1,
  "duplicateBuying": false,
  "groceryManagement": 3,
  "wantsExpiryAlerts": true,
  "wantsMultilingual": false,
  "wantsVoiceAssistant": true,
  "wantsShoppingList": true,
  "featureRatings": {
    "expiryAlerts": 5,
    "recipeSuggestions": 4,
    "billUpload": 3,
    "voiceAssistant": 5,
    "shoppingList": 4,
    "aiLabelScanner": 5
  },
  "additionalFeedback": "Great app!"
}
```

---

## 📈 Accessing Survey Statistics

### **Method 1: Supabase Dashboard** ⭐ (Recommended)
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Table Editor**
3. Select `survey_responses` table
4. View all responses with filters and sorting

### **Method 2: SQL Queries**
Run these queries in Supabase SQL Editor:

**Total Responses:**
```sql
SELECT COUNT(*) as total_responses FROM survey_responses;
```

**Responses by User Type:**
```sql
SELECT user_type, COUNT(*) as count 
FROM survey_responses 
GROUP BY user_type 
ORDER BY count DESC;
```

**Average Feature Ratings:**
```sql
SELECT 
  AVG((feature_ratings->>'expiryAlerts')::int) as avg_expiry_alerts,
  AVG((feature_ratings->>'recipeSuggestions')::int) as avg_recipe_suggestions,
  AVG((feature_ratings->>'billUpload')::int) as avg_bill_upload,
  AVG((feature_ratings->>'voiceAssistant')::int) as avg_voice_assistant,
  AVG((feature_ratings->>'shoppingList')::int) as avg_shopping_list,
  AVG((feature_ratings->>'aiLabelScanner')::int) as avg_ai_label_scanner
FROM survey_responses;
```

**Most Requested Features:**
```sql
SELECT 
  SUM(CASE WHEN wants_expiry_alerts THEN 1 ELSE 0 END) as expiry_alerts_requests,
  SUM(CASE WHEN wants_multilingual THEN 1 ELSE 0 END) as multilingual_requests,
  SUM(CASE WHEN wants_voice_assistant THEN 1 ELSE 0 END) as voice_assistant_requests,
  SUM(CASE WHEN wants_shopping_list THEN 1 ELSE 0 END) as shopping_list_requests
FROM survey_responses;
```

**Recent Feedback:**
```sql
SELECT first_name, additional_feedback, created_at 
FROM survey_responses 
WHERE additional_feedback IS NOT NULL 
AND additional_feedback != '' 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Method 3: Create Admin Stats Page** 🚧 (To Do)
**File to create:** `/src/app/admin/survey-stats/page.tsx`

This page would display:
- 📊 Total survey responses
- 👥 User type breakdown (pie chart)
- ⭐ Average feature ratings (bar chart)
- 💬 Recent feedback
- 📈 Trends over time

---

## 🔐 Security & Privacy

### **Row Level Security (RLS):**
- ✅ **INSERT:** Anyone can submit (anonymous surveys allowed)
- ✅ **SELECT:** Only authenticated users can view (admin only)
- ❌ **UPDATE/DELETE:** Not allowed (data integrity)

### **Privacy Policy:**
- User data is stored securely in Supabase
- No personally identifiable information is required
- First/Last names are optional
- Feedback is used only for product improvement

---

## 📱 Frontend Components

### **Survey Page:**
📁 `/src/app/survey/page.tsx`
- Multi-step form with 8 steps
- Animated transitions with Framer Motion
- Real-time validation

### **Survey Components:**
📁 `/src/components/survey/`
- `QuestionCard.tsx` - Reusable question container
- `EmojiSlider.tsx` - Emoji-based rating slider (0-3)
- `StarRating.tsx` - Star rating component (0-5 stars)
- `NavigationButtons.tsx` - Back/Next buttons
- `PillOption.tsx` - Pill-shaped option buttons
- `ProgressBar.tsx` - Step indicator

---

## 🎯 Feature Tracking

### **Current Features Being Tracked:**
1. **Expiry Alerts** 🔔
2. **Recipe Suggestions** 👨‍🍳
3. **Bill Upload Feature** 📄 (New!)
4. **Voice Assistant** 🎤
5. **Shopping List** 📝
6. **AI Label Scanner** 🤖

### **Removed Features:**
- ~~QR Scanner~~ (replaced with Bill Upload)
- ~~V-it Auto Sync~~ (removed from survey)

---

## 📊 Quick Stats Dashboard SQL View

**Create a materialized view for fast stats:**
```sql
CREATE MATERIALIZED VIEW survey_stats AS
SELECT 
  COUNT(*) as total_responses,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(household_size) as avg_household_size,
  AVG(expiry_forgetfulness) as avg_expiry_forgetfulness,
  AVG(cooking_stress) as avg_cooking_stress,
  AVG(grocery_management) as avg_grocery_management,
  jsonb_object_agg(
    user_type, 
    (SELECT COUNT(*) FROM survey_responses sr2 WHERE sr2.user_type = sr1.user_type)
  ) as user_type_breakdown
FROM survey_responses sr1;

-- Refresh periodically
REFRESH MATERIALIZED VIEW survey_stats;
```

---

## 🚀 Future Enhancements

### **Planned Features:**
- [ ] Admin dashboard at `/admin/survey-stats`
- [ ] Export survey data to CSV
- [ ] Real-time analytics with charts
- [ ] Email notifications for new responses
- [ ] Sentiment analysis on feedback
- [ ] A/B testing different survey flows

---

## 📞 Need Help?

**View Survey Responses:**
1. Open Supabase dashboard
2. Go to Table Editor → `survey_responses`
3. Apply filters/sorting as needed

**Export Data:**
```bash
# Using Supabase CLI
supabase db dump --table survey_responses > survey_data.sql
```

**Troubleshooting:**
- Check API logs: `/api/survey/submit`
- Verify Supabase connection
- Ensure RLS policies are correct

---

**Last Updated:** November 2025  
**Maintained by:** NoshNurture Team 🌱
