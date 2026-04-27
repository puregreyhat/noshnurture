import 'dart:math' as math;

import 'package:flutter/material.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final TextEditingController _codeController = TextEditingController();
  bool _isAuthorized = false;
  String? _error;

  static const String _adminCode = 'nosh_admin_2025';

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  void _handleLogin() {
    if (_codeController.text == _adminCode) {
      setState(() {
        _isAuthorized = true;
        _error = null;
      });
      return;
    }

    setState(() {
      _error = 'Invalid admin code';
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAuthorized) {
      return _buildLoginScreen();
    }

    return _buildDashboardScreen();
  }

  Widget _buildLoginScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F3EA),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Container(
              padding: const EdgeInsets.all(32.0),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 28,
                    offset: const Offset(0, 16),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Admin Access',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Open the analytics board and review the 10 graph views.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                  ),
                  const SizedBox(height: 28),
                  TextField(
                    controller: _codeController,
                    obscureText: true,
                    decoration: InputDecoration(
                      hintText: 'Enter admin code',
                      errorText: _error,
                      filled: true,
                      fillColor: const Color(0xFFF7F7F7),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide(
                          color: Colors.green.shade500,
                          width: 1.4,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _handleLogin,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade600,
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    child: const Text(
                      'Access Dashboard',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Back to App',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDashboardScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F3EA),
      appBar: AppBar(
        title: const Text(
          'Admin Analytics Hub',
          style: TextStyle(
            color: Color(0xFF111827),
            fontWeight: FontWeight.w800,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Color(0xFF111827)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.red),
            onPressed: () => setState(() => _isAuthorized = false),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeroPanel(),
            const SizedBox(height: 16),
            _buildStatGrid(),
            const SizedBox(height: 24),
            _buildGraphSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroPanel() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF111827), Color(0xFF1F2937), Color(0xFF3B2F2F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 30,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Survey, usage, and engagement in one board',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Each graph below maps to a different admin question: growth, feature demand, language mix, response health, and more.',
            style: TextStyle(
              color: Colors.white.withOpacity(0.8),
              fontSize: 14,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: const [
              _StatusChip(label: 'Live survey data'),
              _StatusChip(label: '10 chart views'),
              _StatusChip(label: 'Admin only'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.25,
      children: const [
        _StatCard(
          title: 'Total Responses',
          value: '1,245',
          icon: Icons.assignment_turned_in_rounded,
          color: Colors.blue,
        ),
        _StatCard(
          title: 'Avg Household Size',
          value: '2.4',
          icon: Icons.people_alt_rounded,
          color: Colors.green,
        ),
        _StatCard(
          title: 'Expiry Awareness',
          value: '3.1/4',
          icon: Icons.warning_amber_rounded,
          color: Colors.orange,
        ),
        _StatCard(
          title: 'Cooking Stress',
          value: '2.8/4',
          icon: Icons.restaurant_rounded,
          color: Colors.purple,
        ),
      ],
    );
  }

  Widget _buildGraphSection() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 900;
        final cardWidth = isWide
            ? (constraints.maxWidth - 16) / 2
            : constraints.maxWidth;

        final charts = <Widget>[
          SizedBox(
            width: cardWidth,
            height: 300,
            child: _ChartCard(
              title: 'Weekly response trend',
              subtitle:
                  'Line chart for completed surveys over the last 7 days.',
              child: _LineTrendChart(
                labels: const ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                values: const [42, 58, 65, 72, 91, 104, 118],
                lineColor: const Color(0xFF16A34A),
                fillColor: const Color(0xFF16A34A).withOpacity(0.18),
              ),
            ),
          ),
          SizedBox(
            width: cardWidth,
            height: 300,
            child: _ChartCard(
              title: 'Feature demand split',
              subtitle: 'Vertical bars for the most requested admin features.',
              child: _VerticalBarChart(
                labels: const [
                  'Expiry alerts',
                  'Shopping list',
                  'Voice assistant',
                  'Multilingual',
                  'Family mode',
                ],
                values: const [92, 78, 65, 42, 54],
                color: const Color(0xFF3B82F6),
              ),
            ),
          ),
          SizedBox(
            width: cardWidth,
            height: 300,
            child: _ChartCard(
              title: 'Top pain points',
              subtitle: 'Horizontal bars for issues reported most often.',
              child: _HorizontalBarChart(
                labels: const [
                  'Forgot expiry dates',
                  'Duplicate items',
                  'Hard to search',
                  'Too many taps',
                  'Language friction',
                ],
                values: const [91, 74, 63, 58, 44],
                color: const Color(0xFFF59E0B),
              ),
            ),
          ),
          SizedBox(
            width: cardWidth,
            height: 300,
            child: _ChartCard(
              title: 'Response channel mix',
              subtitle: 'Stacked bars show how users respond across channels.',
              child: _StackedBarChart(
                groups: const [
                  _StackedGroup(label: 'W1', values: [16, 8, 5]),
                  _StackedGroup(label: 'W2', values: [20, 10, 7]),
                  _StackedGroup(label: 'W3', values: [26, 12, 8]),
                  _StackedGroup(label: 'W4', values: [30, 14, 11]),
                ],
                seriesLabels: const ['App', 'Voice', 'Web'],
                seriesColors: const [
                  Color(0xFF14B8A6),
                  Color(0xFF8B5CF6),
                  Color(0xFFEC4899),
                ],
              ),
            ),
          ),
          SizedBox(
            width: cardWidth,
            height: 300,
            child: _ChartCard(
              title: 'Issue category share',
              subtitle: 'Pie chart for the distribution of support categories.',
              child: _PieDonutChart(
                sections: const [
                  _CircularSection(
                    label: 'Pantry',
                    value: 30,
                    color: Color(0xFFEF4444),
                  ),
                  _CircularSection(
                    label: 'Recipes',
                    value: 24,
                    color: Color(0xFFF59E0B),
                  ),
                  _CircularSection(
                    label: 'Scanner',
                    value: 20,
                    color: Color(0xFF3B82F6),
                  ),
                  _CircularSection(
                    label: 'Voice',
                    value: 15,
                    color: Color(0xFF10B981),
                  ),
                  _CircularSection(
                    label: 'Profile',
                    value: 11,
                    color: Color(0xFF8B5CF6),
                  ),
                ],
                holeRatio: 0.0,
              ),
            ),
          ),
          SizedBox(
            width: cardWidth,
            height: 300,
            child: _ChartCard(
              title: 'Language adoption',
              subtitle:
                  'Donut chart highlighting the language mix across users.',
              child: _PieDonutChart(
                sections: const [
                  _CircularSection(
                    label: 'English',
                    value: 52,
                    color: Color(0xFF0EA5E9),
                  ),
                  _CircularSection(
                    label: 'Spanish',
                    value: 21,
                    color: Color(0xFF22C55E),
                  ),
                  _CircularSection(
                    label: 'Hindi',
                    value: 14,
                    color: Color(0xFFF97316),
                  ),
                  _CircularSection(
                    label: 'Other',
                    value: 13,
                    color: Color(0xFF64748B),
                  ),
                ],
                holeRatio: 0.58,
              ),
            ),
          ),
          SizedBox(
            width: cardWidth,
            height: 320,
            child: _ChartCard(
              title: 'Satisfaction radar',
              subtitle:
                  'Radar chart for the strongest and weakest product dimensions.',
              child: _RadarChart(
                labels: const [
                  'Speed',
                  'Clarity',
                  'Trust',
                  'Personalization',
                  'Accessibility',
                  'Delight',
                ],
                values: const [0.84, 0.71, 0.88, 0.67, 0.74, 0.59],
                color: const Color(0xFF7C3AED),
              ),
            ),
          ),
          SizedBox(
            width: cardWidth,
            height: 300,
            child: _ChartCard(
              title: 'Engagement curve',
              subtitle:
                  'Area chart for cumulative session activity through the week.',
              child: _LineTrendChart(
                labels: const ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
                values: const [20, 28, 35, 41, 52, 63, 74],
                lineColor: const Color(0xFFEA580C),
                fillColor: const Color(0xFFEA580C).withOpacity(0.22),
                showArea: true,
              ),
            ),
          ),
          SizedBox(
            width: cardWidth,
            height: 300,
            child: _ChartCard(
              title: 'Effort vs stress',
              subtitle:
                  'Scatter plot showing the relationship between prep time and stress.',
              child: _ScatterChart(
                points: const [
                  Offset(0.12, 0.78),
                  Offset(0.18, 0.70),
                  Offset(0.25, 0.62),
                  Offset(0.31, 0.66),
                  Offset(0.39, 0.50),
                  Offset(0.45, 0.48),
                  Offset(0.55, 0.40),
                  Offset(0.61, 0.34),
                  Offset(0.69, 0.31),
                  Offset(0.76, 0.25),
                  Offset(0.84, 0.22),
                  Offset(0.89, 0.18),
                ],
                color: const Color(0xFF0F766E),
              ),
            ),
          ),
          SizedBox(
            width: cardWidth,
            height: 320,
            child: _ChartCard(
              title: 'Activity heatmap',
              subtitle:
                  'Heatmap for day and time windows with the strongest response bursts.',
              child: _HeatmapChart(
                days: const ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                slots: const ['Morning', 'Afternoon', 'Evening', 'Night'],
                values: const [
                  [18, 24, 38, 22],
                  [22, 31, 44, 28],
                  [25, 36, 50, 32],
                  [29, 40, 58, 35],
                  [34, 44, 62, 41],
                  [30, 41, 55, 46],
                  [27, 35, 48, 40],
                ],
              ),
            ),
          ),
        ];

        return Wrap(spacing: 16, runSpacing: 16, children: charts);
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final IconData icon;
  final MaterialColor color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [color.shade400, color.shade600]),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.25),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white, size: 30),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withOpacity(0.16)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _ChartCard extends StatelessWidget {
  const _ChartCard({
    required this.title,
    required this.subtitle,
    required this.child,
  });

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFF0E9DB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 14),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _LineTrendChart extends StatelessWidget {
  const _LineTrendChart({
    required this.labels,
    required this.values,
    required this.lineColor,
    required this.fillColor,
    this.showArea = false,
  });

  final List<String> labels;
  final List<double> values;
  final Color lineColor;
  final Color fillColor;
  final bool showArea;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return CustomPaint(
          size: Size(constraints.maxWidth, constraints.maxHeight),
          painter: _LineAreaChartPainter(
            labels: labels,
            values: values,
            lineColor: lineColor,
            fillColor: fillColor,
            showArea: showArea,
          ),
        );
      },
    );
  }
}

class _VerticalBarChart extends StatelessWidget {
  const _VerticalBarChart({
    required this.labels,
    required this.values,
    required this.color,
  });

  final List<String> labels;
  final List<double> values;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return CustomPaint(
          size: Size(constraints.maxWidth, constraints.maxHeight),
          painter: _VerticalBarChartPainter(
            labels: labels,
            values: values,
            color: color,
          ),
        );
      },
    );
  }
}

class _HorizontalBarChart extends StatelessWidget {
  const _HorizontalBarChart({
    required this.labels,
    required this.values,
    required this.color,
  });

  final List<String> labels;
  final List<double> values;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return CustomPaint(
          size: Size(constraints.maxWidth, constraints.maxHeight),
          painter: _HorizontalBarChartPainter(
            labels: labels,
            values: values,
            color: color,
          ),
        );
      },
    );
  }
}

class _StackedGroup {
  const _StackedGroup({required this.label, required this.values});

  final String label;
  final List<double> values;
}

class _StackedBarChart extends StatelessWidget {
  const _StackedBarChart({
    required this.groups,
    required this.seriesLabels,
    required this.seriesColors,
  });

  final List<_StackedGroup> groups;
  final List<String> seriesLabels;
  final List<Color> seriesColors;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Column(
          children: [
            Expanded(
              child: CustomPaint(
                size: Size(constraints.maxWidth, constraints.maxHeight),
                painter: _StackedBarChartPainter(
                  groups: groups,
                  seriesColors: seriesColors,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: List.generate(seriesLabels.length, (index) {
                return _LegendDot(
                  label: seriesLabels[index],
                  color: seriesColors[index],
                );
              }),
            ),
          ],
        );
      },
    );
  }
}

class _CircularSection {
  const _CircularSection({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final double value;
  final Color color;
}

class _PieDonutChart extends StatelessWidget {
  const _PieDonutChart({required this.sections, required this.holeRatio});

  final List<_CircularSection> sections;
  final double holeRatio;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Column(
          children: [
            Expanded(
              child: CustomPaint(
                size: Size(constraints.maxWidth, constraints.maxHeight),
                painter: _CircularChartPainter(
                  sections: sections,
                  holeRatio: holeRatio,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 8,
              children: sections
                  .map(
                    (section) =>
                        _LegendDot(label: section.label, color: section.color),
                  )
                  .toList(),
            ),
          ],
        );
      },
    );
  }
}

class _RadarChart extends StatelessWidget {
  const _RadarChart({
    required this.labels,
    required this.values,
    required this.color,
  });

  final List<String> labels;
  final List<double> values;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return CustomPaint(
          size: Size(constraints.maxWidth, constraints.maxHeight),
          painter: _RadarChartPainter(
            labels: labels,
            values: values,
            color: color,
          ),
        );
      },
    );
  }
}

class _ScatterChart extends StatelessWidget {
  const _ScatterChart({required this.points, required this.color});

  final List<Offset> points;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return CustomPaint(
          size: Size(constraints.maxWidth, constraints.maxHeight),
          painter: _ScatterChartPainter(points: points, color: color),
        );
      },
    );
  }
}

class _HeatmapChart extends StatelessWidget {
  const _HeatmapChart({
    required this.days,
    required this.slots,
    required this.values,
  });

  final List<String> days;
  final List<String> slots;
  final List<List<double>> values;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return CustomPaint(
          size: Size(constraints.maxWidth, constraints.maxHeight),
          painter: _HeatmapChartPainter(
            days: days,
            slots: slots,
            values: values,
          ),
        );
      },
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey.shade700,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _LineAreaChartPainter extends CustomPainter {
  _LineAreaChartPainter({
    required this.labels,
    required this.values,
    required this.lineColor,
    required this.fillColor,
    required this.showArea,
  });

  final List<String> labels;
  final List<double> values;
  final Color lineColor;
  final Color fillColor;
  final bool showArea;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) {
      return;
    }

    const leftPadding = 34.0;
    const topPadding = 16.0;
    const bottomPadding = 30.0;
    final chartWidth = size.width - leftPadding - 12;
    final chartHeight = size.height - topPadding - bottomPadding;
    final maxValue = values.reduce(math.max);
    final minValue = 0.0;

    _drawGrid(canvas, size, leftPadding, topPadding, chartWidth, chartHeight);

    final points = <Offset>[];
    for (var index = 0; index < values.length; index++) {
      final dx =
          leftPadding +
          (values.length == 1
              ? chartWidth / 2
              : chartWidth * (index / (values.length - 1)));
      final normalized =
          (values[index] - minValue) /
          (maxValue - minValue == 0 ? 1 : maxValue - minValue);
      final dy = topPadding + chartHeight - (normalized * chartHeight);
      points.add(Offset(dx, dy));
    }

    final linePaint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final linePath = Path()..moveTo(points.first.dx, points.first.dy);
    for (final point in points.skip(1)) {
      linePath.lineTo(point.dx, point.dy);
    }

    if (showArea) {
      final fillPath = Path.from(linePath)
        ..lineTo(points.last.dx, topPadding + chartHeight)
        ..lineTo(points.first.dx, topPadding + chartHeight)
        ..close();

      final fillPaint = Paint()
        ..shader =
            LinearGradient(
              colors: [fillColor, fillColor.withOpacity(0.04)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ).createShader(
              Rect.fromLTWH(leftPadding, topPadding, chartWidth, chartHeight),
            );
      canvas.drawPath(fillPath, fillPaint);
    }

    canvas.drawPath(linePath, linePaint);

    final dotPaint = Paint()..color = lineColor;
    for (final point in points) {
      canvas.drawCircle(point, 4.8, dotPaint);
      canvas.drawCircle(
        point,
        7,
        Paint()
          ..color = Colors.white.withOpacity(0.75)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2,
      );
    }

    for (
      var index = 0;
      index < labels.length && index < points.length;
      index++
    ) {
      _drawText(
        canvas,
        labels[index],
        Offset(points[index].dx - 14, size.height - 22),
        style: TextStyle(
          color: Colors.grey.shade600,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      );
    }
  }

  void _drawGrid(
    Canvas canvas,
    Size size,
    double leftPadding,
    double topPadding,
    double width,
    double height,
  ) {
    final gridPaint = Paint()
      ..color = const Color(0xFFF0E9DB)
      ..strokeWidth = 1;

    for (var i = 0; i < 4; i++) {
      final dy = topPadding + (height / 3) * i;
      canvas.drawLine(
        Offset(leftPadding, dy),
        Offset(leftPadding + width, dy),
        gridPaint,
      );
    }

    canvas.drawLine(
      Offset(leftPadding, topPadding),
      Offset(leftPadding, topPadding + height),
      gridPaint,
    );
    canvas.drawLine(
      Offset(leftPadding, topPadding + height),
      Offset(leftPadding + width, topPadding + height),
      gridPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _LineAreaChartPainter oldDelegate) {
    return oldDelegate.values != values ||
        oldDelegate.labels != labels ||
        oldDelegate.lineColor != lineColor ||
        oldDelegate.fillColor != fillColor ||
        oldDelegate.showArea != showArea;
  }
}

class _VerticalBarChartPainter extends CustomPainter {
  _VerticalBarChartPainter({
    required this.labels,
    required this.values,
    required this.color,
  });

  final List<String> labels;
  final List<double> values;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) {
      return;
    }

    const leftPadding = 20.0;
    const bottomPadding = 38.0;
    const topPadding = 14.0;
    final chartHeight = size.height - bottomPadding - topPadding;
    final barWidth = (size.width - leftPadding * 2) / values.length;
    final maxValue = values.reduce(math.max);

    _drawBaseGrid(canvas, size, leftPadding, topPadding, chartHeight);

    for (var index = 0; index < values.length; index++) {
      final heightFactor = values[index] / (maxValue == 0 ? 1 : maxValue);
      final barHeight = chartHeight * heightFactor;
      final left = leftPadding + index * barWidth + barWidth * 0.18;
      final right = left + barWidth * 0.64;
      final rect = RRect.fromRectAndRadius(
        Rect.fromLTRB(
          left,
          topPadding + chartHeight - barHeight,
          right,
          topPadding + chartHeight,
        ),
        const Radius.circular(10),
      );

      final paint = Paint()
        ..shader = LinearGradient(
          colors: [color.withOpacity(0.85), color.withOpacity(0.45)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ).createShader(rect.outerRect);
      canvas.drawRRect(rect, paint);

      _drawText(
        canvas,
        values[index].toStringAsFixed(0),
        Offset(left + 2, topPadding + chartHeight - barHeight - 18),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      );

      _drawText(
        canvas,
        labels[index],
        Offset(
          leftPadding + index * barWidth + barWidth * 0.1,
          size.height - 24,
        ),
        style: TextStyle(
          color: Colors.grey.shade600,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      );
    }
  }

  void _drawBaseGrid(
    Canvas canvas,
    Size size,
    double leftPadding,
    double topPadding,
    double chartHeight,
  ) {
    final gridPaint = Paint()
      ..color = const Color(0xFFF0E9DB)
      ..strokeWidth = 1;

    for (var i = 0; i < 4; i++) {
      final dy = topPadding + (chartHeight / 3) * i;
      canvas.drawLine(
        Offset(leftPadding, dy),
        Offset(size.width - 10, dy),
        gridPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _VerticalBarChartPainter oldDelegate) {
    return oldDelegate.values != values ||
        oldDelegate.labels != labels ||
        oldDelegate.color != color;
  }
}

class _HorizontalBarChartPainter extends CustomPainter {
  _HorizontalBarChartPainter({
    required this.labels,
    required this.values,
    required this.color,
  });

  final List<String> labels;
  final List<double> values;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) {
      return;
    }

    const leftPadding = 118.0;
    const rightPadding = 16.0;
    const topPadding = 12.0;
    const bottomPadding = 14.0;
    final maxValue = values.reduce(math.max);
    final barHeight =
        (size.height - topPadding - bottomPadding) / values.length;
    final usableWidth = size.width - leftPadding - rightPadding;

    for (var index = 0; index < values.length; index++) {
      final cy = topPadding + index * barHeight + barHeight * 0.5;
      final barWidth =
          usableWidth * (values[index] / (maxValue == 0 ? 1 : maxValue));
      final rect = RRect.fromRectAndRadius(
        Rect.fromLTWH(
          leftPadding,
          cy - barHeight * 0.23,
          barWidth,
          barHeight * 0.46,
        ),
        const Radius.circular(10),
      );

      canvas.drawRRect(
        rect,
        Paint()
          ..shader = LinearGradient(
            colors: [color.withOpacity(0.92), color.withOpacity(0.45)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ).createShader(rect.outerRect),
      );

      _drawText(
        canvas,
        labels[index],
        Offset(10, cy - 8),
        style: TextStyle(
          color: Colors.grey.shade700,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      );

      _drawText(
        canvas,
        values[index].toStringAsFixed(0),
        Offset(leftPadding + barWidth + 8, cy - 8),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _HorizontalBarChartPainter oldDelegate) {
    return oldDelegate.values != values ||
        oldDelegate.labels != labels ||
        oldDelegate.color != color;
  }
}

class _StackedBarChartPainter extends CustomPainter {
  _StackedBarChartPainter({required this.groups, required this.seriesColors});

  final List<_StackedGroup> groups;
  final List<Color> seriesColors;

  @override
  void paint(Canvas canvas, Size size) {
    if (groups.isEmpty) {
      return;
    }

    const leftPadding = 16.0;
    const bottomPadding = 30.0;
    const topPadding = 18.0;
    final barWidth = (size.width - leftPadding * 2) / groups.length;
    final chartHeight = size.height - bottomPadding - topPadding;
    final maxSum = groups
        .map(
          (group) => group.values.fold<double>(0, (sum, value) => sum + value),
        )
        .reduce(math.max);

    final gridPaint = Paint()
      ..color = const Color(0xFFF0E9DB)
      ..strokeWidth = 1;

    for (var i = 0; i < 3; i++) {
      final dy = topPadding + (chartHeight / 2) * i;
      canvas.drawLine(
        Offset(leftPadding, dy),
        Offset(size.width - 10, dy),
        gridPaint,
      );
    }

    for (var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      final group = groups[groupIndex];
      final total = group.values.fold<double>(0, (sum, value) => sum + value);
      final x = leftPadding + groupIndex * barWidth + barWidth * 0.18;
      final width = barWidth * 0.62;
      var y = topPadding + chartHeight;

      for (
        var seriesIndex = 0;
        seriesIndex < group.values.length;
        seriesIndex++
      ) {
        final value = group.values[seriesIndex];
        final segmentHeight =
            chartHeight * (value / (maxSum == 0 ? 1 : maxSum));
        y -= segmentHeight;
        final rect = Rect.fromLTWH(x, y, width, segmentHeight);
        canvas.drawRRect(
          RRect.fromRectAndRadius(rect, const Radius.circular(8)),
          Paint()..color = seriesColors[seriesIndex % seriesColors.length],
        );
      }

      _drawText(
        canvas,
        group.label,
        Offset(x + 2, size.height - 22),
        style: TextStyle(
          color: Colors.grey.shade600,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      );

      _drawText(
        canvas,
        total.toStringAsFixed(0),
        Offset(x + 1, y - 18),
        style: TextStyle(
          color: Colors.grey.shade700,
          fontSize: 10,
          fontWeight: FontWeight.w800,
        ),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _StackedBarChartPainter oldDelegate) {
    return oldDelegate.groups != groups ||
        oldDelegate.seriesColors != seriesColors;
  }
}

class _CircularChartPainter extends CustomPainter {
  _CircularChartPainter({required this.sections, required this.holeRatio});

  final List<_CircularSection> sections;
  final double holeRatio;

  @override
  void paint(Canvas canvas, Size size) {
    if (sections.isEmpty) {
      return;
    }

    final total = sections.fold<double>(
      0,
      (sum, section) => sum + section.value,
    );
    final radius = math.min(size.width, size.height) * 0.34;
    final center = Offset(size.width * 0.46, size.height * 0.46);
    var startAngle = -math.pi / 2;

    for (final section in sections) {
      final sweepAngle = (section.value / total) * math.pi * 2;
      final paint = Paint()
        ..color = section.color
        ..style = PaintingStyle.fill;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        true,
        paint,
      );

      final labelAngle = startAngle + sweepAngle / 2;
      final labelRadius = radius * 0.78;
      final labelOffset = Offset(
        center.dx + math.cos(labelAngle) * labelRadius,
        center.dy + math.sin(labelAngle) * labelRadius,
      );
      _drawText(
        canvas,
        '${(section.value / total * 100).round()}%',
        Offset(labelOffset.dx - 14, labelOffset.dy - 8),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      );
      startAngle += sweepAngle;
    }

    if (holeRatio > 0) {
      final holePaint = Paint()..color = Colors.white;
      canvas.drawCircle(center, radius * holeRatio, holePaint);
      _drawText(
        canvas,
        '100%',
        Offset(center.dx - 18, center.dy - 14),
        style: const TextStyle(
          color: Color(0xFF111827),
          fontSize: 16,
          fontWeight: FontWeight.w900,
        ),
      );
      _drawText(
        canvas,
        'language mix',
        Offset(center.dx - 34, center.dy + 6),
        style: TextStyle(
          color: Colors.grey.shade600,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _CircularChartPainter oldDelegate) {
    return oldDelegate.sections != sections ||
        oldDelegate.holeRatio != holeRatio;
  }
}

class _RadarChartPainter extends CustomPainter {
  _RadarChartPainter({
    required this.labels,
    required this.values,
    required this.color,
  });

  final List<String> labels;
  final List<double> values;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) {
      return;
    }

    final center = Offset(size.width * 0.5, size.height * 0.48);
    final radius = math.min(size.width, size.height) * 0.28;
    final count = values.length;

    final gridPaint = Paint()
      ..color = const Color(0xFFF0E9DB)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    for (var ring = 1; ring <= 4; ring++) {
      final ringRadius = radius * (ring / 4);
      final path = Path();
      for (var index = 0; index < count; index++) {
        final angle = -math.pi / 2 + (math.pi * 2 * index / count);
        final point = Offset(
          center.dx + math.cos(angle) * ringRadius,
          center.dy + math.sin(angle) * ringRadius,
        );
        if (index == 0) {
          path.moveTo(point.dx, point.dy);
        } else {
          path.lineTo(point.dx, point.dy);
        }
      }
      path.close();
      canvas.drawPath(path, gridPaint);
    }

    for (var index = 0; index < count; index++) {
      final angle = -math.pi / 2 + (math.pi * 2 * index / count);
      final endPoint = Offset(
        center.dx + math.cos(angle) * radius,
        center.dy + math.sin(angle) * radius,
      );
      canvas.drawLine(center, endPoint, gridPaint);

      final labelPoint = Offset(
        center.dx + math.cos(angle) * (radius + 18),
        center.dy + math.sin(angle) * (radius + 18),
      );
      _drawText(
        canvas,
        labels[index],
        Offset(labelPoint.dx - 18, labelPoint.dy - 7),
        style: TextStyle(
          color: Colors.grey.shade700,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      );
    }

    final dataPath = Path();
    for (var index = 0; index < count; index++) {
      final angle = -math.pi / 2 + (math.pi * 2 * index / count);
      final valueRadius = radius * values[index].clamp(0.0, 1.0);
      final point = Offset(
        center.dx + math.cos(angle) * valueRadius,
        center.dy + math.sin(angle) * valueRadius,
      );
      if (index == 0) {
        dataPath.moveTo(point.dx, point.dy);
      } else {
        dataPath.lineTo(point.dx, point.dy);
      }
      canvas.drawCircle(point, 4.5, Paint()..color = color);
    }
    dataPath.close();

    canvas.drawPath(
      dataPath,
      Paint()
        ..color = color.withOpacity(0.22)
        ..style = PaintingStyle.fill,
    );
    canvas.drawPath(
      dataPath,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );
  }

  @override
  bool shouldRepaint(covariant _RadarChartPainter oldDelegate) {
    return oldDelegate.labels != labels ||
        oldDelegate.values != values ||
        oldDelegate.color != color;
  }
}

class _ScatterChartPainter extends CustomPainter {
  _ScatterChartPainter({required this.points, required this.color});

  final List<Offset> points;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    const leftPadding = 28.0;
    const topPadding = 18.0;
    const rightPadding = 14.0;
    const bottomPadding = 26.0;
    final plotWidth = size.width - leftPadding - rightPadding;
    final plotHeight = size.height - topPadding - bottomPadding;

    final gridPaint = Paint()
      ..color = const Color(0xFFF0E9DB)
      ..strokeWidth = 1;

    for (var i = 0; i < 4; i++) {
      final x = leftPadding + (plotWidth / 3) * i;
      final y = topPadding + (plotHeight / 3) * i;
      canvas.drawLine(
        Offset(x, topPadding),
        Offset(x, topPadding + plotHeight),
        gridPaint,
      );
      canvas.drawLine(
        Offset(leftPadding, y),
        Offset(leftPadding + plotWidth, y),
        gridPaint,
      );
    }

    canvas.drawLine(
      Offset(leftPadding, topPadding + plotHeight),
      Offset(leftPadding + plotWidth, topPadding + plotHeight),
      gridPaint,
    );
    canvas.drawLine(
      Offset(leftPadding, topPadding),
      Offset(leftPadding, topPadding + plotHeight),
      gridPaint,
    );

    for (final point in points) {
      final mapped = Offset(
        leftPadding + point.dx * plotWidth,
        topPadding + point.dy * plotHeight,
      );
      canvas.drawCircle(mapped, 7, Paint()..color = color.withOpacity(0.2));
      canvas.drawCircle(mapped, 4, Paint()..color = color);
    }

    _drawText(
      canvas,
      'Effort',
      Offset(size.width - 50, size.height - 18),
      style: TextStyle(
        color: Colors.grey.shade600,
        fontSize: 10,
        fontWeight: FontWeight.w700,
      ),
    );
    _drawText(
      canvas,
      'Stress',
      const Offset(6, 6),
      style: TextStyle(
        color: Colors.grey.shade600,
        fontSize: 10,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  @override
  bool shouldRepaint(covariant _ScatterChartPainter oldDelegate) {
    return oldDelegate.points != points || oldDelegate.color != color;
  }
}

class _HeatmapChartPainter extends CustomPainter {
  _HeatmapChartPainter({
    required this.days,
    required this.slots,
    required this.values,
  });

  final List<String> days;
  final List<String> slots;
  final List<List<double>> values;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) {
      return;
    }

    const leftPadding = 42.0;
    const topPadding = 28.0;
    const rightPadding = 10.0;
    const bottomPadding = 18.0;
    final plotWidth = size.width - leftPadding - rightPadding;
    final plotHeight = size.height - topPadding - bottomPadding;
    final cellWidth = plotWidth / days.length;
    final cellHeight = plotHeight / slots.length;
    final maxValue = values.expand((row) => row).fold<double>(0, math.max);

    for (var rowIndex = 0; rowIndex < slots.length; rowIndex++) {
      _drawText(
        canvas,
        slots[rowIndex],
        Offset(4, topPadding + rowIndex * cellHeight + cellHeight * 0.36),
        style: TextStyle(
          color: Colors.grey.shade600,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      );
    }

    for (var columnIndex = 0; columnIndex < days.length; columnIndex++) {
      _drawText(
        canvas,
        days[columnIndex],
        Offset(leftPadding + columnIndex * cellWidth + 2, 4),
        style: TextStyle(
          color: Colors.grey.shade600,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      );
    }

    for (var rowIndex = 0; rowIndex < values.length; rowIndex++) {
      for (
        var columnIndex = 0;
        columnIndex < values[rowIndex].length;
        columnIndex++
      ) {
        final value = values[rowIndex][columnIndex];
        final intensity = value / (maxValue == 0 ? 1 : maxValue);
        final rect = Rect.fromLTWH(
          leftPadding + columnIndex * cellWidth + 3,
          topPadding + rowIndex * cellHeight + 3,
          cellWidth - 6,
          cellHeight - 6,
        );
        canvas.drawRRect(
          RRect.fromRectAndRadius(rect, const Radius.circular(10)),
          Paint()
            ..shader = LinearGradient(
              colors: [
                Color.lerp(
                  const Color(0xFFDCFCE7),
                  const Color(0xFF15803D),
                  intensity,
                )!,
                Color.lerp(
                  const Color(0xFFECFDF5),
                  const Color(0xFF22C55E),
                  intensity,
                )!,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ).createShader(rect),
        );

        _drawText(
          canvas,
          value.toStringAsFixed(0),
          Offset(rect.left + 10, rect.top + 8),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 10,
            fontWeight: FontWeight.w800,
          ),
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant _HeatmapChartPainter oldDelegate) {
    return oldDelegate.days != days ||
        oldDelegate.slots != slots ||
        oldDelegate.values != values;
  }
}

void _drawText(
  Canvas canvas,
  String text,
  Offset offset, {
  required TextStyle style,
}) {
  final painter = TextPainter(
    text: TextSpan(text: text, style: style),
    textDirection: TextDirection.ltr,
    maxLines: 1,
  )..layout();
  painter.paint(canvas, offset);
}
