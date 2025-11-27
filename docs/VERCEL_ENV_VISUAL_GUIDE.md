# 📸 Visual Guide: Adding Environment Variable to Vercel

## Step-by-Step Screenshots Description

### Step 1: Vercel Dashboard
```
https://vercel.com/dashboard
                    ↓
            [noshnuriture]  ← Click this project
```

### Step 2: Project Settings
```
Dashboard Home
     ↓
[Settings] [Deployments] [Analytics] [Usage]
    ↑ Click here
     ↓
Settings Page Opens
```

### Step 3: Environment Variables Section
```
Settings Sidebar (Left):
- General
- Git
- Environment Variables  ← Click here
- Domains
- SSL/TLS
- Functions
- Analytics
```

### Step 4: Add New Environment Variable
```
Environment Variables Page
     ↓
[+ Add New] Button (top right)  ← Click here
     ↓
Modal Opens with 3 Fields:
┌─────────────────────────────────┐
│ Name: _______________________   │
│ Value: ______________________   │
│ Environments: ○ Production      │
│              ○ Preview          │
│              ○ Development      │
│ [Save]                          │
└─────────────────────────────────┘
```

### Step 5: Fill in Details
```
Name Field:
  NEXT_PUBLIC_SARVAM_API_KEY
  └─ MUST match exactly (case-sensitive)

Value Field:
  sk_gch14o5g_SidZtzutIKTsT6QR824GnQsI
  └─ Your Sarvam AI API key

Environments:
  ✓ Production   (checked)
  ✓ Preview      (checked)
  ✓ Development  (checked)
  └─ Check ALL three
```

### Step 6: Save and Redeploy
```
After clicking [Save]:
     ↓
Environment Variable Created ✓
     ↓
Go to [Deployments] Tab
     ↓
Find Latest Deployment (top row)
     ↓
Click ⋮ (three dots menu)
     ↓
Select [Redeploy]
     ↓
Wait 60-90 seconds...
     ↓
Deployment Complete ✓ (Green checkmark)
```

---

## Verification Steps

### Verify Env Var is Set
```
Vercel Dashboard → Settings → Environment Variables
                                    ↓
Should see: NEXT_PUBLIC_SARVAM_API_KEY: sk_gch14o5g_...
                                         (partially hidden for security)
```

### Verify Deployment Succeeded
```
Vercel Dashboard → Deployments
                        ↓
Top deployment should show:
  ✓ READY
  ⏱ ~90s ago
  🌍 noshnuriture.vercel.app
```

### Verify Translations Work
```
1. Open: https://noshnuriture.vercel.app
2. Select: Any recipe
3. Language: Change to हिंदी (Hindi)
4. Click: Translate button
5. Result: ✅ Instructions translate to Hindi!
           (If still English, wait 5 min and refresh)
```

---

## Common Mistakes to Avoid

❌ **Mistake 1:** Env var name is wrong
```
WRONG: NEXT_PUBLIC_SARVAM_API
RIGHT: NEXT_PUBLIC_SARVAM_API_KEY
                               ↑
                         Must include _KEY
```

❌ **Mistake 2:** Environment not selected
```
WRONG: Only checked "Production"
RIGHT: Check ALL three:
       ✓ Production
       ✓ Preview
       ✓ Development
```

❌ **Mistake 3:** API value is incomplete
```
WRONG: sk_gch14o5g_SidZtzutI... (trimmed)
RIGHT: sk_gch14o5g_SidZtzutIKTsT6QR824GnQsI (full)
```

❌ **Mistake 4:** Didn't click Redeploy
```
WRONG: Added env var but didn't redeploy
RIGHT: After adding:
       → Go to Deployments
       → Click latest deployment's ⋮ menu
       → Click Redeploy
```

❌ **Mistake 5:** Cached old version
```
WRONG: Still seeing "API key not configured"
RIGHT: Hard refresh browser:
       Mac: Cmd+Shift+R
       Windows: Ctrl+Shift+F5
       Or: Clear browser cache completely
```

---

## If Something Goes Wrong

### Symptom: Still says "API key not configured"

**Check 1:** Is the env var really there?
```
Vercel Settings → Environment Variables
→ Should see NEXT_PUBLIC_SARVAM_API_KEY
→ Value should start with "sk_"
```

**Check 2:** Did you redeploy?
```
Vercel Deployments
→ Top deployment timestamp
→ Should be AFTER you added the env var
→ If old, click Redeploy button again
```

**Check 3:** Is browser cached?
```
Press: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
Or: DevTools → Network tab → Check "Disable cache"
```

### Symptom: Still getting "LibreTranslate failed"

This is OK! It means:
- Sarvam AI worked but might have failed ✓
- LibreTranslate network unavailable
- Browser Translation API will try next
- Eventually falls back to English

### Symptom: Deployments says "Error"

```
Click on deployment → Scroll to Logs
Look for: [ERROR] or [FAILED]
If TypeScript error: Code needs fixing
If network error: Vercel issue, wait 5 min
If auth error: Env var not properly saved
```

---

## Expected Timeline

```
You: Add env var to Vercel
     ↓ (1 min)
Vercel: Triggers redeploy
     ↓ (30-60 seconds)
Vercel: Build completes
     ↓ (30 seconds)
Vercel: Deploy to edge
     ↓ (5 seconds)
Browser: Refreshes site
     ↓ (you)
You: Click Translate
     ↓ (1-2 seconds)
Result: ✅ "हिंदी में अनुवाद!" (Hindi translation)
```

---

## Success Checklist

- [ ] Opened https://vercel.com/dashboard
- [ ] Clicked noshnuriture project
- [ ] Went to Settings → Environment Variables
- [ ] Clicked "+ Add New"
- [ ] Entered: `NEXT_PUBLIC_SARVAM_API_KEY`
- [ ] Entered: `sk_gch14o5g_SidZtzutIKTsT6QR824GnQsI`
- [ ] Checked ALL environments (Production, Preview, Development)
- [ ] Clicked Save
- [ ] Went to Deployments tab
- [ ] Clicked Redeploy on latest deployment
- [ ] Waited ~90 seconds ⏳
- [ ] Hard refreshed browser (Cmd+Shift+R or Ctrl+Shift+F5)
- [ ] Tested https://noshnuriture.vercel.app
- [ ] Selected recipe + changed to हिंदी + clicked Translate
- [ ] ✅ Translation worked!

---

**You've got this! 🚀 Just 5 minutes of setup and translations will work perfectly!**
