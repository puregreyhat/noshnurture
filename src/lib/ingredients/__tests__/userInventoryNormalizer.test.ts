import { describe, it, expect } from 'vitest';
import normalizeInventoryItems from '../userInventoryNormalizer';

describe('normalizeInventoryItems', () => {
  it('includes canonical and token fallbacks from product_name and tags', async () => {
    const items = [
      {
        id: '1',
        user_id: 'u',
        order_id: '',
        order_date: new Date().toISOString(),
        product_name: 'Britannia Pav',
        category: 'bakery',
        quantity: 1,
        unit: 'pcs',
        expiry_date: new Date().toISOString(),
        days_until_expiry: 5,
        status: 'fresh',
        storage_type: 'room-temp',
        tags: [],
        common_uses: [],
        is_consumed: false,
      },
      {
        id: '2',
        user_id: 'u',
        order_id: '',
        order_date: new Date().toISOString(),
        product_name: 'Everest Pav Bhaji Masala 100g',
        category: 'spices',
        quantity: 1,
        unit: 'pcs',
        expiry_date: new Date().toISOString(),
        days_until_expiry: 2,
        status: 'fresh',
        storage_type: 'room-temp',
        tags: ['canonical:pav bhaji masala'],
        common_uses: [],
        is_consumed: false,
      },
    ];

    const { available, canonicalExpiry } = await normalizeInventoryItems(items as any);

    // Token-level fallbacks: 'pav' should be present from 'Britannia Pav'
    expect(Array.from(available).some(x => x.includes('pav'))).toBe(true);

    // Canonical from tag should be present
    expect(Array.from(available).some(x => x.includes('pav bhaji'))).toBe(true);

    // canonicalExpiry should include an entry for pav bhaji masala
    expect(canonicalExpiry.some(c => c.canonical.includes('pav bhaji'))).toBe(true);
  });
});
