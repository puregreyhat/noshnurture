/**
 * API route to detect low-stock items
 * Checks inventory for items with quantity < 2
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch non-consumed items with low quantity
    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('id, product_name, quantity, unit')
      .eq('user_id', user.id)
      .eq('is_consumed', false)
      .lt('quantity', 2)
      .order('quantity', { ascending: true });

    if (error) {
      console.error('Error fetching low-stock items:', error);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });

  } catch (error) {
    console.error('GET /api/shopping-list/low-stock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
