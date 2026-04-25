import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/inventory_provider.dart';
import 'core/providers/heynosh_provider.dart';
import 'core/providers/shopping_list_provider.dart';
import 'core/providers/recipe_provider.dart';
import 'core/router/app_router.dart';
import 'features/dashboard/screens/dashboard_screen.dart';
import 'features/heynosh/screens/heynosh_screen.dart';
import 'features/inventory/screens/inventory_screen.dart';
import 'features/shopping_list/screens/shopping_list_screen.dart';
import 'features/settings/screens/settings_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://baokvmahvfdsexpmasvz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhb2t2bWFodmZkc2V4cG1hc3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjAyMjksImV4cCI6MjA3NjYzNjIyOX0.1lipYYH9vxGOrCwNRdiCKe3IimuYqbfgj9TdIQVFKHI',
  );

  await NotificationService().init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, InventoryProvider>(
          create: (_) => InventoryProvider(),
          update: (_, auth, inventory) {
            final provider = inventory ?? InventoryProvider();
            provider.setActiveUser(auth.userId);
            return provider;
          },
        ),
        ChangeNotifierProvider(create: (_) => HeyNoshProvider()),
        ChangeNotifierProvider(create: (_) => ShoppingListProvider()),
        ChangeNotifierProxyProvider<InventoryProvider, RecipeProvider>(
          create: (_) => RecipeProvider(),
          update: (_, inventory, previous) {
            final provider = previous ?? RecipeProvider();
            provider.applyInventoryContext(inventory.items);
            return provider;
          },
        ),
      ],
      child: const NoshNurtureApp(),
    ),
  );
}

class NoshNurtureApp extends StatefulWidget {
  const NoshNurtureApp({super.key});

  @override
  State<NoshNurtureApp> createState() => _NoshNurtureAppState();
}

class _NoshNurtureAppState extends State<NoshNurtureApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    final authProvider = context.read<AuthProvider>();
    _router = AppRouter.createRouter(authProvider);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Nosh Nurture',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE2725B), // Terracotta
          brightness: Brightness.light,
          surface: const Color(0xFFFFF8F1), // Warm Cream
          onSurface: const Color(0xFF3E2723), // Espresso
        ),
        visualDensity: VisualDensity.adaptivePlatformDensity,
        scaffoldBackgroundColor: const Color(0xFFFFF8F1),
        appBarTheme: const AppBarTheme(
          centerTitle: false,
          elevation: 0,
          backgroundColor: Colors.transparent,
          foregroundColor: Color(0xFF3E2723),
          titleTextStyle: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF3E2723),
            fontFamily: 'serif',
          ),
        ),
        cardTheme: CardThemeData(
          color: Colors.white.withOpacity(0.9),
          elevation: 4,
          shadowColor: const Color(0xFFE2725B).withOpacity(0.1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: const Color(0xFFE2725B).withOpacity(0.2)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: const Color(0xFFE2725B).withOpacity(0.2)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: Color(0xFFE2725B), width: 1.8),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            elevation: 0,
            backgroundColor: const Color(0xFFE2725B),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainLayoutScreen extends StatefulWidget {
  const MainLayoutScreen({super.key});

  @override
  _MainLayoutScreenState createState() => _MainLayoutScreenState();
}

class _MainLayoutScreenState extends State<MainLayoutScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _screens = <Widget>[
    DashboardScreen(),
    InventoryScreen(),
    HeyNoshScreen(),
    ShoppingListScreen(),
    SettingsScreen(),
  ];

  static const List<String> _labels = <String>[
    'Home',
    'Inventory',
    'HeyNosh',
    'Cart',
    'Settings',
  ];

  static const List<IconData> _outinedIcons = <IconData>[
    Icons.dashboard_outlined,
    Icons.kitchen_outlined,
    Icons.mic_none_outlined,
    Icons.shopping_cart_outlined,
    Icons.settings_outlined,
  ];

  static const List<IconData> _filledIcons = <IconData>[
    Icons.dashboard_rounded,
    Icons.kitchen_rounded,
    Icons.mic_rounded,
    Icons.shopping_cart_rounded,
    Icons.settings_rounded,
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens.elementAt(_selectedIndex),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _onItemTapped,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        indicatorColor: const Color(0xFF16A34A).withOpacity(0.2),
        destinations: List.generate(
          _labels.length,
          (index) => NavigationDestination(
            icon: Icon(_outinedIcons[index], color: const Color(0xFF64748B)),
            selectedIcon: Icon(_filledIcons[index], color: const Color(0xFF166534)),
            label: _labels[index],
          ),
        ),
      ),
    );
  }
}

class PlaceholderScreen extends StatelessWidget {
  final String title;
  const PlaceholderScreen(this.title, {super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        title,
        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
      ),
    );
  }
}
