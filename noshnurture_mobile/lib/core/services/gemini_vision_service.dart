import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class GeminiVisionResult {
  final bool isProduce;
  final String productName;
  final String? expiryDate;
  final String? freshnessNotes;

  GeminiVisionResult({
    required this.isProduce,
    required this.productName,
    this.expiryDate,
    this.freshnessNotes,
  });

  factory GeminiVisionResult.fromJson(Map<String, dynamic> json) {
    return GeminiVisionResult(
      isProduce: json['is_produce'] ?? false,
      productName: json['product_name'] ?? 'Unknown Product',
      expiryDate: json['expiry_date'],
      freshnessNotes: json['freshness_notes'],
    );
  }
}

class GeminiVisionService {
  // WE HAVE DITCHED GOOGLE GEMINI. 
  // Using No-Cost, No-Key API from Pollinations.ai
  static const String _baseUrl = 'https://text.pollinations.ai/';

  /// Identifies product using OCR text (Primary method - Ultra fast)
  static Future<GeminiVisionResult?> analyzeProductFromText(String rawText) async {
    if (rawText.trim().isEmpty) return null;

    try {
      debugPrint('[NoCostAI] Analyzing text via Pollinations (OpenAI)...');
      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "messages": [
            {
              "role": "system",
              "content": "You are a grocery expert. Identify the product brand and name from OCR text. Return ONLY JSON."
            },
            {
              "role": "user",
              "content": "Text: $rawText\nReturn JSON format: {\"is_produce\": false, \"product_name\": \"BRAND NAME PRODUCT NAME\", \"expiry_date\": \"DD/MM/YYYY or null\"}"
            }
          ],
          "model": "openai",
          "jsonMode": true
        }),
      );

      if (response.statusCode == 200) {
        debugPrint('[NoCostAI] Raw Text Response: ${response.body}');
        return _parseJsonFromResult(response.body);
      } else {
        return await _fallbackAnalyzeText(rawText);
      }
    } catch (e) {
      return await _fallbackAnalyzeText(rawText);
    }
  }

  static Future<GeminiVisionResult?> _fallbackAnalyzeText(String rawText) async {
    try {
      debugPrint('[NoCostAI] Using Pollinations Text Fallback (OpenAI)...');
      final url = Uri.parse('https://text.pollinations.ai/');
      
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "messages": [
            {
              "role": "system",
              "content": "You are a JSON API. Identify product from text. Return ONLY JSON."
            },
            {
              "role": "user",
              "content": "Text: $rawText\nReturn JSON: {\"is_produce\": false, \"product_name\": \"Brand Name + Product\", \"expiry_date\": \"...\"}"
            }
          ],
          "model": "openai",
          "jsonMode": true
        }),
      );

      if (response.statusCode == 200) {
        return _parseJsonFromResult(response.body);
      }
    } catch (e) {
      debugPrint('[NoCostAI] Fallback failed: $e');
    }
    return null;
  }

  /// Identifies product using Image (Multimodal fallback)
  static Future<GeminiVisionResult?> analyzeImage(String base64Image) async {
    try {
      debugPrint('[NoCostAI] Analyzing image via Pollinations (OpenAI)...');
      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "messages": [
            {
              "role": "user",
              "content": [
                {"type": "text", "text": "Identify this grocery product. Return JSON: {\"product_name\": \"Actual Brand and Product Name\", \"is_produce\": false, \"expiry_date\": \"DD/MM/YYYY or null\"}"},
                {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,$base64Image"}}
              ]
            }
          ],
          "model": "openai"
        }),
      );

      if (response.statusCode == 200) {
        debugPrint('[NoCostAI] Raw Image Response: ${response.body}');
        return _parseJsonFromResult(response.body);
      }
    } catch (e) {
      debugPrint('[NoCostAI] Image analysis failed: $e');
    }
    return null;
  }

  static GeminiVisionResult? _parseJsonFromResult(String text) {
    try {
      // Find the first '{' and last '}'
      final jsonStart = text.indexOf('{');
      final jsonEnd = text.lastIndexOf('}');
      
      if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
        final cleanJson = text.substring(jsonStart, jsonEnd + 1);
        debugPrint('[NoCostAI] Found JSON block: $cleanJson');
        final data = jsonDecode(cleanJson);
        
        // Ensure we don't return 'Unknown Product' if we can help it
        String name = data['product_name']?.toString() ?? 'Unknown Product';
        if (name == 'null' || name.isEmpty) name = 'Unknown Product';

        return GeminiVisionResult(
          isProduce: data['is_produce'] ?? false,
          productName: name,
          expiryDate: data['expiry_date']?.toString(),
        );
      } else {
        debugPrint('[NoCostAI] No JSON block found in response');
      }
    } catch (e) {
      debugPrint('[NoCostAI] Parse error: $e');
    }
    return null;
  }

  /// Parses receipt text into a list of items
  static Future<List<String>> extractGroceryItemsFromText(String rawOcrText) async {
    if (rawOcrText.trim().isEmpty) return [];

    try {
      debugPrint('[NoCostAI] Extracting items via Pollinations (OpenAI)...');
      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "messages": [
            {
              "role": "system",
              "content": "You are a receipt parser. Extract ONLY a list of grocery item names. Return ONLY a JSON array of strings."
            },
            {
              "role": "user",
              "content": "Receipt: $rawOcrText\nReturn JSON: [\"Item 1\", \"Item 2\"]"
            }
          ],
          "model": "openai"
        }),
      );

      if (response.statusCode == 200) {
        final text = response.body.trim();
        final jsonStart = text.indexOf('[');
        final jsonEnd = text.lastIndexOf(']');
        if (jsonStart != -1 && jsonEnd != -1) {
          final cleanJson = text.substring(jsonStart, jsonEnd + 1);
          final List<dynamic> list = jsonDecode(cleanJson);
          return list.map((e) => e.toString()).toList();
        }
      }
    } catch (e) {
      debugPrint('[NoCostAI] Receipt extraction failed: $e');
    }
    return [];
  }
}
