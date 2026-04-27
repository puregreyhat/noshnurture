import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/survey/screens/survey_screen.dart';
import '../../features/admin/screens/admin_screen.dart';
import '../../features/scanner/screens/scanner_screen.dart';
import '../../main.dart';
import '../providers/auth_provider.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>(
  debugLabel: 'root',
);

class AppRouter {
  static GoRouter createRouter(AuthProvider authProvider) {
    return GoRouter(
      navigatorKey: _rootNavigatorKey,
      initialLocation: '/',
      refreshListenable: authProvider,
      redirect: (context, state) {
        final isAuthenticated = authProvider.isAuthenticated;
        final isAuthRoute =
            state.uri.toString() == '/login' ||
            state.uri.toString() == '/signup';

        if (!isAuthenticated && !isAuthRoute) {
          return '/login';
        }

        if (isAuthenticated && isAuthRoute) {
          return '/';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/signup',
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/',
          builder: (context, state) => const MainLayoutScreen(),
        ),
        GoRoute(
          path: '/survey',
          builder: (context, state) => const SurveyScreen(),
        ),
        GoRoute(
          path: '/admin',
          builder: (context, state) => const AdminScreen(),
        ),
        GoRoute(
          path: '/scanner',
          builder: (context, state) => const ScannerScreen(),
        ),
        GoRoute(
          path: '/telegram-callback',
          builder: (context, state) {
            // Force refresh preferences when returning from Telegram
            WidgetsBinding.instance.addPostFrameCallback((_) {
              authProvider.fetchUserPreferences();
            });
            return const MainLayoutScreen();
          },
        ),
      ],
    );
  }
}
