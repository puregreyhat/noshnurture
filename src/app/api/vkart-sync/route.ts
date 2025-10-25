import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enhanceProductData, QRProduct, parseMeasure } from '@/lib/productUtils';

export const revalidate = 0;

function getErrorMessage(e: unknown): string {
  if (!e) return '';
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

const DEFAULT_VKART_BASE = 'http://localhost:3001';

function mapStatus(days: number) {
  if (days < 0) return 'expired';
  if (days <= 3) return 'warning';
  if (days <= 7) return 'caution';
  return 'fresh';
}

async function fetchVkartOrders(email: string, updated_since?: string) {
  const base = process.env.VKART_BASE_URL || DEFAULT_VKART_BASE;
  // Use POST for retrieval because the Vkart server's POST handler will
  // return matching orders for the supplied email regardless of whether
  // the server persists to an in-memory store or to Supabase. Some Vkart
  // deployments return empty results on GET when the server uses a DB.
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.VKART_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.VKART_API_KEY}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const body: { email: string; updated_since?: string } = { email };
    if (updated_since) body.updated_since = updated_since;

    const res = await fetch(new URL('/api/orders/sync', base).toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Vkart responded with ${res.status}`);
    const json = await res.json();
    return json.orders || [];
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

export async function POST() {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized or missing email' }, { status: 401 });
    }

    const email = user.email;

    // Read last sync timestamp for this user (if any) so we can fetch only new/updated orders.
    let updated_since: string | undefined = undefined;
    try {
      const { data: syncRow, error: syncErr } = await supabaseServer
        .from('vkart_sync')
        .select('last_synced_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!syncErr && syncRow && syncRow.last_synced_at) {
        updated_since = syncRow.last_synced_at as string;
      }
    } catch (e) {
      // If the table doesn't exist or query fails, we'll ignore and fetch all orders.
      console.warn('[vkart-sync] Could not read last sync timestamp:', (e as Error).message);
    }

    const orders = await fetchVkartOrders(email, updated_since);

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ imported: 0, updated: 0, skipped: 0, errors: [], count: 0 });
    }

    const results = { imported: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (const order of orders) {
      const orderId = order.orderId || order.order_id || '';
      const orderDate = order.orderDate || order.order_date || new Date().toISOString();
      const products = Array.isArray(order.products) ? order.products : [];

      for (const p of products) {
        // Normalize incoming product shape to QRProduct
        // Try to capture any measure/weight info if present in the incoming product
        const rawName = String(p.name || p.product_name || 'Unknown Product');
        const rawExpiry = String(p.expiryDate || p.expiry_date || p.expiry || new Date().toISOString());
        const rawQty = Number(p.quantity || p.qty || 1);
        // Possible fields that may contain weight/volume info: weight, size, weightLabel, volume
        const weightStr = p.weight || p.weight_label || p.size || p.volume || p.weightLabel || null;
        const parsedMeasure = parseMeasure(String(weightStr || ''));

        const qr: QRProduct = {
          name: rawName,
          expiryDate: rawExpiry,
          quantity: rawQty,
          category: String(p.category || 'other'),
          measure: parsedMeasure ?? undefined,
        };

        const enhanced = enhanceProductData(qr);

        const userId = user.id;

        // Prepare DB row
        const dbRow = {
          user_id: userId,
          order_id: orderId,
          order_date: orderDate,
          product_name: enhanced.name,
          category: enhanced.category || 'other',
          quantity: enhanced.quantity,
          unit: enhanced.unit,
          expiry_date: enhanced.expiryDate,
          days_until_expiry: enhanced.daysUntilExpiry,
          status: mapStatus(enhanced.daysUntilExpiry),
          storage_type: enhanced.storageType,
          tags: enhanced.tags,
          common_uses: enhanced.commonUses,
          is_consumed: false,
          consumed_date: null,
        };

        try {
          // Check for existing matching product.
          // Prefer deduping by order_id when available (prevents re-importing the same Vkart order).
          let existing: { id?: string; quantity?: number } | null = null;
          let selectErr: unknown = null;

          if (orderId) {
            const resp = await supabaseServer
              .from('inventory_items')
              .select('id, quantity')
              .eq('user_id', userId)
              .eq('product_name', enhanced.name)
              .eq('is_consumed', false)
              .eq('order_id', orderId)
              .limit(1)
              .maybeSingle();
            existing = resp.data as { id?: string; quantity?: number } | null;
            selectErr = resp.error as unknown;
          } else {
            const resp = await supabaseServer
              .from('inventory_items')
              .select('id, quantity')
              .eq('user_id', userId)
              .eq('product_name', enhanced.name)
              .eq('is_consumed', false)
              .eq('expiry_date', enhanced.expiryDate)
              .limit(1)
              .maybeSingle();
            existing = resp.data as { id?: string; quantity?: number } | null;
            selectErr = resp.error as unknown;
          }

          if (selectErr) {
            results.errors.push(`Select error for ${enhanced.name}: ${getErrorMessage(selectErr)}`);
            continue;
          }

          if (existing && existing.id) {
            // Update existing quantity
            const newQty = Number(existing.quantity || 0) + Number(enhanced.quantity || 0);
            const { error: updateErr } = await supabaseServer
              .from('inventory_items')
              .update({ quantity: newQty })
              .eq('id', existing.id);

            if (updateErr) {
              results.errors.push(`Update failed for ${enhanced.name}: ${updateErr.message}`);
            } else {
              results.updated += 1;
            }
          } else {
            const { error: insertErr } = await supabaseServer.from('inventory_items').insert([dbRow]);
            if (insertErr) {
              results.errors.push(`Insert failed for ${enhanced.name}: ${insertErr.message}`);
            } else {
              results.imported += 1;
            }
          }
        } catch (e) {
          const err = e as Error;
          results.errors.push(`Exception importing ${enhanced.name}: ${err.message}`);
        }
      }
    }

    // If we imported/processed any orders, update the last_synced_at timestamp for this user.
    try {
      const now = new Date().toISOString();
      await supabaseServer
        .from('vkart_sync')
        .upsert({ user_id: user.id, last_synced_at: now }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('[vkart-sync] Could not update last sync timestamp:', (e as Error).message);
    }

    return NextResponse.json({ ...results, count: orders.length });
  } catch (e) {
    const err = e as Error;
    console.error('[vkart-sync] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
