import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeIngredientName } from '@/lib/ingredients/normalize';

export const revalidate = 0;

// Dev-only endpoint: backfill inventory_items tags with a canonical:<value>
// Runs for the current authenticated user only.
export async function POST() {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's inventory rows
    const { data, error } = await supabaseServer
      .from('inventory_items')
      .select('id, product_name, tags')
      .eq('user_id', user.id)
      .eq('is_consumed', false);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to read inventory' }, { status: 500 });
    }

    const rows = Array.isArray(data) ? data : [];
    const updates: Array<Promise<unknown>> = [];
    let updated = 0;

    for (const r of rows) {
      try {
        const pid = (r as any).id as string | undefined;
        const pname = (r as any).product_name as string | undefined;
        const tags = Array.isArray((r as any).tags) ? ((r as any).tags as string[]) : [];
        if (!pid || !pname) continue;

        const canonical = await normalizeIngredientName(pname, { prefer: 'fuzzy' });
        const canonicalTag = `canonical:${canonical}`;
        if (tags.map(t => String(t).toLowerCase()).includes(canonicalTag.toLowerCase())) {
          continue; // already present
        }

        const newTags = [...tags, canonicalTag];
        // The Supabase client returns a PostgrestFilterBuilder which isn't typed as a
        // Promise here, so wrap the call in an async IIFE to produce a real Promise
        // that we can await via Promise.all below.
        updates.push(
          (async () => await supabaseServer.from('inventory_items').update({ tags: newTags }).eq('id', pid))()
        );
        updated += 1;
      } catch (e) {
        // continue on errors for individual rows
        console.warn('backfill row failed', e);
      }
    }

    // run updates in parallel (bounded by rows length)
    await Promise.all(updates);

    return NextResponse.json({ updated, total: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
