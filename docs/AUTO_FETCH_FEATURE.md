# Auto-Fetch v-it Orders Feature

## Overview
This document describes the auto-fetch feature that allows automatic import of v-it orders into NoshNuture inventory when users place orders with the same email address.

## Key Features

### 1. **Auto-Fetch Toggle (Settings Page)**
- Users can enable/disable automatic order imports from v-it
- Setting persists to browser localStorage
- Visual toggle switch with status message

### 2. **Manual Sync Button**
- "Sync Now" button in Settings for on-demand imports
- Shows real-time status (Syncing, Success, Error)
- Displays import count (e.g., "✓ Imported 3, Updated 1 items")

### 3. **Dynamic Expiry Dates**
- Days until expiry recalculated daily based on current date
- Fixes stale expiry information (issue where dates didn't update next day)
- Applied to Inventory, Dashboard, and Expiry Alert components

## Implementation Files

### Modified Files
- `src/app/settings/page.tsx` - Enhanced UI with auto-fetch controls
- `src/components/pages/Dashboard.tsx` - Dynamic expiry calculation
- `src/app/inventory/page.tsx` - Dynamic expiry calculation  
- `src/components/ExpiryAlert.tsx` - Dynamic expiry calculation

### New Database Migration
- `database-migration-auto-fetch.sql` - vkart_sync table with RLS policies

## Setup Requirements

### 1. Supabase Database
Run the migration to create tracking table:
```sql
-- See: database-migration-auto-fetch.sql
```

### 2. v-it API Endpoint
v-it must provide: `POST /api/orders/sync`
```
Request: { email: "user@gmail.com", updated_since?: "2025-11-08T..." }
Response: { orders: [...] }
```

### 3. Environment Variables
```
VKART_BASE_URL=https://v-it.netlify.app
VKART_API_KEY=optional-key-if-needed
```

## How It Works

### Auto-Fetch Flow
1. User enables toggle in Settings
2. When user visits Scanner page, auto-fetch triggers
3. Fetches orders from v-it by authenticated user's email
4. Parses and saves to Supabase inventory_items table
5. Items appear in Inventory tab

### Manual Sync Flow
1. User clicks "Sync Now" in Settings
2. Same as auto-fetch, but user-initiated
3. Works anytime, doesn't require auto-fetch to be enabled

## v-it.netlify.app Requirements

### What v-it Needs to Provide
- **Endpoint**: `POST /api/orders/sync`
- **Accept**: `{ email, updated_since? }`  
- **Return**: `{ orders: [...] }`

### What v-it Does NOT Need to Change
- ✅ No authentication changes
- ✅ No new database tables
- ✅ No webhooks or real-time sync
- ✅ No email verification

## Testing

### Manual Test
1. Go to Settings (`/settings`)
2. Find "Auto-Fetch v-it Orders" section
3. Toggle ON
4. Click "Sync Now"
5. Check Inventory for imported items

### Auto-Test
1. Go to Scanner page (`/scanner`)
2. With auto-fetch ON, should import automatically
3. Check browser console for sync messages

## Notes

- Users must use **same email** on both v-it and NoshNuture
- Setting persists to localStorage across sessions
- No background tasks or polling (user-initiated only)
- Smart duplicate detection prevents re-importing orders
