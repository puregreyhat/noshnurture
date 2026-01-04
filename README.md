# 🍲 NoshNurture - Never Waste Food Again

> *Because throwing away tomatoes is a tragedy, and we're here to stop it with a smile.* 😄

---

## 🤔 First, A Riddle For You

**"I keep track of what you have to eat, I tell you which recipes are at your feet. I watch the calendar with careful eyes, and warn when your food will say goodbye. What am I?"**

*Answer: NoshNurture! Your digital kitchen guardian.* 👨‍🍳

---

## What's NoshNurture? (The Chill Version)

Ever opened your fridge and wondered:
- 🫠 "What was I supposed to do with these tomatoes?"
- 😰 "Is this still good or should I run?"
- 🤷 "How did I waste so much food last month?"

**Welcome to NoshNurture** — your quirky AI-powered food buddy that:
- 📸 Scans grocery receipts and auto-imports your orders
- 🗂️ Tracks everything in your pantry (with expiry dates!)
- 👨‍🍳 Suggests recipes based on what you actually have
- 🌍 Speaks 8 languages (because food is universal)
- 📊 Shows you how much food waste you've conquered
- 🔄 Syncs with your favorite grocery stores

Think of it as a **personal sous chef meets accountant meets translator** — minus the attitude. 😎

---

<div style="page-break-before: always;"></div>

## 🎯 The Big Ideas Behind NoshNurture

<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>What It Does</th>
      <th>The Joke</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>🤖 AI Label Scanner</strong></td>
      <td>OCR extracts product name & expiry from photos (front + back)</td>
      <td>We read product labels better than you squint at the fridge</td>
    </tr>
    <tr>
      <td><strong>🗣️ Voice Input</strong></td>
      <td>Add products by just speaking naturally (supports Hindi too!)</td>
      <td>Type-free inventory — because your hands are messy in the kitchen</td>
    </tr>
    <tr>
      <td><strong>Smart Scanner</strong></td>
      <td>Scan QR codes from receipts, auto-fills inventory</td>
      <td>We can remember barcodes better than you remember birthdays</td>
    </tr>
    <tr>
      <td><strong>🧠 Recipe Engine</strong></td>
      <td>AI-powered ingredient matching with confidence scoring</td>
      <td>We match ingredients better than dating apps match couples</td>
    </tr>
    <tr>
      <td><strong>🌍 AI Translation</strong></td>
      <td>8 languages with multiple AI backends (Google, LibreTranslate, Sarvam)</td>
      <td>Breaking language barriers, one recipe at a time</td>
    </tr>
    <tr>
      <td><strong>Multilingual Support</strong></td>
      <td>मराठी, તમિⁿ, తెలుగు, ಕನ್ನಡ, ગુજરાતી, বাংলা, हिंदी</td>
      <td>Every culture deserves to never waste food</td>
    </tr>
    <tr>
      <td><strong>Waste Tracking</strong></td>
      <td>"You saved 12kg of food waste last month!"</td>
      <td>That's 12kg of not crying over spilled... food</td>
    </tr>
    <tr>
      <td><strong>Edit Inventory</strong></td>
      <td>Change quantities, units, categories on the fly</td>
      <td>We let you be the boss (because you are)</td>
    </tr>
    <tr>
      <td><strong>Vkart Auto-Sync</strong></td>
      <td>Orders appear in inventory automatically</td>
      <td>Like magic, but actually just code</td>
    </tr>
    <tr>
      <td><strong>📧 Email Reminders</strong></td>
      <td>Daily emails when items are expiring (1, 3 days, or today)</td>
      <td>Your inbox becomes your food waste prevention tool</td>
    </tr>
    <tr>
      <td><strong>🛒 Shopping List</strong></td>
      <td>Auto-generate shopping lists from recipes or low-stock items</td>
      <td>Never forget to buy tomatoes again</td>
    </tr>
    <tr>
      <td><strong>🎤 Hey Nosh Assistant</strong></td>
      <td>Voice + text AI assistant for queries (expiry, recipes, inventory) with smart caching</td>
      <td>Talk to your food app like it's 2025 (or type if you're shy)</td>
    </tr>
  </tbody>
</table>

---

<div style="page-break-before: always;"></div>

## 🚀 Quick Start (For The Impatient)

### Prerequisites
- Node.js 18+ (we tested on 20, it's vibing)
- npm or yarn (we use npm)
- A Supabase account (it's free!)
- A sense of humor

### Installation

```bash
# Clone the repo
git clone https://github.com/puregreyhat/noshnurture.git
cd noshnurture

# Install dependencies
npm install

# Set up your .env.local file (see below)
cp .env.example .env.local

# Run the dev server
npm run dev

# Open your browser
# http://localhost:3000 ✨
```

### Environment Variables

Create a `.env.local` file with these vibes:

```env
# Supabase (the database that remembers your groceries)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Vkart Integration (auto-import your orders)
VKART_BASE_URL=https://v-it.netlify.app
VKART_API_KEY=your-optional-key
VKART_SYNC_WINDOW_HOURS=24  # Look back 24 hours for new orders

# Email Reminders (Resend API for expiry notifications)
RESEND_API_KEY=your-resend-api-key-here

# Cron Job Security
CRON_SECRET=your-random-secret-string-here

# Supabase Service Role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Translation (pick one - they're all free!)
# LIBRETRANSLATE_API_KEY=your-key (self-hosted or public)
# or SARVAM_AI_API_KEY=your-key (Indian language specialist)
# or GOOGLE_TRANSLATE_ENABLED=true (browser-based, no key needed)
```

---

<div style="page-break-before: always;"></div>

## 🎮 How to Use NoshNurture

### 1️⃣ **Scan Your Groceries**
```
Scanner Page → Point phone at receipt → Tap items → Save
💡 Or just type them manually if you're old school
```

### 2️⃣ **Auto-Sync Your Orders** (if using Vkart)
```
Settings → Enable "Auto-Fetch" → We'll do the rest
🤖 Orders appear in your inventory automatically (every 24h)
```

### 3️⃣ **Check Your Inventory**
```
Dashboard → See everything you have
⏱️ Items sorted by expiry (most urgent first)
✏️ Edit quantities, units, categories anytime
```

### 4️⃣ **Get Recipe Ideas**
```
Dashboard → Scroll to "Possible Recipes Now"
👨‍🍳 Sort by cuisine, filter by what's expiring soon
💾 Save recipes to come back later
```

### 5️⃣ **Track Your Impact**
```
Dashboard → Check the summary cards at the top
📊 See waste reduced, items tracked, what's expiring
🌱 Feel good about not throwing away food
```

### 6️⃣ **Use Shopping List** 🆕
```
Shopping List → Add items manually or from low stock
🛒 Auto-detect missing recipe ingredients
✅ Mark items as purchased when done
```

### 7️⃣ **Ask Hey Nosh** 🆕
```
Tap the purple mic button (bottom right)
🎤 Ask: "What's expiring soon?" or "What can I cook?"
⌨️ Or type your question (toggle with "Use Text" button)
🗣️ Get instant voice responses with TTS
💾 Smart caching makes repeated questions instant!
```

### 8️⃣ **Get Email Reminders** 🆕
```
Automatic daily emails at 7 AM IST
📧 Lists items expiring today, tomorrow, or in 3 days
💡 No setup needed - works automatically!
```

---

<div style="page-break-before: always;"></div>

## 🏗️ Tech Stack (For The Nerdy)

<table>
  <thead>
    <tr>
      <th>Layer</th>
      <th>Tech</th>
      <th>Why We Chose It</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Frontend</strong></td>
      <td>React + TypeScript</td>
      <td>Type safety ✨ + component vibes</td>
    </tr>
    <tr>
      <td><strong>Framework</strong></td>
      <td>Next.js 15 (App Router)</td>
      <td>Server components go brrrr</td>
    </tr>
    <tr>
      <td><strong>Database</strong></td>
      <td>Supabase (PostgreSQL + Auth)</td>
      <td>Real-time magic + open source</td>
    </tr>
    <tr>
      <td><strong>Styling</strong></td>
      <td>Tailwind CSS</td>
      <td>Utility-first beauty</td>
    </tr>
    <tr>
      <td><strong>Animation</strong></td>
      <td>Framer Motion</td>
      <td>Smooth like butter</td>
    </tr>
    <tr>
      <td><strong>Recipes</strong></td>
      <td>Internal Recipe Engine</td>
      <td>1000+ recipes, intelligently matched</td>
    </tr>
    <tr>
      <td><strong>AI Services</strong></td>
      <td>Google Gemini, LibreTranslate, Sarvam AI</td>
      <td>OCR, translation, language processing</td>
    </tr>
    <tr>
      <td><strong>Deployment</strong></td>
      <td>Vercel</td>
      <td>Where Next.js lives its best life</td>
    </tr>
  </tbody>
</table>

### API Routes (The Backend Magic)

```
POST /api/vkart-sync              → Fetch orders from Vkart (24h window)
GET  /api/recipes/suggestions     → Smart recipe matching with AI
POST /api/inventory/update        → Edit inventory items
POST /api/scanner/save            → Save scanned items
POST /api/gemini/extract-expiry   → OCR label scanning with AI
GET  /api/translate               → Multilingual translation service
```

---

## 🌟 Key Features Deep-Dive

### 📸 Receipt Scanner
- Scans QR codes instantly
- Auto-fills product name, quantity, expiry date
- Fallback expiry: 30 days (we're optimistic but cautious)
- Works offline-first (sync when ready)

### 🤖 Smart Recipe Matching
```typescript
// Our secret sauce ✨
Recipe is "makeable" if:
  ✅ All ingredients present OR
  ✅ Missing only common staples (salt, oil, water, sugar, pepper)
  
// Example:
Pasta Recipe: [flour, oil, salt, tomato, garlic]
You have: [flour, tomato, garlic]
Status: ✅ "You can make this!" (salt & oil assumed)
```

### 🌍 8-Language Support
```
English → मराठी → தமிழ் → తెలుగు → ಕನ್ನಡ → ગુજરાતી → বাংলা → हिंदी
```
Choose your language on any recipe page. We remember your choice! 🧠

### ⏱️ Smart Expiry Management
- Calculates "days until expiry" daily (fresh every morning!)
- Color-coded alerts (red = use today, yellow = use this week)
- Auto-updates consumed items to track waste

### 🔄 Vkart Auto-Sync
- Every 24 hours, we check for new orders
- Automatically adds items to your inventory
- Dedupes to prevent duplicate entries
- Runs quietly in the background (no user action needed)

---

## 🤖 AI-Powered Features

### 🧠 Smart Label Scanner with OCR
- **Multi-Step Image Processing**: Captures both front and label sides of product packages
- **Optical Character Recognition (OCR)**: Uses Google Gemini Vision AI to extract text from product images
- **Intelligent Data Extraction**: 
  - Product name from front packaging
  - Expiry/Manufacturing dates from label
  - Batch numbers (if available)
  - Confidence scoring for accuracy
- **Natural Language Processing**: Parses multiple date formats:
  - Standard formats: `DD-MM-YYYY`, `MM/DD/YYYY`
  - Relative dates: "today", "tomorrow", "day after tomorrow", "next month", "a year from now"
  - Month-based dates: "25 December 2025", "Jan 15 2026"
  - Indian date conventions support
- **Gallery & Camera Support**: Users can upload photos or capture with device camera
- **Fallback Handling**: Smart defaults when dates aren't detected

### 🎯 Intelligent Recipe Matching Engine
- **Ingredient Normalization**: Converts variations ("tomato" ↔ "टमाटर" ↔ "টমেটো") to canonical forms
- **Fuzzy Matching**: 
  - Substring matching with 60% length ratio threshold
  - Prevents false positives (e.g., "amchur powder" matching just "powder")
  - Handles ingredient variations ("paneer tikka" containing "paneer")
- **Smart Matching Logic**:
  - Exact matches for normalized ingredients
  - Staple ingredient defaults (salt, oil, water, sugar, pepper, ghee)
  - Confidence scoring for each recipe match
- **Recipe Sorting**: Ranks by ingredient availability percentage
- **Real-Time Filtering**: Instant recipe suggestions based on inventory

### 🗣️ Multilingual AI Translation
- **Supported Languages**: English, मराठी, தமிழ், తెలుగు, ಕನ್ನಡ, ગુજરાતી, বাংলা, हिंदी
- **Multiple Translation APIs**:
  - **Google Translate**: Browser-based (free, no key required)
  - **LibreTranslate**: Open-source self-hosted or public instances
  - **Sarvam AI**: Specialized for Indian languages with cultural context
- **Smart Language Detection**: Auto-detects user's preferred language
- **Persistent Preferences**: Remembers language choice across sessions
- **Recipe Content Translation**: Full recipe names, ingredients, and instructions
- **Context-Aware Translation**: Maintains food terminology accuracy

### 🎤 Voice & Text Input with Smart Parsing
- **Dual Input Modes**: 
  - 🎤 Voice recognition (speech-to-text)
  - ⌨️ Text input (type or paste queries)
  - Toggle between modes with "Use Text" / "Switch to Voice" button
- **Continuous Speech Recognition**: Multi-product batch input in single voice session
- **Natural Language Understanding**:
  - Extracts product name, quantity, unit, and expiry date from single utterance
  - Example: "Add 500 milliliters of milk expiring on 25th December"
  - Supports decimal quantities: "1.5 kg", "0.75 liters"
- **Unit Detection**:
  - Recognizes attached units: "1kg", "250grams", "2liters"
  - Supports separate unit words: "1 litre", "500 millilitres"
  - British & American spelling variants (litre/liter)
  - Automatic unit abbreviation (converts "kilogram" → "kg")
- **Smart Date Parsing**: 
  - Relative dates: "tomorrow", "next month", "a year from now"
  - Converts to DD-MM-YYYY format automatically
  - Handles month names in multiple languages
- **Quantity Normalization**: Converts text numbers ("one", "two") to digits
- **State Preservation**: Maintains data through multiple UI field transitions
- **Multi-Product Batch Processing**: Add multiple items without restarting voice input
- **Hindi Support**: Full voice input in Hindi with proper text conversion
- **Intelligent Caching**:
  - 1-hour TTL cache for repeated queries
  - Instant responses for cached questions
  - ~70-80% reduction in API calls for typical usage
  - Fallback keyword matching when API rate limits occur

### 📊 Predictive Waste Analytics
- **Expiry Tracking**: Monitors all items for approaching expiry dates
- **Waste Calculation**: Sums consumed/expired items to show waste reduced
- **Time-Window Analysis**: 30-day rolling window for recent impact
- **Statistical Reporting**: Dashboard statistics with trend data

### 🔐 AI-Safe Data Processing
- **Local Image Processing**: Sensitive image data handled securely
- **Encrypted API Calls**: Secure communication with AI services
- **User Privacy**: No image storage on servers (processed then discarded)
- **Fallback Options**: Multiple AI service options for redundancy
- **Smart Caching**: In-memory cache reduces API calls significantly
- **Graceful Degradation**: Keyword-based fallback when APIs are rate-limited or unavailable

---

<div style="page-break-before: always;"></div>

## 🎨 UI/UX Highlights

### Peaceful Aesthetics
- Soft green gradients (because food = growth)
- Glassmorphism cards (modern + readable)
- Smooth animations with Framer Motion
- Skeleton loaders while data loads

### Responsive Design
- **Mobile**: 1 column, touch-friendly
- **Tablet**: 2 columns, balanced
- **Desktop**: 3 columns, full power

### Dynamic Stats (Homepage)
- **Inventory Count**: Live from Supabase
- **Recipes Available**: Smart matching
- **Waste Reduced**: Sum of consumed items (30-day window)

---

## 🧪 Testing & Debugging

### Quick TypeScript Check
```bash
npm run typecheck
# or
npx tsc --noEmit
```

### Development Server Logs
```bash
npm run dev
# Watch for:
# ✓ Compiled /dashboard
# ✓ Compiled /api/recipes/suggestions
# [Recipes API] Found X inventory items
```

### Common Issues & Fixes

**Q: "Failed to fetch" error on dashboard?**
- A: Check your Supabase URL/key in `.env.local`
- Try: Hard refresh (Cmd+Shift+R on Mac)

**Q: Recipe suggestions are empty?**
- A: Make sure you have items in inventory
- Check: Server is running and the recipe engine is accessible

**Q: Auto-sync not working?**
- A: Enable it in Settings → "Auto-Fetch Orders"
- Check: Your email matches your Vkart account

---

## 📊 Dashboard at a Glance

```
┌─────────────────────────────────────────┐
│  🍽️ Food Tracked  │  🔔 Expiring Soon  │  📊 Waste Reduced  │
│       9 items     │      2 items       │     12 kg saved    │
└─────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Food Inventory Snapshot                   │
│  ┌──────────────────────────────────────┐  │
│  │ Tomato (5) - expires in 3 days       │  │
│  │ Potato (8) - expires in 7 days       │  │
│  │ Curd (2) - expires in 1 day! ⚠️      │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Possible Recipes Now (6 Available)        │
│  ┌──────────┐  ┌──────────┐               │
│  │ Pasta    │  │ Curry    │               │
│  │ 8/9 ings │  │ 7/8 ings │  ...more     │
│  └──────────┘  └──────────┘               │
└────────────────────────────────────────────┘
```

---

## 🎓 Riddle Time! (More Fun)

**Riddle 1:** "I grow smaller every day, yet I help you decide what to play. I can be 30 days or more, but soon I'll show you my final door. What am I?"
- **Answer:** Expiry date! ⏳

**Riddle 2:** "I suggest what you should eat, bringing ingredients and recipes to meet. The more items you find, the more options I'll bind. What am I?"
- **Answer:** The recipe engine! 👨‍🍳

**Riddle 3:** "I remember your language, even after you leave. In 24 hours I sync with merchants, without you needing to perceive. What am I?"
- **Answer:** Your browser's localStorage + our auto-sync! 🤝

---

## 😂 Jokes Only NoshNurture Users Get

1. **Why did the tomato turn red?**
   - Because it saw the expiry date in NoshNurture! 🍅

2. **What's a programmer's favorite food?**
   - Byte salad! But NoshNurture helps them make better ones. 💾

3. **Why don't recipes ever get lonely?**
   - Because they're always paired with ingredients in NoshNurture! 👫

4. **What do you call food that's been in the fridge too long?**
   - A statistical anomaly in NoshNurture households! 📉

---

<div style="page-break-before: always;"></div>

## 📝 Database Schema

### Key Tables
- **inventory_items** — Your groceries + expiry dates
- **users** — Account info + preferences
- **vkart_sync** — Track when orders were synced
- **saved_recipes** — Bookmarked recipes (optional feature)

### Key Columns
```typescript
inventory_items: {
  id: UUID (primary key)
  user_id: UUID (foreign key to auth.users)
  product_name: string
  quantity: number
  unit: string (kg, pcs, ml, etc.)
  expiry_date: date
  days_until_expiry: number (computed daily)
  is_consumed: boolean (track waste)
  category: string (produce, dairy, etc.)
  tags: string[] (includes "canonical:tomato" for matching)
  created_at, updated_at: timestamps
}
```

---

## 🚀 Deployment

### Deploy on Vercel (Recommended)
```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys! ✨
# Set environment variables in Vercel dashboard
# Your app is live: https://your-project.vercel.app
```

### Deploy on Other Platforms
Works with any Node.js hosting (Netlify, Railway, Render, etc.)

```bash
npm run build
npm start
```

---

<div style="page-break-before: always;"></div>

## 🤝 Contributing

Got ideas to make NoshNurture even cooler? We love it!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-idea`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-idea`)
5. Open a Pull Request

**Areas we're always excited about:**
- 🌍 More language support
- 📈 Better recipe matching
- 🎨 UI/UX improvements
- 🧪 More tests
- 📱 Mobile app version
- 🤖 AI-powered features (meal planning, nutrition tracking)

---

## 📞 Need Help?

- 📧 Email: support@noshnurture.dev
- 🐛 Found a bug? Open an issue on GitHub
- 💡 Have an idea? Start a discussion
- 🎥 Check out our docs folder for detailed guides

---

## 📜 License

MIT License — Use it, modify it, make it your own! 🎉

---

<div style="page-break-before: always;"></div>

## 🙏 Thanks & Credits

- **Our Recipe Engine** — Intelligent recipe matching at its best
- **Supabase** — Real-time database magic
- **Next.js & Vercel** — Best framework ever
- **Our users** — For not throwing away food anymore 🌱

---

## 🎊 Final Thoughts

NoshNurture isn't just an app — it's a **movement against food waste**. Every recipe suggested, every item tracked, every tomato saved is a win. 

So go ahead, scan those groceries, get creative in the kitchen, and help save the planet one meal at a time. 🌍❤️

Because honestly? **The best recipe is the one you actually make with what you have.** 👨‍🍳

---

## One More Riddle For The Road

**"I help you remember, I watch you cook, I suggest recipes from every book. I speak your language, track your waste, and never let good food go to waste. You've been using me this whole time — so what am I?"**

*Answer: NoshNurture! And thanks for sticking with us through this README. You're awesome!* 😄✨

---

**Happy cooking! 🍳** 
*Made with ❤️ by the NoshNurture team*

---

## Quick Links

- 🏠 [Homepage](/)
- 📚 [Documentation](./docs)
- 🐛 [Issue Tracker](https://github.com/puregreyhat/noshnurture/issues)
- ⭐ [Give us a star on GitHub](https://github.com/puregreyhat/noshnurture)

---

*Last updated: November 2025 | Keep cooking, keep saving, keep smiling!* 😊
