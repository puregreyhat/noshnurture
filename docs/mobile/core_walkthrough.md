# ⚙️ Core Providers & Services Walkthrough

**Location:** `lib/core/`

This is the backend logic of the Flutter app.

## 1. `AuthProvider` (`lib/core/providers/auth_provider.dart`)
*   **What it does:** Manages login state globally.
*   **How it works:** Extends `ChangeNotifier`. Whenever `notifyListeners()` is called, any UI widget using `context.watch<AuthProvider>()` rebuilds automatically.
*   **Persistence:** Uses `SharedPreferences` to save the `auth_token`, `user_email`, etc., directly to the phone's storage so the user stays logged in after closing the app.
*   **API Calls:** Uses `http.post` to talk to the Supabase REST API `auth/v1/token` and `auth/v1/signup`.
*   **Realtime Listener:** `_setupSupabaseAuthListener` listens to external auth events (like Google OAuth returning to the app via Deep Links).

## 2. `InventoryProvider` (`lib/core/providers/inventory_provider.dart`)
*   **What it does:** Handles all CRUD (Create, Read, Update, Delete) operations for pantry items.
*   **API Connection:**
    *   Connects to Supabase REST endpoint (`rest/v1/inventory_items`).
    *   Crucially, requires the `Authorization: Bearer $authToken` header, which it retrieves from SharedPreferences. If this token is missing or expired, requests fail.
*   **`fetchInventory()`:** Appends query parameters to only fetch items for the current user (`user_id=eq.$userId`) and where `is_consumed=eq.false`.
*   **`addItem()`:** Sends a JSON payload to Supabase. Note how it generates a temporary `order_id` based on timestamps.

## 3. `GeminiVisionService` (`lib/core/services/gemini_vision_service.dart`)
*   **The "Secret":** Although named Gemini, the code actually uses `https://text.pollinations.ai/`, which is a free wrapper over OpenAI models.
*   **System Prompts:** Look at the JSON payload. We enforce strict JSON responses by setting `"jsonMode": true` and using system prompts like *"You are a grocery expert... Return JSON format: {\"is_produce\": false, \"product_name\": ...}"*
*   **Parsing:** `_parseJsonFromResult` extracts the JSON block from the AI's response string (in case the AI adds conversational text like "Here is your JSON:") using string manipulation (`indexOf('{')`).
