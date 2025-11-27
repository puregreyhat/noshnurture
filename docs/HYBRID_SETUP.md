# 🍳 NoshNurture - Hybrid Recipe Suggestions Setup

## What You Get

Your app now has **3 layers of intelligence**:

1. **Template Engine** (instant, always works, $0)
   - 10 diverse recipe templates that generate unlimited variations
   - Prioritizes expiring items automatically
   - No API calls, fully offline

2. **Spoonacular API** (optional, free tier: 150 requests/day)
   - 350k+ real recipes from verified sources
   - Triggered via "Discover More Recipes" button
   - Cached for 24h to stay under free limits

3. **Hugging Face AI** (optional, experimental)
   - Modern T5 transformer for recipe generation
   - Currently a stub; can be wired for creative enhancements
   - Free tier: ~30k chars/month

## Quick Setup (2 minutes)

### Step 1: Create `.env.local` file

```bash
cd /Users/akash/Desktop/noshnuture-main
cp .env.local.example .env.local
```

### Step 2: Add your Supabase keys (already have these)

Open `.env.local` and add your existing Supabase credentials.

### Step 3: (Optional) Get Spoonacular API key

1. Go to: https://spoonacular.com/food-api/console#Dashboard
2. Sign up (free, no credit card)
3. Copy your API key
4. Add to `.env.local`:
   ```
   SPOONACULAR_API_KEY=your_key_here
   ```

**Free tier limits:**
- 150 requests/day
- Our caching keeps you well under this (1 request = 24h cache)

### Step 4: (Optional) Get Hugging Face token

1. Go to: https://huggingface.co/settings/tokens
2. Create a new token (read access)
3. Add to `.env.local`:
   ```
   HUGGINGFACE_API_TOKEN=your_token_here
   ```

## How It Works

### Without any API keys:
- ✅ Template suggestions work perfectly
- ✅ Ingredient normalization works
- ✅ All core features functional
- ❌ "Discover More" button shows no Spoonacular results

### With Spoonacular key:
- ✅ Everything above +
- ✅ "Discover More" fetches real recipes
- ✅ Blended with templates for variety
- ✅ Smart caching prevents quota burnout

### With HF token (future):
- Will enable AI-enhanced recipe generation
- Currently a stub; easy to wire later

## Testing

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Add items with expiry dates to your inventory

3. Go to Dashboard → Recipe Suggestions

4. Click "🔍 Discover More Recipes" to see Spoonacular results mixed in

## API Usage Monitoring

- **Spoonacular**: Check your dashboard at https://spoonacular.com/food-api/console#Dashboard
- Our 24h cache means: ~5-10 requests/day typical usage (well under 150 limit)

## No Keys? No Problem!

The app works perfectly without any API keys:
- Template engine generates unlimited recipes
- Smart scoring by expiry urgency
- All features except "Discover More" external results

## What's Next

Want to add more?
- **Recipe details page**: Click "Cook Now" → see full instructions
- **Save favorites**: Bookmark recipes to revisit
- **Meal planner**: Drag recipes to calendar
- **Shopping list**: Generate from selected recipes

Let me know what you'd like next!
