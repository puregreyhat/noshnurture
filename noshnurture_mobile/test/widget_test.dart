import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:noshnurture_mobile/main.dart';

void main() {
  testWidgets('HeyNosh phone app boots successfully', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const HeyNoshPhoneApp());

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
