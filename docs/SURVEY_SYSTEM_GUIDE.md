# 🍲 NoshNurture Survey System Documentation

## 📋 Overview

The NoshNurture Survey System is a fully-animated, modern, pleasant multi-step form designed to collect user feedback and validate our product. It provides valuable insights into user behavior, preferences, and pain points related to grocery management and food waste.

### Key Features
- ✨ Beautiful glassmorphism UI with Framer Motion animations
- 🎯 7-step multi-step survey form with progress tracking
- 📊 Comprehensive data collection on user needs and preferences
- 📈 Admin dashboard with statistics and analytics
- 🔐 Hidden admin access with password protection
- 💾 Supabase integration for data persistence
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🎨 Premium, soft, emotionally pleasant aesthetics

---

## 🗂️ File Structure

```
/src/
├── app/
│   ├── survey/
│   │   └── page.tsx                      # Main survey page (7 steps)
│   ├── admin/
│   │   └── survey/
│   │       └── page.tsx                  # Admin analytics dashboard
│   ├── api/
│   │   └── survey/
│   │       ├── submit/route.ts           # API to save survey responses
│   │       └── stats/route.ts            # API to fetch analytics
│   └── settings/
│       └── page.tsx                      # (Modified) Added survey button
├── components/
│   └── survey/
│       ├── ProgressBar.tsx               # Step progress indicator
│       ├── QuestionCard.tsx              # Question container with animations
│       ├── EmojiSlider.tsx               # Emoji-based slider (4 options)
│       ├── StarRating.tsx                # 5-star rating component
│       ├── NavigationButtons.tsx         # Next/Back buttons
│       └── PillOption.tsx                # Pill-shaped option buttons
└── sql/
    └── migrations/
        └── 010_survey_responses_table.sql # Database schema
```

---

## 🎨 Survey Form Structure (7 Steps)

### Step 1: Welcome Screen
- Title: "🍲 Help Us Improve NoshNurture!"
- Subtitle: Explains the purpose of the survey
- CTA: Start Survey button
- Animation: Smooth fade-in and scale

### Step 2: User Profile
**Questions:**
- "Who are you?" - Options: Homemaker, Working Woman, Student, Other
- "How many members in your household?" - Dropdown: 1 to 10+

**Components:** PillOption, Select dropdown

### Step 3: Problem Assessment
**Questions:**
- "How often do you forget expiry dates?" - Emoji slider (😊 to 😭)
- "Stress deciding what to cook daily?" - Emoji slider (😊 to 😫)
- "Do you accidentally buy duplicates?" - Yes/No pills
- "Difficulty managing groceries?" - Emoji slider (😊 to 😩)

**Components:** EmojiSlider, PillOption

### Step 4: Needs & Requirements
**Questions (Checkbox-style):**
- Expiry alerts (🔔)
- Multilingual recipes (🌍)
- Voice-based assistance (🎤)
- Automatic shopping lists (📝)

**Components:** Toggle buttons with icons

### Step 5: Feature Rating
**Rate 7 Features:**
1. Expiry Alerts (🔔)
2. Recipe Suggestions (👨‍🍳)
3. QR Scanner (📱)
4. Voice Assistant (🎤)
5. Shopping List (📝)
6. V-it Auto Sync (🔄)
7. AI Label Scanner (🤖)

**Rating System:** 5-star system with animated stars

**Components:** StarRating

### Step 6: Open Feedback
**Question:**
- "Tell us any other features you wish to see in NoshNurture…"

**Component:** Textarea with character counter

### Step 7: Thank You
- Success animation with rotating emoji
- "Thank You! 🎉" message
- Auto-redirect to dashboard after 4 seconds
- Loading spinner

---

## 🗄️ Database Schema

### `survey_responses` Table

```sql
survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                    -- Anonymous or authenticated user ID
  user_type TEXT,                           -- Homemaker, Working Woman, Student, Other
  household_size INTEGER,                   -- 1-10+
  expiry_forgetfulness INTEGER,             -- 0-3 (emoji scale)
  cooking_stress INTEGER,                   -- 0-3 (emoji scale)
  duplicate_buying BOOLEAN,                 -- Yes/No
  grocery_management INTEGER,               -- 0-3 (emoji scale)
  wants_expiry_alerts BOOLEAN,              -- Feature preference
  wants_multilingual BOOLEAN,               -- Feature preference
  wants_voice_assistant BOOLEAN,            -- Feature preference
  wants_shopping_list BOOLEAN,              -- Feature preference
  feature_ratings JSONB DEFAULT '{}'::jsonb, -- { "expiryAlerts": 4, "recipeSuggestions": 5, ... }
  additional_feedback TEXT,                 -- Open-ended feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Indexes:**
- `idx_survey_responses_user_id` - For user-specific queries
- `idx_survey_responses_created_at` - For time-based filtering
- `idx_survey_responses_user_type` - For demographic analysis

---

## 🚀 API Endpoints

### 1. Submit Survey Response
**Endpoint:** `POST /api/survey/submit`

**Request Body:**
```json
{
  "userId": "user_123_or_anon_session",
  "userType": "Working Woman",
  "householdSize": "3",
  "expiryForgetfulness": 2,
  "cookingStress": 1,
  "duplicateBuying": true,
  "groceryManagement": 2,
  "wantsExpiryAlerts": true,
  "wantsMultilingual": true,
  "wantsVoiceAssistant": true,
  "wantsShoppingList": false,
  "featureRatings": {
    "expiryAlerts": 5,
    "recipeSuggestions": 4,
    "qrScanner": 3,
    "voiceAssistant": 4,
    "shoppingList": 3,
    "vitAutoSync": 2,
    "aiLabelScanner": 4
  },
  "additionalFeedback": "Love the app! Would be great to have meal planning..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "created_at": "2025-11-17T10:30:00Z"
  }
}
```

### 2. Get Survey Statistics
**Endpoint:** `GET /api/survey/stats`

**Response:**
```json
{
  "totalResponses": 156,
  "userTypeDistribution": {
    "Homemaker": 45,
    "Working Woman": 89,
    "Student": 15,
    "Other": 7
  },
  "averageHouseholdSize": 3.4,
  "expiryForgetfulnessAvg": 2.1,
  "cookingStressAvg": 1.8,
  "groceryManagementAvg": 2.3,
  "featurePreferences": {
    "Expiry Alerts": 94.2,
    "Multilingual Recipes": 87.3,
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

---

## 🔐 Admin Dashboard Access

### Location: `/admin/survey`

### Authentication:
**Method:** Password-protected with admin code

**Default Admin Code:**
```
nosh_admin_2025
```

**Change via Environment Variable:**
```env
NEXT_PUBLIC_SURVEY_ADMIN_CODE=your_secret_code
```

### Access Flow:
1. Visit `/admin/survey`
2. Enter admin code when prompted
3. Code is stored in localStorage (valid until cleared)
4. Access full analytics dashboard

### Admin Features:
- 📊 Total responses count
- 👥 User type distribution (pie chart style)
- 🏠 Average household size
- 😅 Forget expiry dates metric
- 🍳 Cooking stress level
- 📦 Duplicate purchasing percentage
- ⭐ Feature ratings (5-star breakdown)
- 🎯 Feature preferences percentage
- 🔐 Logout button to clear session

---

## 🎨 Animation Details

### Page-level Animations:
- **Background Blobs:** Floating animated gradient circles
- **Cards:** Fade-in with slight scale and y-offset
- **Progress Bar:** Smooth width animation with easing

### Component-level Animations:
- **Emoji Slider:** Scale and opacity changes on hover/select
- **Star Rating:** Animated stars with bounce effect
- **Buttons:** Scale on hover, tap feedback
- **Text:** Staggered fade-in for readability
- **Transitions:** All use framer-motion for smooth 60fps performance

### Timing:
- Fade-in duration: 400ms
- Scale animations: 300ms
- Progress bar: 500ms with easeInOut
- Stagger effect: 100ms between children

---

## 📱 Responsive Behavior

### Mobile (< 768px):
- Single column layout for options
- Touch-friendly button sizes (48px minimum)
- Emoji larger: text-4xl to text-5xl
- Modal padding: 20px
- No hover effects (replaced with tap feedback)

### Tablet (768px - 1024px):
- 2-column grids for options
- Moderate padding and spacing
- Standard button sizes

### Desktop (> 1024px):
- 3-column grids where applicable
- Maximum width: 2xl containers
- Enhanced shadows and hover states
- Full animation performance

---

## 📊 Data Analysis & Insights

### What the Survey Reveals:

1. **User Demographics:** Distribution across homemakers, working women, students
2. **Pain Points:** Expiry date management, cooking decision stress
3. **Duplicate Purchases:** Percentage of users facing this issue
4. **Feature Demand:** Which features are most wanted
5. **Feature Satisfaction:** How users rate existing features
6. **Open Feedback:** Qualitative insights for product improvement

### Typical Use Cases:

**For Research Papers:**
- Validate human-centered design approach
- Show user validation metrics
- Demonstrate user research methodology
- Present quantitative evidence of demand

**For Product Development:**
- Prioritize feature development
- Understand user pain points
- Optimize UI/UX based on feedback
- Plan roadmap based on feature ratings

**For Investor Pitches:**
- Show user research completion
- Demonstrate product-market fit indicators
- Present user validation data
- Show engagement with target users

---

## 🔧 Setup Instructions

### 1. Run Database Migration

Execute the migration file on Supabase:

```sql
-- Copy contents of: sql/migrations/010_survey_responses_table.sql
-- Paste into Supabase SQL Editor
-- Execute
```

### 2. Set Environment Variables

Add to `.env.local`:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional: Customize admin code
NEXT_PUBLIC_SURVEY_ADMIN_CODE=your_custom_code
```

### 3. Access Survey

**User Survey:**
- Navigate to `/survey`
- Or click "Help Improve NoshNurture" button in Settings

**Admin Dashboard:**
- Navigate to `/admin/survey`
- Enter admin code when prompted
- View analytics and statistics

---

## 🎯 Integration Points

### 1. Settings Page
- Added "Help Improve NoshNurture" button
- Purple/pink themed to stand out
- Located above "QA Panel" button

### 2. User Flow
```
Settings → "Help Improve NoshNurture" → Survey → Submit → Thank You → Redirect to Dashboard
```

### 3. Anonymous Tracking
- Generates unique session ID per user: `anon_${timestamp}_${randomId}`
- Stored in localStorage
- Allows duplicate response detection if needed

---

## 📈 Future Enhancements

1. **Persistent Storage:** Redis cache for analytics (currently in-memory for single-instance)
2. **Real-time Analytics:** WebSocket updates for admin dashboard
3. **Export Features:** CSV/PDF export of survey data
4. **Advanced Filtering:** Filter responses by date range, user type, etc.
5. **Sentiment Analysis:** AI analysis of feedback text
6. **A/B Testing:** Test different survey versions
7. **Reminder System:** Email reminders to incomplete surveys
8. **Multi-language Survey:** Translate survey to supported languages

---

## 🐛 Troubleshooting

### Survey not saving:
- Check Supabase connection and API keys
- Verify table exists: `select * from survey_responses;`
- Check browser console for API errors
- Verify CORS settings in Supabase

### Admin dashboard not loading stats:
- Check `/api/survey/stats` endpoint returns data
- Verify admin code is correct
- Clear localStorage and try again
- Check browser console for fetch errors

### Animations not smooth:
- Check Framer Motion is installed: `npm install framer-motion`
- Verify Next.js version >= 15.0.0
- Check browser GPU acceleration is enabled
- Look for memory leaks in DevTools

### Style issues:
- Verify Tailwind CSS is configured
- Check `tailwind.config.ts` includes survey paths
- Clear `.next` and rebuild: `rm -rf .next && npm run build`

---

## 📚 Component Documentation

### ProgressBar
Shows step progress (e.g., "Step 3 of 7")
```tsx
<ProgressBar currentStep={3} totalSteps={7} />
```

### QuestionCard
Container for questions with animations
```tsx
<QuestionCard title="Question?" subtitle="Sub text">
  {/* Content */}
</QuestionCard>
```

### EmojiSlider
4-point emoji scale
```tsx
<EmojiSlider
  value={2}
  onChange={(val) => setValue(val)}
  emojis={['😊', '😐', '😟', '😫']}
  labels={['Not Stressed', 'Slightly', 'Quite', 'Very Much']}
/>
```

### StarRating
Feature rating system (1-5 stars)
```tsx
<StarRating
  rating={4}
  onRate={(rating) => setRating(rating)}
  featureName="Recipe Suggestions"
/>
```

### NavigationButtons
Previous/Next navigation
```tsx
<NavigationButtons
  onBack={() => previousStep()}
  onNext={() => nextStep()}
  isFirstStep={currentStep === 1}
  isLastStep={currentStep === 7}
  isLoading={false}
  nextLabel="Next"
/>
```

### PillOption
Clickable pill-shaped button
```tsx
<PillOption
  label="Working Woman"
  icon="💼"
  selected={selected}
  onClick={() => select()}
/>
```

---

## 🎓 Learning from the Survey

### Key Metrics to Watch:
1. **Response Rate:** Track how many users start vs complete
2. **Drop-off Points:** Which steps lose most users
3. **Feature Demand Ranking:** Sort by feature ratings
4. **User Segment Insights:** Different needs per user type
5. **Duplicate Buying:** Validates auto-fetch feature value
6. **Cooking Stress:** Validates recipe suggestion feature value

### Action Items Based on Feedback:
- **High stress scores?** → Improve recipe suggestions
- **High duplicate buying?** → Promote auto-sync feature
- **Low multilingual requests?** → Focus on English first
- **Voice assistant highly rated?** → Invest in improvement

---

## 📝 License & Credits

- Survey System: Custom built for NoshNurture
- Animations: Framer Motion
- UI Framework: Tailwind CSS + Next.js
- Database: Supabase (PostgreSQL)
- Icons: Emoji + Lucide Icons

---

**Last Updated:** November 17, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅

---

For questions or improvements, contact the NoshNurture development team!
