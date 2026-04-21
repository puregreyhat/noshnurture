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
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFF8FFF7), Color(0xFFEFFAF3), Color(0xFFF9F6EA)],
            ),
          ),
        ),
        Positioned(
          top: -90,
          right: -70,
          child: _blurOrb(
            color: const Color(0xFF34D399).withOpacity(0.22),
            size: 240,
          ),
        ),
        Positioned(
          bottom: -120,
          left: -60,
          child: _blurOrb(
            color: const Color(0xFF7DD3FC).withOpacity(0.2),
            size: 280,
          ),
        ),
        Positioned(
          top: 220,
          left: 120,
          child: _blurOrb(
            color: const Color(0xFFFBBF24).withOpacity(0.12),
            size: 170,
          ),
        ),
        child,
      ],
    );
  }

  Widget _blurOrb({required Color color, required double size}) {
    return IgnorePointer(
      child: ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
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
            color: tint ?? Colors.white.withOpacity(0.58),
            borderRadius: borderRadius,
            border: Border.all(color: Colors.white.withOpacity(0.55), width: 1),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withOpacity(0.08),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}
