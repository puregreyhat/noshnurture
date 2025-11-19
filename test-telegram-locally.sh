#!/bin/bash

# Telegram Connection Local Testing Script
# Tests the complete Telegram bot webhook flow locally

set -e

echo "🧪 NoshNurture Telegram Connection Test Suite"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get user ID from logged-in user (you'll need to provide this)
echo -e "${BLUE}Step 1: Get your user ID${NC}"
echo "You need to provide your actual user ID from Supabase auth"
echo "Go to: Supabase Dashboard → Authentication → Users → Copy your 'id' field"
echo ""
read -p "Enter your Supabase user ID: " USER_ID

if [ -z "$USER_ID" ]; then
  echo -e "${RED}✗ User ID is required${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Using user ID: $USER_ID${NC}"
echo ""

# Test 1: Check local dev server is running
echo -e "${BLUE}Step 2: Verify dev server is running${NC}"
if ! curl -s http://localhost:3001 > /dev/null 2>&1 && ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo -e "${RED}✗ Dev server not running on :3000 or :3001${NC}"
  echo "Run: npm run dev"
  exit 1
fi

# Detect port
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  PORT=3000
else
  PORT=3001
fi

echo -e "${GREEN}✓ Dev server running on localhost:$PORT${NC}"
echo ""

# Test 2: Check if webhook endpoint exists
echo -e "${BLUE}Step 3: Test webhook endpoint${NC}"
WEBHOOK_TEST=$(curl -s -X POST http://localhost:$PORT/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"chat":{"id":123},"text":"/start test"}}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$WEBHOOK_TEST" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Webhook endpoint responding${NC}"
else
  echo -e "${RED}✗ Webhook returned HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 3: Simulate Telegram /start command
echo -e "${BLUE}Step 4: Simulate Telegram bot /start command${NC}"
echo "This will call the webhook with a simulated Telegram message"
echo ""

CHAT_ID=987654321  # Fake Telegram chat ID

echo "Sending: /start $USER_ID from chat $CHAT_ID"
RESPONSE=$(curl -s -X POST http://localhost:$PORT/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": {
      \"chat\": {
        \"id\": $CHAT_ID,
        \"first_name\": \"TestUser\"
      },
      \"from\": {
        \"id\": $CHAT_ID,
        \"first_name\": \"TestUser\"
      },
      \"text\": \"/start $USER_ID\"
    }
  }")

echo -e "${GREEN}✓ Webhook called${NC}"
echo ""

# Test 4: Check preferences API
echo -e "${BLUE}Step 5: Check user preferences after connection${NC}"
echo "Fetching preferences from: /api/user/preferences"
echo "Note: This requires authentication - will likely show defaults"
echo ""

PREFS=$(curl -s http://localhost:$PORT/api/user/preferences \
  -H "Accept: application/json")

echo "Response: $PREFS"
echo ""

# Test 5: Query database to verify save
echo -e "${BLUE}Step 6: How to verify in Supabase${NC}"
echo "1. Go to Supabase Dashboard"
echo "2. Click 'SQL Editor'"
echo "3. Run this query:"
echo ""
echo -e "${YELLOW}SELECT * FROM user_preferences WHERE user_id = '$USER_ID';${NC}"
echo ""
echo "Expected result:"
echo "  - user_id: $USER_ID"
echo "  - telegram_chat_id: $CHAT_ID (or the value sent in /start)"
echo "  - enable_telegram: false (default)"
echo ""

# Test 6: Manual testing instructions
echo -e "${BLUE}Step 7: Manual end-to-end test${NC}"
echo ""
echo "To fully test the Telegram connection:"
echo ""
echo "1. In your browser, go to: http://localhost:$PORT/settings"
echo ""
echo "2. Scroll down to 'Telegram Notifications' section"
echo ""
echo "3. Click 'Connect Telegram' button"
echo "   → This will open Telegram bot chat"
echo ""
echo "4. In Telegram, click the 'Start' button or send /start"
echo ""
echo "5. Bot should send you a message with a verification button"
echo "   → Click '✅ Verify & Open Settings'"
echo ""
echo "6. You should be redirected back to Settings page"
echo "   → Status should show 'Connected'"
echo ""
echo "7. Click 'Send Now' to test notification"
echo "   → Should show 'Email: 1, Telegram: 1'"
echo ""

# Test 7: Check browser console for errors
echo -e "${BLUE}Step 8: Browser DevTools Checklist${NC}"
echo ""
echo "Open DevTools (F12) and check Console for:"
echo "  ✓ [Settings] Preferences loaded: { enableEmail: true, ... }"
echo "  ✓ [Settings] Telegram connect check: { connected: true, ... }"
echo "  ✓ [Settings] Reminder response: { success: true, stats: ... }"
echo ""
echo "If you see errors, check:"
echo "  - Network tab: All API calls return 200"
echo "  - Console: No red error messages"
echo ""

echo -e "${GREEN}✅ Testing complete!${NC}"
echo ""
echo "Summary:"
echo "  - Webhook: HTTP $HTTP_CODE"
echo "  - User ID: $USER_ID"
echo "  - Dev Server: localhost:$PORT"
echo ""
echo "Next steps:"
echo "  1. Test the Telegram flow manually as described above"
echo "  2. If working locally, deploy to Vercel"
echo "  3. Test on production HTTPS endpoint"
echo ""
