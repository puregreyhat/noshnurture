/**
 * Shopping List API Routes
 * GET: Fetch user's shopping list
 * POST: Add item to shopping list
 * DELETE: Remove item from shopping list
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/shopping-list - Fetch user's shopping list
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shopping list:', error);
      return NextResponse.json({ error: 'Failed to fetch shopping list' }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('GET /api/shopping-list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/shopping-list - Add item to shopping list
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item_name, quantity, unit, added_from, recipe_id } = body;

    if (!item_name || !added_from) {
      return NextResponse.json(
        { error: 'item_name and added_from are required' },
        { status: 400 }
      );
    }

    // Check if item already exists in shopping list
    const { data: existingItems } = await supabase
      .from('shopping_list')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('item_name', item_name)
      .limit(1);

    if (existingItems && existingItems.length > 0) {
      // Item exists, update quantity instead
      const existingItem = existingItems[0];
      const newQuantity = String(Number(existingItem.quantity || 1) + Number(quantity || 1));

      const { data: updated, error: updateError } = await supabase
        .from('shopping_list')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating shopping list item:', updateError);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
      }

      return NextResponse.json({ item: updated, updated: true });
    }

    // Insert new item
    const { data: newItem, error: insertError } = await supabase
      .from('shopping_list')
      .insert({
        user_id: user.id,
        item_name,
        quantity: quantity || '1',
        unit: unit || 'pcs',
        added_from,
        recipe_id: recipe_id || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding to shopping list:', insertError);
      return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
    }

    return NextResponse.json({ item: newItem, updated: false });
  } catch (error) {
    console.error('POST /api/shopping-list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/shopping-list - Remove item(s) from shopping list
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');
    const all = searchParams.get('all');

    const query = supabase
      .from('shopping_list')
      .delete()
      .eq('user_id', user.id);

    if (all === 'true') {
      // Delete ALL items for this user
      // No extra filter needed, just execute
      const { error: deleteError } = await query;
      if (deleteError) throw deleteError;
    } else if (ids) {
      // Delete multiple IDs
      const idList = ids.split(',').filter(Boolean);
      if (idList.length > 0) {
        const { error: deleteError } = await query.in('id', idList);
        if (deleteError) throw deleteError;
      }
    } else if (id) {
      // Delete single ID (legacy support / single item click)
      const { error: deleteError } = await query.eq('id', id);
      if (deleteError) throw deleteError;
    } else {
      return NextResponse.json({ error: 'Missing id, ids, or all param' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/shopping-list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
