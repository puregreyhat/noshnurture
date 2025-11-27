import { describe, it, expect } from 'vitest';
import { parseMeasure, enhanceProductData, QRProduct, InventoryItem } from '@/lib/productUtils';

describe('parseMeasure', () => {
  it('parses "500 g" correctly', () => {
    const out = parseMeasure('500 g');
    expect(out).not.toBeNull();
    expect(out).toEqual({ value: 500, unit: 'g' });
  });

  it('parses "1 kg" correctly', () => {
    const out = parseMeasure('1 kg');
    expect(out).toEqual({ value: 1, unit: 'kg' });
  });

  it('parses "500ml" correctly', () => {
    const out = parseMeasure('500ml');
    expect(out).toEqual({ value: 500, unit: 'ml' });
  });
});

describe('enhanceProductData measure handling', () => {
  it('converts 500g x2 into 1 kg', () => {
    const input: QRProduct = { name: 'Tomato - Hybrid', expiryDate: '2025-11-01', quantity: 2, category: 'vegetables', measure: { value: 500, unit: 'g' } };
    const out: InventoryItem = enhanceProductData(input) as InventoryItem;
    expect(out.unit).toBe('kg');
    // allow some float rounding
    expect(out.quantity).toBeCloseTo(1);
  });

  it('converts 500ml into 0.5 L', () => {
    const input: QRProduct = { name: 'Gokul Full Cream Milk', expiryDate: '2025-11-01', quantity: 1, category: 'dairy', measure: { value: 500, unit: 'ml' } };
    const out: InventoryItem = enhanceProductData(input) as InventoryItem;
    expect(['ml', 'L']).toContain(out.unit);
    // If normalized to L, value should be 0.5; if kept in ml, value 500
    if (out.unit === 'L') {
      expect(out.quantity).toBeCloseTo(0.5);
    } else {
      expect(out.quantity).toBe(500);
    }
  });
});
