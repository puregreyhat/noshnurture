# ⚙️ Settings Feature Walkthrough

**Location:** `lib/features/settings/screens/settings_screen.dart`

This screen manages user preferences, notifications, and profile options.

## Key Logic & Components:

### 1. State Management (`SharedPreferences`)
*   **`_loadSettings()`:** Reads boolean and integer values directly from the device storage (e.g., `notif_email`, `notif_push`, `notif_hour`).
*   **`_saveSettings()`:** When a user toggles a switch, this function writes the new value back to `SharedPreferences`.

### 2. Cloud Sync (Supabase)
*   Inside `_saveSettings()`, it also syncs the preferences to the backend database using `Supabase.instance.client.from('user_preferences').upsert(...)`. This ensures that if the user logs in on another device, their settings are preserved.

### 3. Local Notifications Integration
*   If the user enables the daily reminder (`_dailyReminder` and `_enablePush`), the app calls `NotificationService().scheduleDailyExpiryNotification(...)`.
*   This passes the current `_notificationTime` (selected via `showTimePicker`) and the user's pantry items so the OS can schedule a background push notification.

### 4. UI Layout
*   Uses a `CustomScrollView` with a `SliverAppBar`.
*   The `SliverAppBar` contains the user's profile picture (initials) and email, fetched dynamically from `context.watch<AuthProvider>()`.
*   Groups settings into distinct cards using `_buildSectionTitle` and `_buildSettingCard`.

### 5. Easter Egg
*   Tapping the reminder toggle 5 times triggers `_handleReminderEasterEgg()`, which fires an immediate test notification via `NotificationService`. This is a fun detail to mention in a Viva!
