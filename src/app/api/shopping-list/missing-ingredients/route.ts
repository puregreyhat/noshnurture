/**
 * API route to detect missing ingredients for a recipe
 * Compares recipe ingredients with user's inventory
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeIngredientName } from '@/lib/ingredients/normalize';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipeId, recipeIngredients } = body;

    if (!recipeIngredients || !Array.isArray(recipeIngredients)) {
      return NextResponse.json(
        { error: 'recipeIngredients array is required' },
        { status: 400 }
      );
    }

    // Fetch user's current inventory (non-consumed items)
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('product_name, tags, quantity')
      .eq('user_id', user.id)
      .eq('is_consumed', false);

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    // Build set of canonical ingredient names user has
    const userIngredients = new Set<string>();
    
    for (const item of inventoryItems || []) {
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const canonical = tags.find((t: unknown) => 
        typeof t === 'string' && t.startsWith('canonical:')
      )?.toString().replace(/^canonical:/, '');

      if (canonical) {
        userIngredients.add(canonical.toLowerCase());
      } else {
        try {
          const normalized = await normalizeIngredientName(String(item.product_name || ''));
          userIngredients.add(normalized.toLowerCase());
        } catch {
          // Skip if normalization fails
        }
      }
    }

    // Check which recipe ingredients are missing
    const missingIngredients: Array<{
      name: string;
      normalized: string;
    }> = [];

    for (const ingredient of recipeIngredients) {
      const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name || '';
      if (!ingredientName) continue;

      try {
        const normalized = await normalizeIngredientName(ingredientName);
        if (!userIngredients.has(normalized.toLowerCase())) {
          missingIngredients.push({
            name: ingredientName,
            normalized,
          });
        }
      } catch {
        // If normalization fails, assume it's missing
        missingIngredients.push({
          name: ingredientName,
          normalized: ingredientName,
        });
      }
    }

    return NextResponse.json({
      recipeId,
      totalIngredients: recipeIngredients.length,
      missingCount: missingIngredients.length,
      missing: missingIngredients,
    });

  } catch (error) {
    console.error('POST /api/shopping-list/missing-ingredients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
