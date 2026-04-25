import 'dart:ui';

import 'package:flutter/material.dart';

class GlassBackground extends StatelessWidget {
  final Widget child;

  const GlassBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          color: const Color(0xFFFDFBF7), // Warm creamy off-white
        ),
        // Just one massive, extremely soft warm glow in the top right
        Positioned(
          top: -150,
          right: -100,
          child: _blurOrb(
            color: const Color(0xFFFDE6D5).withOpacity(0.5), // Soft peach glow
            size: 400,
          ),
        ),
        // And one at the bottom left
        Positioned(
          bottom: -100,
          left: -150,
          child: _blurOrb(
            color: const Color(0xFFF3ECE4).withOpacity(0.6), // Very subtle warm grey/sand
            size: 500,
          ),
        ),
        child,
      ],
    );
  }

  Widget _blurOrb({required Color color, required double size}) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              color.withOpacity(color.opacity * 0.8),
              color.withOpacity(0.0)
            ],
            stops: const [0.3, 1.0],
          ),
        ),
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final BorderRadiusGeometry borderRadius;
  final Color? tint;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.borderRadius = const BorderRadius.all(Radius.circular(20)),
    this.tint,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: borderRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: tint ?? Colors.white.withOpacity(0.4),
            borderRadius: borderRadius,
            border: Border.all(color: Colors.white.withOpacity(0.6), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFE2725B).withOpacity(0.06),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}
