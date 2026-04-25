# Chrome Translation Setup

## Check Your Chrome Version

1. Click the three dots (⋮) → **Help** → **About Google Chrome**
2. Note your version number

**Translation API requires: Chrome 140+**

---

## Enable Translation in Chrome

### Option 1: Chrome 140+ (Automatic)
If you have Chrome 140 or newer:
- Translation should work automatically
- No settings needed!

### Option 2: Earlier Chrome Versions
If you have Chrome 119-139, enable the experimental feature:

1. Go to: `chrome://flags`
2. Search: `translation-api`
3. Find: "Translation API"
4. Set to: **"Enabled"**
5. Click **"Relaunch"** button
6. Chrome restarts automatically

### Step-by-Step Screenshots

**Step 1: Open Chrome Flags**
```
1. Type in address bar: chrome://flags
2. Press Enter
```

**Step 2: Search for Translation**
```
1. Use Ctrl+F (or Cmd+F on Mac)
2. Type: translation-api
```

**Step 3: Change Setting**
```
1. Find "Translation API" option
2. Click dropdown (currently says "Default")
3. Select "Enabled"
4. Click "Relaunch" button
```

**Step 4: Done!**
```
Chrome restarts with Translation API enabled
```

---

## After Enabling

1. Go to: https://noshnurture.vercel.app
2. Click on a recipe
3. Select language (Hindi, Marathi, etc.)
4. Click **"Translate"** button
5. Recipe instructions should translate! ✅

---

## Still Not Working?

### Check Your Chrome Version
- Click ⋮ → **Help** → **About Google Chrome**
- If version < 119: **Update Chrome first**
  - Click **"Update"** button that appears
  - Restart Chrome

### Verify Translation API is Enabled
1. Go to `chrome://flags`
2. Search `translation-api`
3. Make sure it says **"Enabled"** (not "Default")

### Try a Different Approach
If still not working, use **Chrome DevTools**:
1. Right-click page → **Inspect**
2. Go to **Console** tab
3. Check for red error messages
4. Share the error with us

---

## Alternative: Use Brave

If Chrome doesn't work:
1. Download Brave: https://brave.com
2. Install and open
3. Go to your recipe
4. Translation should work automatically!

Brave has better translation support than Chrome.

---

## What Version Do You Have?

Please tell us:
1. Your Chrome version number
2. If you see the "Translate" button (yes/no)
3. What error message appears (copy-paste)

Then we can help better! 😊

---

## Quick Checklist

✅ Chrome version 140+ (or 119+ with flag enabled)  
✅ Translation API enabled in `chrome://flags`  
✅ Chrome restarted after enabling  
✅ Website opened in fresh tab  
✅ Language selected on recipe  
✅ Click "Translate" button  

If all checked, it should work! 🎉
