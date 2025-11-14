# Smart Expiry & Stock Management System - Setup Guide

## 🚀 Quick Setup

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Click "Create API Key"
3. Copy your API key

### 2. Add Environment Variables

Create or update `.env.local` in the root directory:

```env
# Gemini API Key for OCR and Voice Processing
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note**: The `NEXT_PUBLIC_` prefix makes it accessible in the browser. For production, consider using a backend API route.

### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` and test the features!

---

## 📸 Features Explained

### Feature 1: Photo Scan (OCR)
- User clicks 📸 Scan Label
- Takes photo of product expiry date
- Gemini AI extracts:
  - Expiry date (auto-formatted to DD-MM-YYYY)
  - Product name
  - Batch number
  - Manufacturing date
- Product automatically added to inventory

**How it works:**
```
User Photo → Gemini Vision API → Extract Text → Parse Dates → Add to Inventory
```

### Feature 2: Voice Input
- User clicks 🎤 Voice Add
- Speaks: "Add milk expiring December 15"
- Speech Recognition captures text
- Gemini AI processes natural language:
  - Product name: "milk"
  - Expiry date: "15-12-2025"
  - Quantity: optional
  - Unit: optional
- Product added automatically

**Supports:**
- English (en-IN)
- Hindi (hi-IN)
- Mixed Hindi-English (Hinglish)

### Feature 3: Smart Reminders
- 🟢 Green: More than 7 days
- 🟡 Yellow: 4-7 days
- 🟠 Orange: 1-3 days (get recipe suggestions)
- 🔴 Red: Expired

### Feature 4: Recipe Suggestions
- Click 👨‍🍳 button on items expiring in 1-7 days
- Gemini AI suggests:
  - Quick recipes (< 30 minutes)
  - Common ingredients
  - Indian cuisine focused

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── OCRScanner.tsx          # Photo capture & processing
│   ├── VoiceInput.tsx          # Voice recording & recognition
│   └── ProductInventory.tsx    # Main inventory management
├── lib/
│   └── gemini-service.ts       # Gemini API integration
└── types/
    └── index.ts                # TypeScript types
```

### Data Flow

```
User Action (Photo/Voice)
    ↓
OCRScanner / VoiceInput Component
    ↓
gemini-service.ts (Gemini API Call)
    ↓
Extracted Data (Product Name, Expiry Date)
    ↓
ProductInventory (Add to List)
    ↓
localStorage (Persist Data)
```

---

## 🔌 API Integration Details

### Gemini Vision API (OCR)
**Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

**Features:**
- Image-to-text extraction
- Date pattern recognition
- Smart parsing for Indian packaging

### Gemini Text API (Voice Processing)
**Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

**Features:**
- Natural language understanding
- Entity extraction (product, date, quantity)
- Context-aware parsing

### Web Speech API (Voice Recording)
- Browser's native speech recognition
- Supports multiple languages
- Works offline (limited)

---

## 📱 Component Usage

### In Your App Page

```typescript
import ProductInventory from '@/components/ProductInventory';

export default function Page() {
  return <ProductInventory />;
}
```

---

## ⚙️ Configuration

### Customize Languages
In `VoiceInput.tsx`:

```typescript
const [language, setLanguage] = useState('en-IN');
// Change to: 'hi-IN', 'gu-IN', 'ta-IN', etc.
```

### Adjust Reminder Thresholds
In `ProductInventory.tsx`:

```typescript
if (daysUntilExpiry <= 3) return { label: 'Urgent', ... };  // Change 3 to custom value
if (daysUntilExpiry <= 7) return { label: 'Soon', ... };    // Change 7 to custom value
```

### Add More Features
- **Family Sharing**: Use Supabase RLS for multi-user access
- **Push Notifications**: Add notification service
- **Offline Sync**: Implement service workers

---

## 🐛 Troubleshooting

### "NEXT_PUBLIC_GEMINI_API_KEY is not set"
- Add API key to `.env.local`
- Restart dev server

### Camera not working
- Check browser permissions
- Use HTTPS for production
- Try gallery upload instead

### Speech recognition not working
- Use Chrome/Edge browser
- Enable microphone permissions
- Check internet connection

### Low confidence on OCR
- Ensure good lighting
- Angle product clearly
- Photo should show full date

---

## 🚀 Production Deployment

### Security Best Practice
Move API key to backend:

```typescript
// Instead of NEXT_PUBLIC_, use server-side
// Create API route: /api/gemini
// Call from client → Backend → Gemini API
```

### Optimization
- Lazy load OCRScanner component
- Compress images before sending to API
- Cache recipe suggestions
- Add request rate limiting

---

## 📊 What Panel Will See

✅ **Innovation Points:**
1. **Advanced OCR** - Automatic date extraction from images
2. **Voice Input** - Accessibility for non-technical users
3. **Multilingual Support** - English & Hindi
4. **Smart Reminders** - Color-coded expiry alerts
5. **Recipe Integration** - AI-powered suggestions
6. **Offline Capable** - localStorage persistence
7. **Family Sharing Ready** - Architecture supports multi-user

---

## 🎯 Next Steps

1. **Get API Key** → Go to Google AI Studio
2. **Setup .env.local** → Add Gemini API Key
3. **Run Project** → `npm run dev`
4. **Test Features** → Try photo & voice
5. **Deploy** → Push to production

---

## 📞 Support

For issues or questions:
- Check console for error messages
- Verify API key is valid
- Test in Chrome/Edge browser
- Check network tab in DevTools

---

**Made with ❤️ for Smart Households**
