import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const inventory = Array.isArray(body.inventory) ? body.inventory : [];
    const limit = typeof body.limit === 'number' ? body.limit : 8;

    const SUGRAN = process.env.SUGRAN_URL || 'https://sugran.vercel.app';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(`${SUGRAN.replace(/\/$/, '')}/api/recipes/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory, limit }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      return NextResponse.json({ error: 'sugran error', detail: txt }, { status: 502 });
    }

    const j = await resp.json();
    return NextResponse.json({ source: 'sugran-proxy', results: j.results || [], count: j.count || 0 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'unknown' }, { status: 500 });
  }
}
