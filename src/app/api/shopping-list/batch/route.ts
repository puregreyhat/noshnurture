
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { items, recipe_id } = body; // items is array of { item_name, quantity, unit, added_from }

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'items array is required' },
                { status: 400 }
            );
        }

        const addedItems = [];
        const errors = [];

        // Process items sequentially to handle upserts/checks correctly without race conditions
        // In a real prod environment, we might want a bulk upsert function, but Supabase/PostgREST
        // simple insert doesn't perfectly handle complex logic "check if exists, sum quantity" simply.
        // So we iterate.
        for (const item of items) {
            if (!item.item_name) continue;

            try {
                // Check if exists
                const { data: existing } = await supabase
                    .from('shopping_list')
                    .select('id, quantity')
                    .eq('user_id', user.id)
                    .eq('item_name', item.item_name)
                    .limit(1)
                    .single();

                if (existing) {
                    // Update quantity
                    // Naive string addition handling: try to parse float, add, retain unit if possible
                    // If existing is "2 pcs" and new is "1", this simple logic assumes we just add the numbers
                    // Ideally we would normalize units, but for now we just parse the numeric part.
                    const oldQty = parseFloat(String(existing.quantity)) || 1;
                    const newAdd = parseFloat(String(item.quantity)) || 1;
                    const finalQty = String(oldQty + newAdd);

                    await supabase
                        .from('shopping_list')
                        .update({ quantity: finalQty })
                        .eq('id', existing.id);

                    addedItems.push({ ...item, status: 'updated' });
                } else {
                    // Insert new
                    await supabase
                        .from('shopping_list')
                        .insert({
                            user_id: user.id,
                            item_name: item.item_name,
                            quantity: String(item.quantity || '1'),
                            unit: item.unit || 'pcs',
                            added_from: item.added_from || 'recipe',
                            recipe_id: recipe_id || null
                        });

                    addedItems.push({ ...item, status: 'inserted' });
                }
            } catch (err) {
                console.error(`Error processing item ${item.item_name}:`, err);
                errors.push({ item: item.item_name, error: err });
            }
        }

        return NextResponse.json({ success: true, addedCount: addedItems.length, errors });

    } catch (error) {
        console.error('POST /api/shopping-list/batch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
