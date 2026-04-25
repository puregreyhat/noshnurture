import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/widgets/glass.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _obscurePassword = true;

  void _handleRegister() async {
    if (_formKey.currentState?.validate() ?? false) {
      if (_passwordController.text != _confirmPasswordController.text) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(
          content: Text('Passwords do not match'),
          backgroundColor: Color(0xFFE2725B),
        ));
        return;
      }
      final auth = context.read<AuthProvider>();
      final success = await auth.register(
        _nameController.text,
        _emailController.text,
        _passwordController.text,
      );
      if (mounted) {
        if (success) {
          context.go('/survey');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(auth.error ?? 'Registration failed'),
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
              Color(0xFFFFF8F1),
              Color(0xFFFFE4D6),
              Color(0xFFFFF1E6),
            ],
          ),
        ),
        child: Stack(
          children: [
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
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFE2725B).withOpacity(0.1),
                              blurRadius: 20,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.eco_rounded,
                          size: 40,
                          color: Color(0xFFE2725B),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Join NoshNurture',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF3E2723),
                          fontFamily: 'serif',
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      GlassCard(
                        padding: const EdgeInsets.all(32),
                        borderRadius: BorderRadius.circular(40),
                        tint: Colors.white.withOpacity(0.6),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _buildInputField(
                                label: 'Full Name',
                                controller: _nameController,
                                hint: 'John Doe',
                                icon: Icons.person_outline_rounded,
                                validator: (val) => val == null || val.isEmpty ? 'Enter name' : null,
                              ),
                              const SizedBox(height: 20),
                              _buildInputField(
                                label: 'Email Address',
                                controller: _emailController,
                                hint: 'name@example.com',
                                icon: Icons.mail_outline_rounded,
                                validator: (val) => val == null || val.isEmpty ? 'Enter email' : null,
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
                                validator: (val) => val == null || val.isEmpty ? 'Enter password' : null,
                              ),
                              const SizedBox(height: 20),
                              _buildInputField(
                                label: 'Confirm Password',
                                controller: _confirmPasswordController,
                                hint: '••••••••',
                                icon: Icons.lock_reset_rounded,
                                isPassword: true,
                                obscureText: _obscurePassword,
                                toggleVisibility: () => setState(() => _obscurePassword = !_obscurePassword),
                                validator: (val) => val == null || val.isEmpty ? 'Confirm password' : null,
                              ),
                              const SizedBox(height: 40),
                              
                              _buildRegisterButton(),
                            ],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 24),
                      
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            "Already have an account?",
                            style: TextStyle(color: Color(0xFF795548)),
                          ),
                          TextButton(
                            onPressed: () => context.go('/login'),
                            child: const Text(
                              'Sign In',
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

  Widget _buildRegisterButton() {
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
        onPressed: isLoading ? null : _handleRegister,
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
                'Create Account',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, letterSpacing: 0.5),
              ),
      ),
    );
  }
}
