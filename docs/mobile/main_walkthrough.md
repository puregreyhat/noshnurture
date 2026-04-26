# 🏁 Main Entry Point & Setup Walkthrough

**File:** `lib/main.dart`

This is the most critical file for understanding how the app starts. If you get asked "where does the execution begin?", the answer is `void main()` in `lib/main.dart`.

## 1. `main()` Function
The `main()` function is the entry point.
*   **Line 18:** `WidgetsFlutterBinding.ensureInitialized();` is required because we are calling asynchronous code (`await`) before `runApp`. Flutter needs its engine to be fully initialized first to talk to native components (like the camera or shared preferences).
*   **Line 20-23:** `Supabase.initialize(...)` connects the app to the backend database. You need the `url` and `anonKey` to authenticate requests.
*   **Line 25:** `NotificationService().init();` starts the local push notification manager (likely for expiry warnings).

## 2. State Management (`MultiProvider`)
The app uses the `provider` package.
*   **`ChangeNotifierProvider` for `AuthProvider`:** Creates the global auth state.
*   **`ChangeNotifierProxyProvider`:** This is advanced! If they ask "How does inventory know which user is logged in?", point here. `InventoryProvider` depends on `AuthProvider`. When `auth` changes, it updates `inventory` by calling `inventory.setActiveUser(auth.userId)`.
*   Similarly, `RecipeProvider` depends on `InventoryProvider` so it can use your current pantry ingredients (`inventory.items`) to suggest recipes.

## 3. `NoshNurtureApp` & Theme
*   **`MaterialApp.router`:** We use `go_router` for navigation instead of standard Navigator. `_router` is generated using `AppRouter.createRouter(authProvider)` so that routes are protected by authentication.
*   **`ThemeData`:** The global UI design system is defined here. Colors (`0xFFE2725B` Terracotta), AppBar styles, Card styles (with opacity for glass effect), and Input fields are configured globally.

## 4. `MainLayoutScreen` (Bottom Navigation)
*   This is the wrapper for the core app once logged in.
*   It maintains a `_selectedIndex` state to switch between `DashboardScreen`, `InventoryScreen`, and `SettingsScreen` using a `NavigationBar`.
