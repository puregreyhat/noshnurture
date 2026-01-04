# 🧪 Hey Nosh Text Input Testing Guide

**New Feature**: Text input mode added for easier debugging!

---

## 🎯 Quick Start

1. **Click the Hey Nosh button** on the home page (purple mic icon, bottom right)
2. **Look for the new button**: `⌨️ Use Text` (next to the mic)
3. **Click it** to switch to text mode
4. **Type your query** in the text box
5. **Press Enter or click Send**
6. **See the response** appear below

---

## 🔍 Testing Strategy

### Step 1: Test Text (No Voice Issues)
```
Query: "what's expiring soon"
Input Method: Type into text box
Expected: "You have X items expiring soon..."
Result: ✅ Works if text works
```

This tells us:
- ✅ Intent detection works
- ✅ Backend API works
- ✅ Response generation works
- ✅ No microphone issues (since we're typing)

### Step 2: If Text Works, Test Voice
If text mode shows proper responses, then:
- ✅ The issue is NOT in the backend
- ✅ The issue is in speech recognition OR intent detection
- We need to check browser console logs

### Step 3: Check Console Logs
Open DevTools (F12) and look for:

```javascript
// If you see this, Gemini worked:
Intent detected from Gemini: {
  intent: "get_expiring_items",
  confidence: 0.95
}

// If you see this, fallback worked:
Using keyword-based fallback for: what's expiring soon
Intent detected from Gemini: {
  intent: "get_expiring_items",
  confidence: 0.85
}

// If you see this, something failed:
❌ Voice query error: ...
```

---

## 📝 Test Cases

| Query | Expected Response | Voice | Text |
|-------|-------------------|-------|------|
| "what's expiring soon" | Items list | ? | ✅ Test first |
| "what can I make" | Recipe suggestions | ? | ✅ Test first |
| "show Indian recipes" | Indian recipes | ? | ✅ Test first |
| "what's in my inventory" | Inventory list | ? | ✅ Test first |
| "hi" | Greeting message | ? | ✅ Test first |

---

## 🎛️ Switching Between Modes

**Text to Voice:**
1. Click `🎤 Switch to Voice` button
2. Text input disappears
3. Tap the microphone button

**Voice to Text:**
1. While in voice mode, click `⌨️ Use Text` button
2. Text input appears and auto-focuses
3. Type your query

---

## 🐛 Debugging Tips

### Text Works, Voice Doesn't?
1. Check microphone permissions in browser
2. Check browser console for speech recognition errors
3. Ensure microphone is working (test in another app)

### Text Doesn't Work?
1. Check backend API `/api/voice-assistant/query`
2. Check database connection
3. Look at browser Network tab → see if API call succeeds
4. Check error message in the red error box

### Intent Detection Issues?
1. Text shows "I didn't catch that"?
2. Check browser console for Gemini response
3. Verify Gemini API key is configured
4. Check if fallback patterns are triggering

---

## 💡 What We're Testing

```
Text Input Mode:
  ├─ User enters text
  ├─ Uses same handleVoiceQuery function
  ├─ Calls detectIntent (Gemini or keyword fallback)
  ├─ Validates confidence > 0.3
  ├─ Calls backend API
  ├─ Generates response
  └─ Displays result

This eliminates:
  ❌ Speech recognition issues
  ❌ Microphone permission issues
  ❌ Audio capture problems

This tests:
  ✅ Intent detection (Gemini or keywords)
  ✅ Backend API
  ✅ Response generation
  ✅ Overall flow logic
```

---

## 🎯 Success Criteria

### Text Mode Success ✅
```
User Types: "what's expiring soon"
System Shows: "You have 2 items expiring soon: Milk, Yogurt"
Browser Console: Intent detected with confidence > 0.3
Status: Backend is working!
```

### Then Test Voice ✅
```
User Says: "what's expiring soon"
System Shows: "You have 2 items expiring soon: Milk, Yogurt"
Browser Console: Voice recognized, intent detected
Status: Everything works!
```

### If Only Text Works
```
Problem: Voice not working, but text works
Root Cause: Speech recognition or intent detection from voice
Solution: Check voice debugging logs in console
```

---

## 🔧 Implementation Details

**New Button:**
- Shows: `⌨️ Use Text` when in voice mode
- Shows: `🎤 Switch to Voice` when in text mode
- Color changes to indicate active mode

**Text Input:**
- Auto-focuses when toggled
- Accepts Enter key to submit
- Disables while processing
- Placeholder shows helpful hint

**Same Query Handler:**
- Both voice and text use same `handleVoiceQuery` function
- Same intent detection logic
- Same backend API call
- Same response generation

---

## ✅ Next Steps

1. **Run the app**: `npm run dev`
2. **Go to homepage**
3. **Click Hey Nosh button**
4. **Click "⌨️ Use Text"**
5. **Type a test query** (e.g., "what's expiring soon")
6. **Observe the response**
7. **If it works**: Congratulations! Backend is fine, check voice
8. **If it fails**: Check error message and backend API

---

## 📊 Comparison

| Aspect | Voice | Text |
|--------|-------|------|
| Speech Recognition | Complex 🎤 | None ✅ |
| Intent Detection | Same 🧠 | Same 🧠 |
| Backend API | Same 🌐 | Same 🌐 |
| Response Generation | Same 💬 | Same 💬 |
| Easy to Test | No ❌ | Yes ✅ |
| Isolates Issues | Hard 🔴 | Easy 🟢 |

---

**Text mode is your debug superpower! Use it first to narrow down the issue.** 🚀

