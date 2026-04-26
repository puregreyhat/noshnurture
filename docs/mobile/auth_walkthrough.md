# 🔐 Auth Features Walkthrough

**Location:** `lib/features/auth/screens/`

## 1. `LoginScreen` (`login_screen.dart`)
This handles user authentication.

### Key Logic
*   **State:** Uses `TextEditingController` for email and password. A `GlobalKey<FormState>` `_formKey` manages validation.
*   **`_handleLogin()`:**
    1. Triggers `_formKey.currentState?.validate()`.
    2. Calls `context.read<AuthProvider>().login(email, password)`.
    3. If successful, uses `context.go('/')` (go_router) to navigate home.
    4. If it fails, displays a `SnackBar` with the error message.
*   **UI Structure:**
    *   Uses a `Stack` to place decorative background circles behind the main form.
    *   Uses the `GlassCard` widget (a custom widget) to create a frosted glass effect over the gradient.
    *   **Google Login:** `context.read<AuthProvider>().signInWithGoogle()` connects to the backend OAuth flow.

## 2. `RegisterScreen` (`register_screen.dart`)
This handles new user sign-ups.

### Key Logic
*   **Additional Validation:** Contains logic to ensure `_passwordController.text == _confirmPasswordController.text`. If they don't match, it immediately shows a SnackBar and stops.
*   **`_handleRegister()`:** Calls `auth.register(name, email, password)`.
*   **Post-Registration:** Navigates to `/survey` on success instead of `/` directly (likely for onboarding).
*   **Security:** Uses `obscureText` boolean toggled by an `IconButton` to hide/show passwords.
