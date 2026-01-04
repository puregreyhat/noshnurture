# Local Shop Manual Entry Guide

## Overview

NoshNurture now supports adding items from local vegetable shops and markets without QR codes. This guide explains how to manually enter inventory items from local purchases.

## How to Add Local Shop Items

### Method: Use the Scanner with Manual QR Data Entry

While we don't have a dedicated form yet, you can add local shop items using our existing **Manual Entry** feature:

1. **Navigate to Scanner**
   - Go to `/scanner` on your NoshNurture dashboard
   - Click the **"Paste QR Data"** button (📋 icon)

2. **Create Manual Entry JSON**
   - Instead of scanning a real QR code, you'll create a JSON entry manually
   - Copy and paste the template below into the text area:

   ```json
   [
     {
       "name": "Spinach from Local Market",
       "barcode": "LOCAL-SPINACH-001",
       "quantity": 2,
       "unit": "kg",
       "category": "vegetables",
       "storage": "refrigerator",
       "expiry_days": 7
     }
   ]
   ```

3. **Fill in Your Product Details**
   - `name`: Product name (e.g., "Tomato", "Onion", "Local Mango")
   - `barcode`: Create any unique ID (e.g., "LOCAL-" + product name)
   - `quantity`: How much you bought (e.g., 2, 5, 10)
   - `unit`: kg, g, pcs, L, ml, loaf
   - `category`: vegetables, fruits, dairy, atta, snacks, beverages, other
   - `storage`: refrigerator, pantry, counter, freezer
   - `expiry_days`: Estimate how many days until it expires (usually 3-14 days)

4. **Submit**
   - Click "Process Manual Data"
   - The system will preview your items
   - Click "Save to My Inventory" to confirm

## Examples

### Vegetable from Local Market
```json
[
  {
    "name": "Fresh Okra from Market",
    "barcode": "LOCAL-OKRA-FARM-001",
    "quantity": 1,
    "unit": "kg",
    "category": "vegetables",
    "storage": "refrigerator",
    "expiry_days": 4
  }
]
```

### Bulk Potatoes from Local Seller
```json
[
  {
    "name": "Potatoes (Russet) - Local Farmer",
    "barcode": "LOCAL-POTATO-BULK-001",
    "quantity": 10,
    "unit": "kg",
    "category": "vegetables",
    "storage": "pantry",
    "expiry_days": 30
  }
]
```

### Seasonal Fruit
```json
[
  {
    "name": "Fresh Mangoes - Local Orchard",
    "barcode": "LOCAL-MANGO-SEASONAL-001",
    "quantity": 6,
    "unit": "pcs",
    "category": "fruits",
    "storage": "counter",
    "expiry_days": 8
  }
]
```

### Dairy from Local Dairy
```json
[
  {
    "name": "Fresh Cow Milk - Local Dairy",
    "barcode": "LOCAL-MILK-DAILY-001",
    "quantity": 1,
    "unit": "L",
    "category": "dairy",
    "storage": "refrigerator",
    "expiry_days": 3
  }
]
```

## Estimating Expiry Days

Here are typical shelf lives for common local shop items:

| Product | Storage | Days |
|---------|---------|------|
| Leafy Greens (Spinach, Kale) | Refrigerator | 3-5 |
| Tomatoes | Counter | 5-7 |
| Potatoes | Pantry | 14-30 |
| Onions | Pantry | 7-14 |
| Carrots | Refrigerator | 10-14 |
| Milk | Refrigerator | 2-3 |
| Paneer | Refrigerator | 5-7 |
| Bread | Counter/Pantry | 3-5 |
| Berries | Refrigerator | 2-4 |
| Mangoes | Counter → Refrigerator | 5-10 |

## Entry Points at a Glance

NoshNurture supports multiple ways to add items:

| Source | Method | Entry Point |
|--------|--------|-------------|
| **E-commerce QR** | Scan QR Code | Camera on Scanner |
| **E-commerce File** | Upload QR Images | File Upload on Scanner |
| **v-it Orders** | Auto Sync (via Settings) | Auto Fetch in Settings |
| **Local Shops** | Manual JSON Entry | Paste QR Data on Scanner |

## Troubleshooting

**Q: I get a JSON parsing error**
- Make sure your JSON is valid (no missing commas, proper brackets)
- Use a JSON validator: https://jsonlint.com

**Q: How do I add multiple items at once?**
- Add multiple objects to the array (separated by commas):
  ```json
  [
    { item1... },
    { item2... }
  ]
  ```

**Q: The system says item not found - what now?**
- Your JSON format might be incorrect
- Check that all required fields are present: name, barcode, quantity, unit, category, storage, expiry_days

**Q: Can I update expiry dates later?**
- Yes! Go to Inventory, find the item, and delete/re-add with corrected info

## Future Enhancement

We're planning a dedicated form interface for local shop entries with:
- Easy dropdowns for categories and storage types
- Date picker for expiry dates
- Item photos
- Faster entry without JSON

Stay tuned for these improvements!

## Related Features

- **Auto-Fetch**: Automatically import items from your v-it orders (Settings → Enable Auto-Fetch)
- **Dynamic Expiry**: Expiry dates update in real-time as days pass
- **Smart Suggestions**: Dashboard shows recipes based on your inventory

---

**Need help?** Check your browser console (F12) for any error messages and share them with us!
