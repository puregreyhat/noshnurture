# 📷 Scanner Feature Walkthrough (Complete)

**Location:** `lib/features/scanner/screens/`

The scanner module provides three distinct ways to add items to the pantry.

## 1. `ScannerScreen` (The Menu)
This is a simple routing screen that presents the user with three options:
*   **Scan Product Label** -> Navigates to `CameraAiScreen`
*   **Scan Barcode** -> Navigates to `BarcodeScannerScreen`
*   **Manual Entry** -> Navigates to `ManualEntryScreen`

## 2. `CameraAiScreen` (AI OCR & Vision)
This is the most advanced addition method.
*   **Step 1:** Uses `ImagePicker` to take a photo. Extracts text using Google ML Kit. Sends text to `GeminiVisionService` (Pollinations API) to get JSON data (`product_name`).
*   **Step 2:** Captures a second photo of the expiry date. Uses ML Kit OCR + Regex (`_extractBestDate`) to parse dates like DD/MM/YYYY or keywords like "EXP".
*   **Step 3:** Review screen where the user can manually correct any AI mistakes before hitting "Add to Inventory".

## 3. `BarcodeScannerScreen` (Traditional Scanning)
*   **Camera Integration:** Uses the `mobile_scanner` package to detect barcodes in real-time.
*   **API Lookup (`_fetchProduct`):** Once a barcode is detected, it hits a public API (`https://world.openfoodfacts.org/api/v0/product/$code.json`) to find the product details.
*   **UI Flow:** Shows a `showModalBottomSheet` containing the product image, name, and brand. The user can then click "Add to Inventory", which creates an `InventoryItem` and pushes it via the `InventoryProvider`.

## 4. `ManualEntryScreen`
A fallback screen for items without barcodes or labels (like loose vegetables).
*   Standard Flutter Form with `TextFormField`s for Name, Quantity, Expiry Date, and Storage Type.
*   Uses `showDatePicker` for visual calendar selection of expiry dates.
