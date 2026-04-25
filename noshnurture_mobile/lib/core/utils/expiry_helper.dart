class ExpiryHelper {
  /// Returns an intelligent default expiry date based on the product name.
  static DateTime getSmartExpiry(String productName, {DateTime? fallback}) {
    final lower = productName.toLowerCase();
    
    int days = 7; // Default fresh baseline
    
    // Very perishable (1-3 days)
    if (lower.contains('milk') || lower.contains('chicken') || lower.contains('meat') || lower.contains('fish') || lower.contains('beef')) {
      days = 3;
    }
    // Highly perishable veggies (4-7 days)
    else if (lower.contains('coriander') || lower.contains('cilantro') || lower.contains('spinach') || lower.contains('lettuce') || lower.contains('berry') || lower.contains('bread')) {
      days = 5;
    }
    // Standard perishables (1-2 weeks)
    else if (lower.contains('tomato') || lower.contains('cheese') || lower.contains('egg') || lower.contains('yogurt') || lower.contains('apple') || lower.contains('carrot')) {
      days = 14;
    }
    // Long-lasting perishables (1-2 months)
    else if (lower.contains('potato') || lower.contains('onion') || lower.contains('garlic') || lower.contains('orange') || lower.contains('lemon')) {
      days = 45;
    }
    // Dry goods / pantry (6+ months)
    else if (lower.contains('rice') || lower.contains('pasta') || lower.contains('bean') || lower.contains('oil') || lower.contains('spice') || lower.contains('salt') || lower.contains('sugar')) {
      days = 180;
    }
    // Canned / Frozen (1+ years)
    else if (lower.contains('can') || lower.contains('frozen') || lower.contains('ice')) {
      days = 365;
    }
    
    return DateTime.now().add(Duration(days: days));
  }
}
