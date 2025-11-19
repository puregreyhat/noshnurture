# 🚀 Auto-Fetch v-it Orders - Quick Start

## What's New?
Settings page now has auto-fetch toggle to automatically import v-it orders into your inventory.

## How to Use

### Enable Auto-Fetch
1. Go to Settings (⚙️)
2. Toggle "Auto-Fetch v-it Orders" ON
3. Now orders from v-it appear automatically when you visit Scanner page

### Manual Sync
1. Go to Settings  
2. Click "Sync Now from v-it"
3. Items import immediately

## Requirements
- Use **same email** on both v-it and NoshNuture
- v-it needs `POST /api/orders/sync` endpoint
- NoshNuture needs `VKART_BASE_URL` environment variable

## v-it Setup (One Endpoint)
```javascript
// v-it: POST /api/orders/sync
export async function POST(req) {
  const { email, updated_since } = await req.json();
  
  // Return orders for this email
  return json({ orders: [...] });
}
```

## No Breaking Changes ✅
- QR scanning still works
- Manual import still works
- All existing features intact

## Status
✅ Ready to deploy
- Settings UI complete
- Auto-fetch logic implemented
- Database migration provided
- No changes to v-it database needed
