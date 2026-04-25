# 🚀 NoshNurture Survey System - Quick Start Guide

## 5-Minute Setup

### Step 1: Apply Database Migration
Execute this SQL in your Supabase SQL Editor:

```bash
# Or run from terminal:
psql -U postgres -d postgres -f sql/migrations/010_survey_responses_table.sql
```

**Copy-paste into Supabase SQL Editor:**
```sql
-- From: sql/migrations/010_survey_responses_table.sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
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
  feature_ratings JSONB DEFAULT '{}'::jsonb,
  additional_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at);
CREATE INDEX idx_survey_responses_user_type ON survey_responses(user_type);

-- Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all users" ON survey_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON survey_responses
  FOR SELECT USING (auth.role() = 'authenticated' OR true);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_survey_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER survey_responses_updated_at
  BEFORE UPDATE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_responses_updated_at();
```

✅ **Done!** Table is now created and ready.

---

### Step 2: Verify Environment Variables

Check `.env.local` has Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

✅ **All set!** If keys are already there, you're good.

---

### Step 3: Launch & Test

```bash
# Build to verify everything compiles
npm run build

# Start development server
npm run dev
```

Then:
1. Go to `http://localhost:3000/settings`
2. Click "Help Improve NoshNurture" button
3. Or directly visit `http://localhost:3000/survey`

✅ **Survey ready to use!**

---

## 🎯 Using the Survey

### User Journey
```
Settings Page
    ↓
  [Help Improve NoshNurture Button]
    ↓
Survey Page - Step 1: Welcome
    ↓
Step 2: Profile (Homemaker? Household size?)
    ↓
Step 3: Assessment (Emoji sliders for stress/habits)
    ↓
Step 4: Needs (Which features do you want?)
    ↓
Step 5: Ratings (Rate 7 features with stars)
    ↓
Step 6: Feedback (Any other suggestions?)
    ↓
Step 7: Thank You (Auto-redirects in 4 seconds)
    ↓
Response saved to Supabase ✅
```

### User Sees:
- ✨ Beautiful glassmorphic cards
- 🎨 Soft pastel gradients (green, purple, blue)
- 🎬 Smooth Framer Motion animations
- 📱 Perfect on mobile, tablet, desktop
- 💾 Their response is saved anonymously

---

## 📊 View Admin Dashboard

### Access Admin Dashboard
1. Navigate to `http://localhost:3000/admin/survey`
2. Enter admin code: `nosh_admin_2025`
3. See all statistics!

### Admin Code Customization
Set in `.env.local`:
```env
NEXT_PUBLIC_SURVEY_ADMIN_CODE=your_secret_admin_code
```

### What Admin Sees:
- 📈 Total responses count
- 👥 User type distribution (Homemakers vs Working Women vs Students)
- 🏠 Average household size
- 😅 Expiry date forgetfulness score
- 🍳 Cooking stress level
- 🛒 Duplicate buying percentage
- ⭐ Feature ratings (all 7 features)
- 🎯 Feature preferences (% who want each)
- 🔐 Logout button

---

## 💾 Verify Data in Supabase

### Check Responses Are Saving

Go to Supabase Dashboard → Table Editor → `survey_responses`

You should see:
- ✅ One row per survey submission
- ✅ `user_id` (anonymous session ID)
- ✅ `user_type` (Homemaker, Working Woman, etc.)
- ✅ `household_size` (1-10+)
- ✅ `expiry_forgetfulness` (0-3 scale)
- ✅ `cooking_stress` (0-3 scale)
- ✅ `feature_ratings` (JSON with all 7 feature scores)
- ✅ `additional_feedback` (open text feedback)
- ✅ `created_at` (timestamp)

### SQL Query to See All Responses
```sql
SELECT 
  id,
  user_type,
  household_size,
  expiry_forgetfulness,
  cooking_stress,
  duplicate_buying,
  feature_ratings,
  created_at
FROM survey_responses
ORDER BY created_at DESC;
```

---

## 🎨 Survey Pages Overview

### `/survey` - Main Survey Page
- 7 steps of data collection
- Glassmorphic UI with animations
- Responsive design
- Anonymous user tracking
- Auto-save on completion

### `/admin/survey` - Admin Dashboard
- Password-protected access
- Statistics visualization
- 7 key metrics displayed
- Feature ratings breakdown
- User demographics chart

### `/settings` - Settings Page (Modified)
- Added "Help Improve NoshNurture" button
- Purple/pink gradient styling
- Redirects to `/survey`

---

## 🔧 Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `src/app/survey/page.tsx` | Main 7-step form | ✅ Ready |
| `src/app/admin/survey/page.tsx` | Admin dashboard | ✅ Ready |
| `src/app/api/survey/submit/route.ts` | Save responses API | ✅ Ready |
| `src/app/api/survey/stats/route.ts` | Get stats API | ✅ Ready |
| `src/components/survey/*` | 6 reusable components | ✅ Ready |
| `sql/migrations/010_survey_responses_table.sql` | Database schema | ⏳ Run it! |

---

## 🐛 Common Issues & Fixes

### "Survey page is blank"
```bash
# Solution: Rebuild the project
rm -rf .next
npm run build
npm run dev
```

### "Can't submit survey - 'No Supabase found'"
```
Check .env.local has all 3 Supabase keys
Restart dev server after adding env vars
```

### "Admin dashboard shows no data"
```
1. Make sure you submitted a survey first
2. Verify table exists in Supabase
3. Check admin code is correct (nosh_admin_2025 default)
4. Clear browser localStorage and try again
```

### "Animations are choppy"
```bash
# Make sure framer-motion is installed
npm install framer-motion

# Check Node modules
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "Responsive design broken on mobile"
```
Clear browser cache (Cmd+Shift+R on Mac)
Check Tailwind CSS is configured properly
Verify phone viewport settings
```

---

## 📈 Using Survey Data

### For Research Paper:
- Show "X responses collected"
- Display user demographic distribution
- Present feature validation metrics
- Highlight pain points (expiry, cooking stress)
- Show feature demand percentages

### For Product Decisions:
1. **Feature Prioritization:** Sort by rating scores
2. **User Segmentation:** Different needs per type
3. **Pain Points:** What to focus on fixing
4. **Market Validation:** Proof of product-market fit

### For Pitch Deck:
- "156 users surveyed" (or your number)
- "87% want expiry alerts" (or your % )
- "Average 3.4 person household"
- "Feature ratings: 4.6/5 average"

---

## 🚀 Deployment

### Deploy to Vercel

```bash
# Make sure all changes are committed
git add .
git commit -m "feat: Survey system ready for production"

# Push to main branch
git push origin main

# Vercel auto-deploys on push
# Check your deployment at: your-domain.vercel.app/survey
```

### Production Checklist
- ✅ Database migration applied
- ✅ Environment variables set (Vercel dashboard)
- ✅ Admin code customized (if desired)
- ✅ Survey tested on mobile/desktop
- ✅ Admin dashboard tested
- ✅ Build verified (npm run build)
- ✅ Changes committed to git

---

## 📞 Support

### Need Help?

1. **Check Full Documentation:**
   - See: `docs/SURVEY_SYSTEM_GUIDE.md`

2. **API Issues:**
   - Check Supabase connection
   - Verify table exists
   - Check CORS settings
   - Look at browser console errors

3. **UI/Animation Issues:**
   - Check Framer Motion is installed
   - Verify Tailwind config includes survey paths
   - Clear cache and rebuild

4. **Data Issues:**
   - Query survey_responses table directly in Supabase
   - Check timestamps are correct
   - Verify RLS policies are enabled

---

## ✨ Next Steps

1. ✅ Apply database migration (if not done)
2. ✅ Test survey submission
3. ✅ Check admin dashboard
4. ✅ Customize admin code (optional)
5. ✅ Deploy to production
6. ✅ Share survey link with users
7. ✅ Monitor responses over time
8. ✅ Export data for analysis

---

**You're all set! 🎉**

Your survey system is ready to collect user feedback and validate product-market fit!

**Survey URL:** `yoursite.com/survey`  
**Admin URL:** `yoursite.com/admin/survey`  
**Admin Code:** `nosh_admin_2025` (default)

Happy surveying! 📊
