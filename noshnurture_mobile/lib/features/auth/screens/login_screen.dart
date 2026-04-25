import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/widgets/glass.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  void _handleLogin() async {
    if (_formKey.currentState?.validate() ?? false) {
      final auth = context.read<AuthProvider>();
      final success = await auth.login(
        _emailController.text,
        _passwordController.text,
      );
      if (mounted) {
        if (success) {
          context.go('/');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(auth.error ?? 'Login failed'),
              backgroundColor: const Color(0xFFE2725B),
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFFFF8F1), // Warm Cream
              Color(0xFFFFE4D6), // Soft Peach
              Color(0xFFFFF1E6), // Shell
            ],
          ),
        ),
        child: Stack(
          children: [
            // Decorative elements
            Positioned(
              top: -50,
              right: -50,
              child: _buildDecorativeCircle(const Color(0xFFE2725B).withOpacity(0.1), 200),
            ),
            Positioned(
              bottom: 100,
              left: -80,
              child: _buildDecorativeCircle(const Color(0xFF6B8E23).withOpacity(0.08), 250),
            ),
            
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
                  child: Column(
                    children: [
                      // Logo Area
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFE2725B).withOpacity(0.15),
                              blurRadius: 30,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.eco_rounded,
                          size: 48,
                          color: Color(0xFFE2725B), // Terracotta
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'NoshNurture',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF3E2723), // Espresso
                          fontFamily: 'serif',
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Cultivating your healthy lifestyle',
                        style: TextStyle(
                          fontSize: 15,
                          color: Color(0xFF795548),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 48),
                      
                      // Login Card
                      GlassCard(
                        padding: const EdgeInsets.all(32),
                        borderRadius: BorderRadius.circular(40),
                        tint: Colors.white.withOpacity(0.6),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Text(
                                'Sign In',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF3E2723),
                                ),
                              ),
                              const SizedBox(height: 32),
                              
                              _buildInputField(
                                label: 'Email Address',
                                controller: _emailController,
                                hint: 'you@example.com',
                                icon: Icons.mail_outline_rounded,
                                validator: (val) => val == null || val.isEmpty ? 'Please enter email' : null,
                              ),
                              const SizedBox(height: 20),
                              _buildInputField(
                                label: 'Password',
                                controller: _passwordController,
                                hint: '••••••••',
                                icon: Icons.lock_outline_rounded,
                                isPassword: true,
                                obscureText: _obscurePassword,
                                toggleVisibility: () => setState(() => _obscurePassword = !_obscurePassword),
                                validator: (val) => val == null || val.isEmpty ? 'Please enter password' : null,
                              ),
                              
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () {},
                                  child: const Text(
                                    'Forgot Password?',
                                    style: TextStyle(
                                      color: Color(0xFFE2725B),
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              
                              _buildLoginButton(),
                              
                              const SizedBox(height: 24),
                              
                              Row(
                                children: [
                                  Expanded(child: Divider(color: const Color(0xFF3E2723).withOpacity(0.1))),
                                  const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 16),
                                    child: Text(
                                      'OR',
                                      style: TextStyle(
                                        color: Color(0xFF8D6E63),
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Expanded(child: Divider(color: const Color(0xFF3E2723).withOpacity(0.1))),
                                ],
                              ),
                              
                              const SizedBox(height: 24),
                              
                              _buildGoogleButton(),
                            ],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 32),
                      
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            "Don't have an account?",
                            style: TextStyle(color: Color(0xFF795548)),
                          ),
                          TextButton(
                            onPressed: () => context.go('/signup'),
                            child: const Text(
                              'Create One',
                              style: TextStyle(
                                color: Color(0xFFE2725B),
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDecorativeCircle(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? toggleVisibility,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: Color(0xFF5D4037),
          ),
        ),
        const SizedBox(height: 10),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          style: const TextStyle(color: Color(0xFF3E2723), fontSize: 16),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: const Color(0xFF3E2723).withOpacity(0.25)),
            prefixIcon: Icon(icon, color: const Color(0xFFE2725B).withOpacity(0.5), size: 22),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(
                      obscureText ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                      color: const Color(0xFFE2725B).withOpacity(0.5),
                      size: 20,
                    ),
                    onPressed: toggleVisibility,
                  )
                : null,
            filled: true,
            fillColor: Colors.white.withOpacity(0.5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: const BorderSide(color: Color(0xFFE2725B), width: 1.5),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          ),
          validator: validator,
        ),
      ],
    );
  }

  Widget _buildLoginButton() {
    final isLoading = context.watch<AuthProvider>().isLoading;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE2725B).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: isLoading ? null : _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFE2725B),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 18),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          elevation: 0,
        ),
        child: isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : const Text(
                'Sign In Now',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, letterSpacing: 0.5),
              ),
      ),
    );
  }

  Widget _buildGoogleButton() {
    return OutlinedButton.icon(
      onPressed: () => context.read<AuthProvider>().signInWithGoogle(),
      icon: Image.network(
        'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png', // Better URL
        height: 24,
        width: 24,
        errorBuilder: (context, error, stackTrace) => const Icon(Icons.g_mobiledata, size: 24),
      ),
      label: const Text(
        'Continue with Google',
        style: TextStyle(
          color: Color(0xFF3E2723),
          fontWeight: FontWeight.w600,
          fontSize: 15,
        ),
      ),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
        side: BorderSide(color: const Color(0xFF3E2723).withOpacity(0.1)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}
