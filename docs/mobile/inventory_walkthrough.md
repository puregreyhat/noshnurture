# 📦 Inventory & Scanner Walkthrough

**Location:** `lib/features/inventory/screens/` & `lib/features/scanner/screens/`

## 1. `InventoryScreen`
This screen manages your pantry.

*   **Initialization:** In `initState`, it calls `context.read<InventoryProvider>().fetchInventory()` to load data immediately.
*   **Filtering & Searching:**
    *   Maintains `_searchQuery` and `_filterStatus` state.
    *   The `filteredItems` list dynamically rebuilds by checking `item.name.toLowerCase().contains(_searchQuery)` and comparing `_effectiveStatus(item)` against the dropdown filter.
*   **Expiry Logic (`_effectiveStatus` & `_daysUntilExpiry`):**
    *   Calculates the difference between `DateTime.now()` and `item.expiryDate` in days.
    *   Returns 'expired' if < 0, 'expiring' if <= 3 days, else 'fresh'. This powers the color-coded UI badges.
*   **Interactions:** Long-pressing an item triggers `_showItemOptions` (Bottom Sheet) to Edit or Delete items via the Provider.
*   **FAB:** The Floating Action Button pushes to the `/scanner` route.

## 2. `ScannerScreen`
A simple menu offering three ways to add products: AI Camera, Barcode, or Manual Entry.

## 3. `CameraAiScreen` (The "Wow" Factor)
If asked about AI or scanning, this is the file.

### Step 1: Front Capture (`_captureFront`)
1. Uses `ImagePicker` to access the device camera.
2. Uses Google ML Kit (`TextRecognizer`) to process the image locally and extract text. This is extremely fast and free.
3. If text is extracted, it sends the text to `GeminiVisionService.analyzeProductFromText`.
4. If it fails, it falls back to sending the entire image `GeminiVisionService.analyzeImage`.

### Step 2: Expiry Capture (`_captureExpiry`)
1. Takes a photo of the back label.
2. Runs ML Kit OCR.
3. Uses a complex Regular Expression (`_extractBestDate`) to find date formats (DD/MM/YYYY) or keywords like "EXP" and "Use By" in the raw text block to find the expiry date automatically.

### Step 3: Review & Add (`_addItem`)
Creates an `InventoryItem` model with the parsed data and calls `provider.addItem(item)` to sync it to the cloud.
