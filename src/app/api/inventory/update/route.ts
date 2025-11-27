import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabaseServer = await createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const {
      product_name,
      quantity,
      unit,
      category,
      expiry_date,
      storage_type,
      tags,
      replace_all,
    } = body as Record<string, any>;

    if (!product_name) {
      return NextResponse.json({ error: 'product_name is required' }, { status: 400 });
    }

    // Compute days_until_expiry
    let days_until_expiry = 0;
    if (expiry_date) {
      try {
        // Handle both DD/MM/YYYY and DD-MM-YYYY formats
        const separator = expiry_date.includes('/') ? '/' : '-';
        const [day, month, year] = expiry_date.split(separator).map(Number);

        const exp = new Date(year, month - 1, day);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        exp.setHours(0, 0, 0, 0);

        days_until_expiry = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } catch (e) {
        console.error('Error parsing expiry date:', expiry_date, e);
        days_until_expiry = 0;
      }
    } else {
      days_until_expiry = 0;
    }

    const status = days_until_expiry < 0 ? 'expired' : days_until_expiry <= 3 ? 'warning' : days_until_expiry <= 7 ? 'caution' : 'fresh';

    // Default tags array
    const tagArr = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);

    try {
      if (replace_all) {
        // Remove existing non-consumed rows for this product and user
        await supabaseServer
          .from('inventory_items')
          .delete()
          .eq('user_id', userId)
          .eq('product_name', product_name)
          .eq('is_consumed', false);
      }

      // Insert a single updated row
      const insertRow = {
        user_id: userId,
        order_id: '',
        order_date: new Date().toISOString(),
        product_name,
        category: category || 'other',
        quantity: Number(quantity) || 0,
        unit: unit || 'pcs',
        expiry_date: expiry_date || new Date().toISOString(),
        days_until_expiry,
        status,
        storage_type: storage_type || 'refrigerator',
        tags: tagArr,
        common_uses: [],
        is_consumed: false,
        consumed_date: null,
      };

      const { error: insertErr } = await supabaseServer.from('inventory_items').insert([insertRow]);
      if (insertErr) {
        console.error('Insert failed:', insertErr.message);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (e) {
      const err = e as Error;
      console.error('Update inventory error:', err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  } catch (e) {
    const err = e as Error;
    console.error('Invalid request to inventory update:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
