#!/bin/bash

# Google Assistant Webhook Test Script
# Tests all webhook endpoints locally or in production

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
ACCESS_TOKEN="${2:-test-token}"

echo -e "${YELLOW}Testing Google Assistant Integration${NC}"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Webhook Health Check (Welcome Intent)
echo -e "${YELLOW}Test 1: Welcome Intent${NC}"
curl -s -X POST "$BASE_URL/api/assistant/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "responseId": "test-123",
    "queryResult": {
      "queryText": "welcome",
      "intent": {
        "name": "projects/test/agent/intents/123",
        "displayName": "Default Welcome Intent"
      },
      "parameters": {},
      "languageCode": "en"
    },
    "originalDetectIntentRequest": {
      "source": "google",
      "payload": {
        "user": {
          "userId": "test-user-123",
          "accessToken": "'$ACCESS_TOKEN'"
        }
      }
    },
    "session": "projects/test/agent/sessions/123"
  }' | jq -r '.fulfillmentText'

echo ""
echo ""

# Test 2: Add Product Intent
echo -e "${YELLOW}Test 2: Add Product (Tomato)${NC}"
curl -s -X POST "$BASE_URL/api/assistant/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "responseId": "test-124",
    "queryResult": {
      "queryText": "add 2 kg tomato",
      "intent": {
        "name": "projects/test/agent/intents/124",
        "displayName": "add_product"
      },
      "parameters": {
        "product_name": "tomato",
        "quantity": 2,
        "unit": "kg"
      },
      "languageCode": "en"
    },
    "originalDetectIntentRequest": {
      "source": "google",
      "payload": {
        "user": {
          "userId": "test-user-123",
          "accessToken": "'$ACCESS_TOKEN'"
        }
      }
    },
    "session": "projects/test/agent/sessions/123"
  }' | jq -r '.fulfillmentText'

echo ""
echo ""

# Test 3: Check Inventory Intent
echo -e "${YELLOW}Test 3: Check Inventory${NC}"
curl -s -X POST "$BASE_URL/api/assistant/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "responseId": "test-125",
    "queryResult": {
      "queryText": "check my inventory",
      "intent": {
        "name": "projects/test/agent/intents/125",
        "displayName": "check_inventory"
      },
      "parameters": {},
      "languageCode": "en"
    },
    "originalDetectIntentRequest": {
      "source": "google",
      "payload": {
        "user": {
          "userId": "test-user-123",
          "accessToken": "'$ACCESS_TOKEN'"
        }
      }
    },
    "session": "projects/test/agent/sessions/123"
  }' | jq -r '.fulfillmentText'

echo ""
echo ""

# Test 4: Check Expiring Intent
echo -e "${YELLOW}Test 4: Check Expiring Items${NC}"
curl -s -X POST "$BASE_URL/api/assistant/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "responseId": "test-126",
    "queryResult": {
      "queryText": "what is expiring soon",
      "intent": {
        "name": "projects/test/agent/intents/126",
        "displayName": "check_expiring"
      },
      "parameters": {
        "days": 7
      },
      "languageCode": "en"
    },
    "originalDetectIntentRequest": {
      "source": "google",
      "payload": {
        "user": {
          "userId": "test-user-123",
          "accessToken": "'$ACCESS_TOKEN'"
        }
      }
    },
    "session": "projects/test/agent/sessions/123"
  }' | jq -r '.fulfillmentText'

echo ""
echo ""

# Test 5: Get Recipes Intent
echo -e "${YELLOW}Test 5: Get Recipe Suggestions${NC}"
curl -s -X POST "$BASE_URL/api/assistant/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "responseId": "test-127",
    "queryResult": {
      "queryText": "suggest recipes",
      "intent": {
        "name": "projects/test/agent/intents/127",
        "displayName": "get_recipes"
      },
      "parameters": {},
      "languageCode": "en"
    },
    "originalDetectIntentRequest": {
      "source": "google",
      "payload": {
        "user": {
          "userId": "test-user-123",
          "accessToken": "'$ACCESS_TOKEN'"
        }
      }
    },
    "session": "projects/test/agent/sessions/123"
  }' | jq -r '.fulfillmentText'

echo ""
echo ""

# Test 6: OAuth Token Endpoint
echo -e "${YELLOW}Test 6: OAuth Token Exchange${NC}"
curl -s -X POST "$BASE_URL/api/assistant/token" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "'$ACCESS_TOKEN'",
    "grant_type": "authorization_code",
    "redirect_uri": "https://oauth-redirect.googleusercontent.com/r/test",
    "client_id": "test-client",
    "client_secret": "test-secret"
  }' | jq '.'

echo ""
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Usage:"
echo "  ./test-google-assistant.sh                              # Test localhost"
echo "  ./test-google-assistant.sh https://your-app.vercel.app  # Test production"
echo "  ./test-google-assistant.sh http://localhost:3000 YOUR_SUPABASE_TOKEN"
echo ""
echo "Note: For real testing, you need a valid Supabase access token."
echo "Get one by logging into your app and checking browser dev tools → Application → Local Storage"
