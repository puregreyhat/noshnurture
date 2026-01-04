# Quick Start: Add Items from Local Shops 🥬

## TL;DR

Go to `/scanner` → Click **"Paste QR Data"** → Copy-paste this template → Fill in your items → Click **"Process Manual Data"** → Click **"Save to My Inventory"**

## Template (Copy & Paste)

```json
[
  {
    "name": "Spinach",
    "barcode": "LOCAL-SPINACH-001",
    "quantity": 2,
    "unit": "kg",
    "category": "vegetables",
    "storage": "refrigerator",
    "expiry_days": 5
  }
]
```

## Fields Explained

| Field | Example | Options |
|-------|---------|---------|
| `name` | "Fresh Tomato" | Any product name |
| `barcode` | "LOCAL-TOMATO-001" | Any unique ID (use LOCAL- prefix) |
| `quantity` | 5 | Number you bought |
| `unit` | "kg" | kg, g, pcs, L, ml, loaf |
| `category` | "vegetables" | vegetables, fruits, dairy, atta, snacks, beverages, other |
| `storage` | "refrigerator" | refrigerator, pantry, counter, freezer |
| `expiry_days` | 7 | Days until it expires (estimate) |

## Add Multiple Items

```json
[
  { "name": "Spinach", "barcode": "LOCAL-SPINACH-001", "quantity": 2, "unit": "kg", "category": "vegetables", "storage": "refrigerator", "expiry_days": 5 },
  { "name": "Tomato", "barcode": "LOCAL-TOMATO-001", "quantity": 5, "unit": "kg", "category": "vegetables", "storage": "counter", "expiry_days": 7 },
  { "name": "Milk", "barcode": "LOCAL-MILK-001", "quantity": 1, "unit": "L", "category": "dairy", "storage": "refrigerator", "expiry_days": 2 }
]
```

## Common Expiry Times

- **Leafy Greens**: 3-5 days (refrigerator)
- **Tomatoes**: 5-7 days (counter)
- **Potatoes**: 14-30 days (pantry)
- **Carrots**: 10-14 days (refrigerator)
- **Milk**: 2-3 days (refrigerator)
- **Bread**: 3-5 days (counter)

## Troubleshooting

**"JSON parsing error"** → Check syntax at https://jsonlint.com

**"Item not found"** → Make sure all required fields are present and spelled correctly

**Need more help?** → See `LOCAL_SHOP_MANUAL_ENTRY.md`
