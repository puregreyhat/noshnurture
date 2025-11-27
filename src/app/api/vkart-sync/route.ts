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

    const fetchUrl = new URL('/api/orders/sync', base).toString();
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Vkart responded with ${res.status} at ${fetchUrl}`);
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
    // To avoid missing orders that the user may have placed but failed to import within a
    // short window, we subtract a configurable window (default 24 hours) from the stored
    // `last_synced_at` when passing `updated_since` to the Vkart service. This lets us
    // re-fetch orders updated up to `VKART_SYNC_WINDOW_HOURS` before the stored timestamp.
    let updated_since: string | undefined = undefined;
    try {
      const { data: syncRow, error: syncErr } = await supabaseServer
        .from('vkart_sync')
        .select('last_synced_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!syncErr && syncRow && syncRow.last_synced_at) {
        // Default window is 24 hours; make it configurable via env var VKART_SYNC_WINDOW_HOURS
        const windowHours = Number(process.env.VKART_SYNC_WINDOW_HOURS ?? '24');
        try {
          const last = new Date(syncRow.last_synced_at as string);
          const adjusted = new Date(last.getTime() - windowHours * 60 * 60 * 1000);
          updated_since = adjusted.toISOString();
        } catch {
          // If parsing fails, fall back to raw stored timestamp
          updated_since = syncRow.last_synced_at as string;
        }
      }
    } catch (e) {
      // If the table doesn't exist or query fails, we'll ignore and fetch all orders.
      console.warn('[vkart-sync] Could not read last sync timestamp:', (e as Error).message);
    }

    let orders: unknown[] = [];
    try {
      orders = await fetchVkartOrders(email, updated_since);
    } catch (e) {
      const msg = getErrorMessage(e);
      console.error('[vkart-sync] Network error when fetching Vkart orders:', msg);
      return NextResponse.json({ error: `Failed to reach Vkart service: ${msg}. Please ensure VKART_BASE_URL is set to a reachable Vkart instance.` }, { status: 502 });
    }

    // If this is the first time syncing (no updated_since), avoid importing the user's entire
    // order history by default — most users only want their most recent order. Keep only the
    // latest order unless the caller specifically requested full history.
    if (!updated_since && Array.isArray(orders) && orders.length > 1) {
      console.log(`[vkart-sync] No previous sync; fetched ${orders.length} orders — importing only the most recent one by default.`);
      orders = (orders as unknown[]).slice(0, 1);
    }

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ imported: 0, updated: 0, skipped: 0, errors: [], count: 0 });
    }

    const results = { imported: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (const rawOrder of orders) {
      // Validate/normalize the incoming order shape (guard against unknown)
      const orderRec = (rawOrder as Record<string, unknown>) || {};
      const orderId = typeof orderRec['orderId'] === 'string' ? (orderRec['orderId'] as string)
        : typeof orderRec['order_id'] === 'string' ? (orderRec['order_id'] as string)
        : '';
      const orderDate = typeof orderRec['orderDate'] === 'string' ? (orderRec['orderDate'] as string)
        : typeof orderRec['order_date'] === 'string' ? (orderRec['order_date'] as string)
        : new Date().toISOString();
      const products = Array.isArray(orderRec['products']) ? (orderRec['products'] as unknown[]) : [];

      // If we already imported this order (any inventory row with the same order_id),
      // skip processing the whole order to avoid duplicates. This is a cheap check and
      // prevents re-import when `updated_since` was adjusted to a window that overlaps
      // previously-processed orders.
      try {
        if (orderId) {
          const { data: existing, error: existErr } = await supabaseServer
            .from('inventory_items')
            .select('id')
            .eq('user_id', user.id)
            .eq('order_id', orderId)
            .limit(1);

          if (!existErr && Array.isArray(existing) && existing.length > 0) {
            // Skip entire order
            results.skipped += products.length;
            continue;
          }
        }
      } catch (e) {
        // If the read fails for some reason, continue and attempt per-product dedupe below.
        console.warn('[vkart-sync] Could not check existing order_id for dedupe:', (e as Error).message);
      }

      for (const pItem of products) {
        // Normalize incoming product shape to QRProduct
        const prod = (pItem as Record<string, unknown>) || {};
        // Try to capture any measure/weight info if present in the incoming product
        const rawName = typeof prod['name'] === 'string' ? (prod['name'] as string)
          : typeof prod['product_name'] === 'string' ? (prod['product_name'] as string)
          : 'Unknown Product';
        const rawExpiry = typeof prod['expiryDate'] === 'string' ? (prod['expiryDate'] as string)
          : typeof prod['expiry_date'] === 'string' ? (prod['expiry_date'] as string)
          : typeof prod['expiry'] === 'string' ? (prod['expiry'] as string)
          : new Date().toISOString();
        const rawQty = typeof prod['quantity'] === 'number' ? (prod['quantity'] as number)
          : typeof prod['qty'] === 'number' ? (prod['qty'] as number)
          : 1;
        // Possible fields that may contain weight/volume info: weight, size, weightLabel, volume
        const weightCandidate = typeof prod['weight'] === 'string' ? (prod['weight'] as string)
          : typeof prod['weight_label'] === 'string' ? (prod['weight_label'] as string)
          : typeof prod['size'] === 'string' ? (prod['size'] as string)
          : typeof prod['volume'] === 'string' ? (prod['volume'] as string)
          : typeof prod['weightLabel'] === 'string' ? (prod['weightLabel'] as string)
          : null;
        const parsedMeasure = parseMeasure(String(weightCandidate || ''));

        const qr: QRProduct = {
          name: rawName,
          expiryDate: rawExpiry,
          quantity: rawQty,
          category: typeof prod['category'] === 'string' ? (prod['category'] as string) : 'other',
          measure: parsedMeasure ?? undefined,
        };

        const enhanced = enhanceProductData(qr);

        const { shouldIgnoreProduct } = await import('@/lib/ignoreList');
        if (shouldIgnoreProduct(enhanced.name, enhanced.tags)) {
          results.skipped += 1;
          continue; // skip inserting basic items like water
        }

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
            // No exact match found. As a last-resort, look for similar recent items with same
            // product_name (case-insensitive) and a close expiry date to avoid duplicates caused
            // by missing order_id or slightly different expiry formatting.
            const { data: candidates } = await supabaseServer
              .from('inventory_items')
              .select('id, quantity, expiry_date')
              .eq('user_id', userId)
              .ilike('product_name', enhanced.name)
              .eq('is_consumed', false)
              .limit(5);

            let matchedCandidate: { id?: string; quantity?: number; expiry_date?: string } | null = null;
            if (Array.isArray(candidates)) {
              const parseDate = (s?: string) => {
                try {
                  return s ? new Date(s) : null;
                } catch {
                  return null;
                }
              };

              const targetExpiry = parseDate(enhanced.expiryDate);
              for (const c of candidates) {
                const crec = c as Record<string, unknown> | null;
                const cExpiry = parseDate(crec && typeof crec['expiry_date'] === 'string' ? (crec['expiry_date'] as string) : undefined);
                if (cExpiry && targetExpiry) {
                  const diffDays = Math.abs(Math.floor((cExpiry.getTime() - targetExpiry.getTime()) / (1000 * 60 * 60 * 24)));
                  if (diffDays <= 3) {
                    matchedCandidate = {
                      id: (crec && typeof crec['id'] === 'string') ? (crec['id'] as string) : undefined,
                      quantity: (crec && typeof crec['quantity'] === 'number') ? (crec['quantity'] as number) : (crec && typeof crec['quantity'] === 'string' ? Number(crec['quantity']) : undefined),
                      expiry_date: (crec && typeof crec['expiry_date'] === 'string') ? (crec['expiry_date'] as string) : undefined,
                    };
                    break;
                  }
                }
              }
            }

            if (matchedCandidate && matchedCandidate.id) {
              // Merge into matched candidate
              const newQty = Number(matchedCandidate.quantity || 0) + Number(enhanced.quantity || 0);
              const { error: updateErr } = await supabaseServer
                .from('inventory_items')
                .update({ quantity: newQty })
                .eq('id', matchedCandidate.id);

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
