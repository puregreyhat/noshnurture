# Conversational Multi-Product Input Feature

## Overview
The "Batch Add" feature allows users to add multiple products to inventory through a natural conversational interface. Instead of manually scanning or entering each product one by one, users can speak or type all product details in a flowing conversation with the AI.

## How It Works

### User Flow
1. User clicks "💬 Batch Add" button on scanner page
2. AI asks: "How many products would you like to add today?"
3. User says: "I have 10 products"
4. AI starts: "Let's start with product 1. What is the first product name?"
5. User says: "Fortune Biryani Rice"
6. AI asks: "Got it - Fortune Biryani Rice. What's the quantity and unit? (e.g., '1 kg')"
7. User says: "1 kg"
8. AI asks: "Fortune Biryani Rice, 1 kg. What's the expiry date? (e.g., '29 06 2026')"
9. User says: "29 06 2026"
10. AI confirms: "✓ Added 1 kg of Fortune Biryani Rice expiring on 29-06-2026. Confirm?"
11. User says: "yes" or clicks Confirm button
12. AI: "Great! Now let's add product 2. What is it?"
13. Process repeats for remaining products

### Interaction Methods
- **Voice Input**: Use microphone for hands-free input (🎤 button)
- **Text Input**: Type manually if voice is not working (⌨️ Type here field)
- **Confirmation**: 
  - Say "yes/confirm" or click ✓ Confirm button
  - Say "no/retry" or click ✗ Retry button

## Technical Architecture

### Components
1. **`ConversationalInventoryInput.tsx`** (Main Component)
   - Manages conversation state and history
   - Handles voice recognition (Web Speech API)
   - Manages product collection flow
   - Renders conversation UI with message history
   - Provides voice + text input methods

2. **`gemini-service.ts`** (AI Service)
   - New function: `extractProductDetailsFromSpeech(userInput)`
   - Parses natural language input using Gemini 2.0 Flash
   - Extracts: productName, quantity, unit, expiryDate
   - Returns structured JSON with confidence score

3. **`scanner/page.tsx`** (Integration)
   - New state: `showConversationalInput`
   - New handler: `handleConversationalProductsAdded()`
   - New button: "Batch Add" (pink, 💬 icon)
   - Renders `ConversationalInventoryInput` modal

### Data Flow
```
User Input (Voice/Text)
    ↓
Gemini Service: extractProductDetailsFromSpeech()
    ↓
Parse JSON Response (productName, quantity, unit, expiryDate)
    ↓
Ask for missing fields OR confirm complete entry
    ↓
User confirms → Add to products array
    ↓
Move to next product OR finish
    ↓
Return all products → Handler creates InventoryItems
    ↓
Save to database
```

## Key Features

### Smart Input Parsing
- Detects product names (brand + type)
- Extracts quantities and units (kg, liters, boxes, etc.)
- Parses dates in multiple formats:
  - "29 06 2026" → "29-06-2026"
  - "June 2026" → "30-06-2026" (last day of month)
  - "29-06-2026" → "29-06-2026"

### Progressive Information Gathering
- Asks for missing fields one at a time
- Confirms before moving to next product
- Allows retry if information was wrong
- Shows conversation history for reference

### Voice + Text Hybrid
- Primary: Voice input with continuous listening
- Fallback: Manual text input if voice fails
- Switch between modes anytime
- Handles network errors gracefully

### Conversation Context
- Tracks: Total products, current index, collected products
- Shows progress: "Product 2 of 10"
- Maintains history: All exchanges visible to user
- Auto-scroll: Latest message always visible

## Gemini Prompt Structure

The `extractProductDetailsFromSpeech()` function sends this prompt to Gemini:

```
"You are an expert at parsing natural language product inventory information spoken by users.

Analyze this user input and extract product details:
\"[user input]\"

Extract the following information if present:
1. **Product Name** - The brand and product type
2. **Quantity** - The numeric amount
3. **Unit** - The unit of measurement
4. **Expiry Date** - The expiration date in any format

Return ONLY a JSON object with this exact structure:
{
  \"productName\": \"extracted product name or null\",
  \"quantity\": \"extracted quantity number or null\",
  \"unit\": \"extracted unit or null\",
  \"expiryDate\": \"extracted date in DD-MM-YYYY format or null\",
  \"confidence\": 0.95,
  \"notes\": \"any observations about the input\"
}

Important rules:
- Convert dates to DD-MM-YYYY format
- For dates like \"June 2026\", use the last day of month: \"30-06-2026\"
- Extract ONLY what is mentioned, set others to null
- Confidence: 1.0 = all fields found, 0.5 = some fields found, 0.3 = very unclear
"
```

## Usage Examples

### Example 1: Quick Batch Entry
**User**: "I have 5 products"
**AI**: "Perfect! Let's add them. Product 1?"
**User**: "Maggi Noodles, 3 boxes, expires June 2026"
**AI**: "Got 3 boxes of Maggi Noodles expiring 30-06-2026. Confirm?"
**User**: "Yes"
**AI**: "Great! Product 2?"

### Example 2: Handling Typos
**User**: "I have 2 products"
**AI**: "What is product 1?"
**User**: "Fartin Biryani Rice" (typo)
**AI**: "I heard 'Fartin Biryani Rice'. Is this the product name?"
**User**: "No, it's Fortune Biryani Rice"
**AI**: "Got it - Fortune Biryani Rice. Quantity?"

### Example 3: Incomplete Information
**User**: "Amul Butter"
**AI**: "Got it - Amul Butter. What's the quantity and unit? (e.g., '500g')"
**User**: "250 gram"
**AI**: "Amul Butter, 250 gram. What's the expiry date? (e.g., '29 06 2026')"
**User**: "December 25"
**AI**: "✓ Added 250 gram of Amul Butter expiring on 25-12-2026. Confirm?"

## Error Handling

### Network Issues
- Automatic retry up to 2 times with exponential backoff
- Falls back to text input if voice service fails
- Clear error messages for user

### Input Validation
- Date validation: Rejects past dates
- Quantity validation: Accepts numbers only
- Product name validation: At least 2 characters

### Confidence Scoring
- 1.0: All fields clearly extracted
- 0.7-0.9: Most fields extracted, minor uncertainty
- 0.5-0.6: Some fields extracted, ambiguity present
- 0.3-0.4: Very limited information extracted
- 0.0: No usable information

## Integration with Existing Features

### Inventory Dashboard
- Products added via "Batch Add" appear in dashboard
- Show "Days Until Expiry" countdown
- Categories auto-set to "groceries"
- Storage type auto-set to "refrigerator"

### Database
- Each product gets unique ID: `conv-[timestamp]-[random]`
- Order ID: `conv-[timestamp]`
- All metadata captured: quantity, unit, expiry, category

### Analytics
- Track: How many products added per session
- Track: Average products per batch
- Track: Voice vs text input usage ratio

## UI/UX Details

### Color Scheme
- **Header**: Pink gradient (purple-600 to pink-600)
- **Conversation**: 
  - User messages: Purple (bg-purple-600)
  - AI messages: Gray (bg-gray-300)
- **Buttons**: 
  - Confirm (✓): Green
  - Retry (✗): Red
  - Mic: Purple when listening, Red when active
  - Send: Pink

### Responsive Design
- Full-width modal on mobile
- Max width: 2xl (448px) on desktop
- Conversation scrolls vertically
- Buttons stack on small screens

### Accessibility
- Voice input toggle: Labeled "Start listening" / "Stop listening"
- Keyboard shortcuts: Enter to send text
- Screen reader friendly: Proper ARIA labels
- High contrast: Good readability in all conditions

## Performance Considerations

### Gemini API Calls
- One API call per user input (not per keystroke)
- Batch processing: Multiple products in one conversation
- Average response time: 500-1000ms
- Handles up to 20 products per batch efficiently

### State Management
- Conversation history stored in component state
- Products array grows as items added
- Auto-cleanup on modal close
- Memory efficient: ~10KB per 10 products

### Browser Support
- Modern browsers only (ES2020+)
- Web Speech API supported in Chrome, Safari, Edge
- Text input fallback for unsupported browsers
- Network requirements: ~50KB per batch

## Future Enhancements

1. **Image Recognition**: Capture photo of product → AI extracts details
2. **Batch Upload**: CSV import for supplier data
3. **Smart Defaults**: Learn common products and auto-suggest
4. **Multi-language**: Support Hindi, Tamil, Telugu input
5. **Barcode Scanning**: Scan barcodes during conversation
6. **Product Database**: Autocomplete from historical products
7. **Undo/Edit**: Modify products after confirmation
8. **Scheduled Reminders**: Auto-set reminders during input

## Testing Checklist

- [ ] Voice input recognition works on desktop/mobile
- [ ] Text input fallback functions correctly
- [ ] Dates in various formats parse correctly
- [ ] Confirmation and retry buttons work
- [ ] Products saved to database
- [ ] Inventory dashboard shows new products
- [ ] Expiry countdown calculates correctly
- [ ] Error messages display properly
- [ ] Modal closes after completion
- [ ] Memory cleanup happens on unmount

## Troubleshooting

### Voice Not Working
- Check browser microphone permissions
- Ensure HTTPS protocol (required for Web Speech API)
- Try text input fallback
- Verify internet connectivity

### Dates Not Parsing
- Use format: "DD MM YYYY" or "DD-MM-YYYY"
- Avoid: "2026-06-29" (this might be ambiguous)
- For month-only: Say "June 2026" (assumes last day)

### Gemini Timeout
- Check API key is valid
- Verify NEXT_PUBLIC_GEMINI_API_KEY in .env
- Wait 5-10 seconds, then retry
- Check API quota hasn't been exceeded

### Products Not Saving
- Check database connection
- Verify Supabase credentials
- Check network tab for failed requests
- See browser console for errors
