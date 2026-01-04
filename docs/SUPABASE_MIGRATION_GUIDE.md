# 🗄️ Supabase Migration Setup - Step by Step

## 📋 Pre-Execution Checklist

Before running the migration, verify:

- [ ] You have access to your Supabase dashboard
- [ ] Your Supabase project is active and running
- [ ] You have the SQL Editor permission
- [ ] Your .env.local has valid Supabase credentials
- [ ] You have 5 minutes for migration (very quick)

---

## 🚀 Step 1: Access Supabase SQL Editor

### Option A: Direct Link (Fastest)
1. Go to: `https://app.supabase.com/projects`
2. Select your NoshNurture project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

### Option B: Via Dashboard
1. Open Supabase dashboard
2. Select your project
3. Left sidebar → SQL Editor
4. Click "New Query" button (+ icon)

---

## 📝 Step 2: Copy the Migration SQL

Open this file in your terminal or editor:

```bash
cat sql/migrations/010_survey_responses_table.sql
```

The complete migration code:

```sql
-- Create survey_responses table
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

-- Create indexes for performance
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at);
CREATE INDEX idx_survey_responses_user_type ON survey_responses(user_type);

-- Enable Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable insert for all users" ON survey_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON survey_responses
  FOR SELECT USING (auth.role() = 'authenticated' OR true);

-- Create auto-update trigger for updated_at
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

---

## ✏️ Step 3: Paste into SQL Editor

1. Click in the Supabase SQL Editor text area
2. **Paste the entire SQL code above** (Cmd+V on Mac, Ctrl+V on Windows/Linux)
3. The SQL should appear in the editor
4. **Do NOT execute yet** - check below first

---

## 🔍 Step 4: Verify Before Execution

Before running, confirm:

1. ✅ SQL code is highlighted (shows it's recognized as SQL)
2. ✅ No errors shown in editor (no red underlines)
3. ✅ You can see "CREATE TABLE survey_responses"
4. ✅ You can see "CREATE INDEX" statements (3 indexes)
5. ✅ You can see "CREATE POLICY" statements (2 policies)

**Screenshot your screen if unsure** - compare with above code.

---

## ▶️ Step 5: Execute the Migration

### Method 1: Click Execute Button (Recommended)
1. Look for blue "Execute" button (or ▶️ play icon)
2. Click it once
3. Wait for execution to complete (should be instant)

### Method 2: Keyboard Shortcut
- **Mac:** `Cmd + Enter`
- **Windows/Linux:** `Ctrl + Enter`

### Expected Output

You should see a message like:

```
Query executed successfully
-- or --
0 rows affected
-- or --
Command completed successfully
```

**NO ERROR MESSAGE = SUCCESS** ✅

---

## 🔎 Step 6: Verify Table Creation

### Quick Verification (In Supabase)

1. Click "Table Editor" in left sidebar
2. You should see `survey_responses` in the table list
3. Click on `survey_responses` to view the schema
4. Verify you can see all columns:
   - id (UUID)
   - user_id (TEXT)
   - user_type (TEXT)
   - household_size (INT)
   - expiry_forgetfulness (INT)
   - cooking_stress (INT)
   - duplicate_buying (BOOLEAN)
   - grocery_management (INT)
   - wants_expiry_alerts (BOOLEAN)
   - wants_multilingual (BOOLEAN)
   - wants_voice_assistant (BOOLEAN)
   - wants_shopping_list (BOOLEAN)
   - feature_ratings (JSONB)
   - additional_feedback (TEXT)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

### Advanced Verification (SQL Query)

Run this SQL query in SQL Editor:

```sql
-- Check table exists and has correct columns
SELECT * FROM information_schema.columns
WHERE table_name = 'survey_responses'
ORDER BY ordinal_position;
```

**Expected Result:** Should show 16 rows (one for each column)

---

## 🎯 Step 7: Verify Indexes

Run this SQL query:

```sql
-- Check indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'survey_responses';
```

**Expected Result:** Should show 3 indexes:
- `survey_responses_pkey` (primary key)
- `idx_survey_responses_user_id`
- `idx_survey_responses_created_at`
- `idx_survey_responses_user_type`

---

## 🔐 Step 8: Verify RLS Policies

Run this SQL query:

```sql
-- Check RLS policies
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'survey_responses';
```

**Expected Result:** Should show 2 policies:
- `Enable insert for all users`
- `Enable select for authenticated users`

---

## ✅ Troubleshooting Migration Issues

### Error: "Relation already exists"
**Cause:** Table already created in this project
**Solution:** The table already exists - that's fine! You can proceed.

### Error: "Permission denied"
**Cause:** Insufficient SQL Editor permissions
**Solution:** 
1. Go to project Settings
2. Go to Database → SQL Editor Policies
3. Ensure your role has Editor permissions
4. Try again

### Error: "Syntax error"
**Cause:** Invalid SQL copied (maybe formatting issue)
**Solution:**
1. Clear the SQL Editor
2. Copy the SQL code again very carefully
3. Make sure all quotes and semicolons are there
4. Try again

### Error: "Function already exists"
**Cause:** You ran the migration twice
**Solution:** 
1. This is safe - Supabase shows a warning but table is fine
2. You can proceed with testing
3. Or drop and recreate if you want a clean slate

### No response/timeout
**Cause:** Network issue or very large operation
**Solution:**
1. Wait 30 seconds
2. Refresh the page
3. Go to Table Editor and check if table exists
4. If table exists, migration succeeded!

---

## 🧪 Step 9: Test Table Insert

### Via SQL Editor

Run this test insert:

```sql
-- Test inserting a sample response
INSERT INTO survey_responses (
  user_id,
  user_type,
  household_size,
  expiry_forgetfulness,
  cooking_stress,
  duplicate_buying,
  grocery_management,
  wants_expiry_alerts,
  wants_multilingual,
  wants_voice_assistant,
  wants_shopping_list,
  feature_ratings,
  additional_feedback
) VALUES (
  'test_user_123',
  'Working Woman',
  3,
  2,
  1,
  true,
  2,
  true,
  true,
  false,
  true,
  '{"expiryAlerts": 5, "recipeSuggestions": 4, "qrScanner": 3, "voiceAssistant": 4, "shoppingList": 5, "vitAutoSync": 2, "aiLabelScanner": 4}'::jsonb,
  'Great app! Would love meal planning features.'
);
```

**Expected Result:**
```
1 row inserted
```

### Verify Insert Worked

Run this query:

```sql
-- Verify the test data was inserted
SELECT * FROM survey_responses WHERE user_id = 'test_user_123';
```

**Expected Result:** One row with all your test data

### Clean Up Test Data (Optional)

```sql
-- Delete the test data
DELETE FROM survey_responses WHERE user_id = 'test_user_123';
```

---

## 🚀 Step 10: Ready for Application

Your database is now ready! The NoshNurture survey can:
- ✅ Save survey responses
- ✅ Track user sessions
- ✅ Store feature ratings
- ✅ Calculate statistics
- ✅ Support admin analytics

---

## 📝 Migration Verification Checklist

- [ ] SQL code pasted without errors
- [ ] Execution completed successfully
- [ ] Table `survey_responses` visible in Table Editor
- [ ] All 16 columns present with correct types
- [ ] 3 indexes created
- [ ] 2 RLS policies enabled
- [ ] Test insert successful
- [ ] Test data appears in table
- [ ] Test data cleaned up (optional)

**All checkboxes marked?** → ✅ Migration is complete!

---

## 🎯 Next Steps After Migration

1. **Verify App Configuration**
   ```bash
   # Ensure .env.local has all 3 keys
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Test the Survey Locally**
   ```bash
   npm run dev
   # Visit http://localhost:3000/survey
   # Complete and submit survey
   ```

3. **Check Data Was Saved**
   - Go to Supabase Table Editor
   - Open `survey_responses` table
   - Should see your test submission!

4. **Test Admin Dashboard**
   ```bash
   # Visit http://localhost:3000/admin/survey
   # Enter code: nosh_admin_2025
   # Should see your test data in stats
   ```

5. **Deploy to Production**
   ```bash
   # When ready
   git push origin main
   # Vercel auto-deploys
   ```

---

## 📊 What Was Created

### Table: `survey_responses`
- **Purpose:** Store all user survey submissions
- **Rows:** One per survey submission
- **Columns:** 16 (user info, assessments, ratings, feedback)
- **Indexes:** 3 (for fast queries)
- **Security:** RLS policies enabled
- **Lifecycle:** Auto-updated timestamps

### Policies
- **Insert Policy:** Any user can submit (public insert)
- **Select Policy:** Any user can read (public read)
- **Purpose:** Allow anonymous survey submissions while preventing unauthorized deletes

### Trigger
- **Function:** `update_survey_responses_updated_at()`
- **Trigger:** `survey_responses_updated_at`
- **Purpose:** Auto-update `updated_at` timestamp on any edit

---

## 🆘 Need Help?

### Verify Everything is Working
```bash
# In your project directory
npm run dev

# Test survey at http://localhost:3000/survey
# Complete form and submit

# Check data in Supabase Table Editor
# Should show your submission!
```

### Check Logs for Errors
```bash
# Terminal should show any API errors
# Browser console (F12) shows submission status
# Supabase dashboard shows any RLS issues
```

### Common Success Indicators
- ✅ Table visible in Supabase
- ✅ Can insert test data
- ✅ Survey form submits without errors
- ✅ Data appears in admin dashboard
- ✅ No errors in browser console

---

## 📞 Support

If migration fails:
1. Check above troubleshooting section
2. Review: `docs/SURVEY_QUICK_START.md`
3. See: `docs/SURVEY_API_REFERENCE.md` → Error Handling
4. Verify all Supabase credentials in .env.local

---

**Migration Status:**
- ✅ Prepared
- ⏳ Execute when ready
- 📋 Instructions above

**Estimated Time:** 2-5 minutes

**Expected Result:** Production-ready database for survey system!

---

**Good luck! 🎉**

Once this migration is complete, your survey system is fully operational and ready to collect user feedback!
