import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _userName;
  String? _userEmail;
  String? _userId;
  String? _error;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  String? get userId => _userId;
  String? get error => _error;

  late final String _authUrl;
  late final String _anonKey;

  AuthProvider() {
    _authUrl = '${dotenv.env['SUPABASE_URL']}/auth/v1';
    _anonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';
    _checkInitialAuth();
    _setupSupabaseAuthListener();
  }

  void _setupSupabaseAuthListener() {
    Supabase.instance.client.auth.onAuthStateChange.listen((data) async {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;

      if (event == AuthChangeEvent.signedIn && session != null) {
        final user = session.user;
        final userId = user.id;
        final userName =
            user.userMetadata?['name'] ??
            user.userMetadata?['full_name'] ??
            user.email?.split('@')[0] ??
            'User';
        final email = user.email ?? '';

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', session.accessToken);
        await prefs.setString('user_email', email);
        await prefs.setString('user_name', userName);
        await prefs.setString('user_id', userId);

        _isAuthenticated = true;
        _userEmail = email;
        _userName = userName;
        _userId = userId;

        _isLoading = false;
        notifyListeners();
      }
    });
  }

  Future<void> _checkInitialAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');

    if (token == 'mock_jwt_token_12345' ||
        token == 'temp_token_waiting_verification') {
      await logout();
      return;
    }

    if (token != null) {
      _isAuthenticated = true;
      _userEmail = prefs.getString('user_email');
      _userName = prefs.getString('user_name');
      _userId = prefs.getString('user_id');
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_authUrl/token?grant_type=password'),
        headers: {'apikey': _anonKey, 'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final token = data['access_token'];
        final user = data['user'];
        final userId = user['id'];
        final userName = user['user_metadata']?['name'] ?? email.split('@')[0];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        await prefs.setString('user_email', email);
        await prefs.setString('user_name', userName);
        await prefs.setString('user_id', userId);

        _isAuthenticated = true;
        _userEmail = email;
        _userName = userName;
        _userId = userId;

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        final errorData = json.decode(response.body);
        _error =
            errorData['error_description'] ??
            errorData['msg'] ??
            'Login failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Network error: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_authUrl/signup'),
        headers: {'apikey': _anonKey, 'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
          'data': {'name': name},
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final token = data['access_token'] ?? '';
        final user = data['user'] ?? data;
        final userId = user['id'];

        final prefs = await SharedPreferences.getInstance();
        if (token.isNotEmpty) {
          await prefs.setString('auth_token', token);
          _isAuthenticated = true;
        } else {
          await prefs.setString(
            'auth_token',
            'temp_token_waiting_verification',
          );
          _isAuthenticated = true;
        }
        await prefs.setString('user_email', email);
        await prefs.setString('user_name', name);
        await prefs.setString('user_id', userId);

        _userEmail = email;
        _userName = name;
        _userId = userId;

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        final errorData = json.decode(response.body);
        _error =
            errorData['error_description'] ??
            errorData['msg'] ??
            'Registration failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Network error: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> signInWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'io.supabase.nosh://login-callback',
      );
      // We don't set _isLoading to false here because the redirect opens an external browser.
      // When the app resumes, the _setupSupabaseAuthListener will trigger and complete the login.
    } catch (e) {
      _error = 'Google Sign In failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_email');
    await prefs.remove('user_name');
    await prefs.remove('user_id');

    _isAuthenticated = false;
    _userEmail = null;
    _userName = null;
    _userId = null;

    notifyListeners();
  }
}
