#!/bin/bash

# Hey Nosh Voice Assistant Local Testing Script
# Tests various query variations to verify proper intent detection and response generation

BASE_URL="http://localhost:3000"
API_ENDPOINT="${BASE_URL}/api/voice-assistant/query"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
total_tests=0
passed_tests=0
failed_tests=0

# Get auth token from local storage or use mock
# Note: For local testing, you may need to authenticate first
AUTH_TOKEN=""

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}Hey Nosh Voice Assistant - Local Testing${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

# Function to test a query
test_query() {
    local query="$1"
    local expected_intent="$2"
    local description="$3"
    
    ((total_tests++))
    
    echo -e "${YELLOW}Test #$total_tests: $description${NC}"
    echo -e "Query: \"${query}\""
    
    # First, detect intent using the nosh-service function
    # This simulates what the frontend does
    
    # For demonstration, we'll show what the system SHOULD do
    echo -e "Expected Intent: ${expected_intent}"
    echo ""
    
    # In a real test, you would:
    # 1. Call detectIntent() to get the intent
    # 2. Call the backend API with that intent
    # 3. Verify the response is helpful and specific
}

# Category 1: Expiry Items Queries
echo -e "${BLUE}=== Category 1: Expiry Items Queries ===${NC}\n"

test_query "What items are expiring soon?" "get_expiring_items" "Basic expiry question"
test_query "Which products are close to their expiry date?" "get_expiring_items" "Products close to expiry"
test_query "Do I have anything going bad shortly?" "get_expiring_items" "Colloquial: going bad"
test_query "Tell me the items that will expire soon." "get_expiring_items" "Tell me items expiring"
test_query "What in my inventory is about to spoil?" "get_expiring_items" "About to spoil"
test_query "Are any of my stored items nearing expiry?" "get_expiring_items" "Stored items nearing expiry"
test_query "Show me the food that's expiring in the next few days." "get_expiring_items" "Expiring in next few days"
test_query "Anything in my kitchen that won't last long?" "get_expiring_items" "Won't last long"
test_query "List items that are reaching their expiration." "get_expiring_items" "Reaching expiration"
test_query "What should I use quickly before it expires?" "get_expiring_items" "Use quickly before expires"

echo -e "\n${BLUE}=== Category 2: Recipe Queries ===${NC}\n"

test_query "What recipes can I make right now?" "get_makeable_recipes" "Recipes I can make"
test_query "Suggest something I can prepare today." "get_makeable_recipes" "Suggest prepare today"
test_query "What should I cook for today's meal?" "get_makeable_recipes" "What to cook today"
test_query "Based on my ingredients, what can I make?" "get_makeable_recipes" "Based on ingredients"
test_query "Recommend a dish I can cook now." "get_makeable_recipes" "Recommend dish"
test_query "What food can I prepare at home today?" "get_makeable_recipes" "Prepare at home today"
test_query "What should I make for lunch?" "get_makeable_recipes" "Make for lunch"
test_query "Give me some cooking ideas for today." "get_makeable_recipes" "Cooking ideas"
test_query "What's a good dish to cook tonight?" "get_makeable_recipes" "Cook tonight"
test_query "What can I whip up with what I have?" "get_makeable_recipes" "Whip up"

echo -e "\n${BLUE}=== Category 3: Cuisine-Specific Queries ===${NC}\n"

test_query "Show me Indian recipes." "get_cuisine_recipes" "Show Indian recipes (basic)"
test_query "Give me some Indian recipes." "get_cuisine_recipes" "Give Indian recipes"
test_query "Show Indian dishes I can make." "get_cuisine_recipes" "Indian dishes I can make"
test_query "Suggest a few Indian food recipes." "get_cuisine_recipes" "Suggest Indian food"
test_query "I want to cook something Indian — what are my options?" "get_cuisine_recipes" "Cook something Indian"
test_query "Display some Indian cuisine recipes." "get_cuisine_recipes" "Display Indian cuisine"
test_query "Recommend traditional Indian dishes." "get_cuisine_recipes" "Recommend Indian dishes"
test_query "What Indian meals can I prepare?" "get_cuisine_recipes" "Indian meals"
test_query "Let me see recipes from Indian cuisine." "get_cuisine_recipes" "From Indian cuisine"
test_query "Any Indian food ideas?" "get_cuisine_recipes" "Any Indian ideas"

echo -e "\n${BLUE}=== Category 4: Inventory Queries ===${NC}\n"

test_query "What's in my inventory?" "get_inventory" "What's in inventory"
test_query "Show me all the items I currently have." "get_inventory" "All items I have"
test_query "What's stored in my kitchen right now?" "get_inventory" "Kitchen items"
test_query "List everything in my inventory." "get_inventory" "List everything"
test_query "What items are available with me?" "get_inventory" "Available items"
test_query "Display my current stock." "get_inventory" "Current stock"
test_query "What ingredients do I have at the moment?" "get_inventory" "Have at moment"
test_query "Tell me what's in my pantry." "get_inventory" "What's in pantry"
test_query "What's the current inventory status?" "get_inventory" "Inventory status"
test_query "Show my available items." "get_inventory" "Available items"

echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "Total Tests: ${total_tests}"
echo -e "Expected Intents Detected: ${passed_tests}/${total_tests}"
echo ""
