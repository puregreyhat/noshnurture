/**
 * API Route for Hey Nosh Voice Assistant
 * Handles query processing and data fetching
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { intent, parameters } = body;

    let responseData = null;

    switch (intent) {
      case 'get_expiring_items': {
        // Calculate days threshold
        const days = parameters?.days ?? 7;

        // Fetch items (we'll compute days dynamically from expiry_date)
        const { data: rows, error } = await supabase
          .from('inventory_items')
          .select('id, product_name, expiry_date, quantity, unit')
          .eq('user_id', user.id)
          .eq('is_consumed', false);

        if (error) {
          return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
        }

        const computed = (rows || [])
          .map((r) => ({
            id: r.id,
            product_name: r.product_name,
            expiry_date: r.expiry_date,
            quantity: r.quantity,
            unit: r.unit,
            computed_days_until_expiry: r.expiry_date ? daysUntil(String(r.expiry_date)) : 9999,
          }))
          .filter((r) => r.computed_days_until_expiry >= 0 && r.computed_days_until_expiry <= days)
          .sort((a, b) => a.computed_days_until_expiry - b.computed_days_until_expiry);

        responseData = computed;
        break;
      }

      case 'get_makeable_recipes': {
        // Call the real recipes engine endpoint with user's cookies for auth
        const urlObj = new URL(request.url);
        const originHdr = (request.headers.get('origin') || '').replace(/\/$/, '');
        const siteFromUrl = `${urlObj.protocol}//${urlObj.host}`;
        const siteUrl = originHdr || siteFromUrl || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
        const url = `${siteUrl}/api/recipes/suggestions?source=sugran&all=false`;

        const r = await fetch(url, {
          headers: {
            // Forward cookies to maintain session and user context
            cookie: request.headers.get('cookie') || '',
          },
          // Reasonable timeout via AbortController if needed (omitted for brevity)
        });

        if (!r.ok) {
          // Fallback gracefully with empty list to keep deterministic behavior
          responseData = [];
          break;
        }
        const data = await r.json();
        const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
        responseData = suggestions;
        break;
      }

      case 'get_cuisine_recipes': {
        const cuisine = parameters?.cuisine?.toLowerCase() || '';
        
        // Mock cuisine-specific recipes
        const cuisineRecipes: Record<string, any[]> = {
          indian: [
            { id: '1', title: 'Butter Chicken', cuisine: 'Indian' },
            { id: '2', title: 'Paneer Tikka', cuisine: 'Indian' },
          ],
          italian: [
            { id: '3', title: 'Margherita Pizza', cuisine: 'Italian' },
            { id: '4', title: 'Carbonara Pasta', cuisine: 'Italian' },
          ],
          chinese: [
            { id: '5', title: 'Fried Rice', cuisine: 'Chinese' },
            { id: '6', title: 'Sweet and Sour Chicken', cuisine: 'Chinese' },
          ],
        };

        responseData = cuisineRecipes[cuisine] || [];
        break;
      }

      case 'get_inventory': {
        const { data: rows, error } = await supabase
          .from('inventory_items')
          .select('id, product_name, category, quantity, unit, expiry_date')
          .eq('user_id', user.id)
          .eq('is_consumed', false)
          .limit(50);

        if (error) {
          return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
        }

        const items = (rows || [])
          .map((r) => ({
            id: r.id,
            product_name: r.product_name,
            category: r.category,
            quantity: r.quantity,
            unit: r.unit,
            expiry_date: r.expiry_date,
            computed_days_until_expiry: r.expiry_date ? daysUntil(String(r.expiry_date)) : 9999,
          }))
          .sort((a, b) => a.computed_days_until_expiry - b.computed_days_until_expiry);

        responseData = items;
        break;
      }

      case 'smalltalk':
      default:
        responseData = null;
        break;
    }

    return NextResponse.json({ data: responseData });

  } catch (error) {
    console.error('Voice assistant API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
