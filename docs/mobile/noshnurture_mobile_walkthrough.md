# 🎓 NoshNurture Mobile: Viva Preparation Guide

This guide explains the exact flow of the application, from startup to the AI-powered scanning feature.

---

## 1. The Entry Point: How the App Starts

**File:** `lib/main.dart`  
**What happens:** This is the heart of the application. It initializes everything before the first pixel is drawn.

### Key Logic in `main()` (Line 17-52):
- **Line 18:** `WidgetsFlutterBinding.ensureInitialized()` - Essential for any app that uses platform channels (like Camera or Supabase).
- **Line 20:** `Supabase.initialize(...)` - Connects the app to your database backend.
- **Line 28:** `MultiProvider` - This wraps the entire app in "State Management". It provides `AuthProvider` (login), `InventoryProvider` (pantry items), and `RecipeProvider` (AI recipes) to every screen.

### The Theme (Line 75-137):
If the sir asks: *"Where did you define the colors?"*, point here. 
- **Line 78:** `seedColor: const Color(0xFFE2725B)` - This is the "Terracotta" primary color.

---

## 2. Navigation: The Router

**File:** `lib/core/router/app_router.dart`  
**What happens:** This file decides which screen to show based on the URL/Route.

- **Line 26:** The `redirect` logic checks if a user is logged in. If `isAuthenticated` is false, it forces them to `/login`.
- **Line 46:** The `/` path loads `MainLayoutScreen` (defined in `main.dart`).

---

## 3. The Home Page (Dashboard)

**File:** `lib/features/dashboard/screens/dashboard_screen.dart`  
**What happens:** This is the default tab of `MainLayoutScreen`.

- **Line 105:** `recipeProvider.compareRecipesByMatch` - This sorts recipes based on how many ingredients you actually have in your inventory.
- **Line 182:** `GestureDetector(onTap: ...)` - When you click a recipe item, it uses `Navigator.push` to open `RecipeDetailScreen`.

---

## 4. Scanning Workflow (The "Cool" Part)

This is where most questions will come from. The flow is:  
`InventoryScreen` -> `ScannerScreen` -> `CameraAiScreen` -> `GeminiVisionService`.

### A. Triggering the Scan
**File:** `lib/features/inventory/screens/inventory_screen.dart`  
- **Line 137:** The `FloatingActionButton` (the '+' button) calls `context.push('/scanner')`.

### B. Choosing Method
**File:** `lib/features/scanner/screens/scanner_screen.dart`  
- **Line 74:** Clicking "Scan Product Label" opens `CameraAiScreen`.

### C. AI Processing Logic
**File:** `lib/features/scanner/screens/camera_ai_screen.dart`  
This file has 3 steps. If the sir asks: *"How does the camera identify the product?"*, explain this:

1.  **Step 1: Front Label Capture (`_captureFront`, Line 35):**
    - **Line 37:** Uses `ImagePicker` to take the photo.
    - **Line 47:** Uses **Google ML Kit** (`textRecognizer`) to extract text from the image locally (this is very fast).
    - **Line 57:** If text is found, it calls `GeminiVisionService.analyzeProductFromText`.
    - **Line 64:** If text fails, it sends the full image to the AI via `analyzeImage` (Multimodal fallback).

2.  **Step 2: Expiry Scan (`_captureExpiry`, Line 93):**
    - **Line 107:** It uses a Custom Regex (`_extractBestDate`, Line 120) to find patterns like `DD/MM/YYYY` or keywords like `EXP:` in the OCR text.

3.  **Step 3: Review & Add (`_addItem`, Line 184):**
    - **Line 198:** `provider.addItem(item)` - This saves the new item to the database through the `InventoryProvider`.

### D. The AI Service (The Backend Connection)
**File:** `lib/core/services/gemini_vision_service.dart`  
- **Line 31:** We use `Pollinations.ai` (an OpenAI-powered wrapper) for no-cost AI processing. 
- **Line 46-51:** We send a "System Prompt" telling the AI to act as a grocery expert and return **Strict JSON**.

---

## 💡 Pro-Tips for your Viva

1.  **What is a Provider?** It's a way to share data (like the list of food items) between different screens without passing it manually every time.
2.  **What is OCR?** Optical Character Recognition. We use Google ML Kit for this to read text on labels.
3.  **What is JSON?** Javascript Object Notation. It's the format the AI uses to send data back to the app (like `{"product_name": "Milk"}`).
4.  **Why use `Future` and `async/await`?** Because network calls (Supabase/AI) and camera actions take time. We don't want the app to freeze while waiting, so we run them "asynchronously".
