// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:medtripz_ai_assistant/main.dart';

void main() {
  testWidgets('Splash and chatbot screen launch', (WidgetTester tester) async {
    await tester.pumpWidget(const MedTripzApp());

    expect(find.text('MedTripz AI Assistant'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
