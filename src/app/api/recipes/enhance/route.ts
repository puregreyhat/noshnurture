import { NextResponse } from "next/server";

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || "";
const MODEL = "flax-community/t5-recipe-generation";
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const cache = new Map<string, { data: string; timestamp: number }>();

export async function POST(request: Request) {
  try {
    const { ingredients } = await request.json();
    
    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({ recipe: null });
    }

    // Check cache
    const cacheKey = `hf_${ingredients.sort().join(",")}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return NextResponse.json({ recipe: cached.data, cached: true });
    }

    // Only call HF if token present
    if (!HF_TOKEN) {
      return NextResponse.json({ recipe: null, message: "HF token not configured" });
    }

    const prompt = `Generate a recipe using: ${ingredients.join(", ")}`;
    
    const res = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt, parameters: { max_length: 512, temperature: 0.7 } }),
    });

    if (!res.ok) {
      console.error("HF API error:", res.status, await res.text());
      return NextResponse.json({ recipe: null, error: "HF API failed" });
    }

    const data = await res.json();
    const generated = data[0]?.generated_text || null;

    if (generated) {
      cache.set(cacheKey, { data: generated, timestamp: Date.now() });
    }

    return NextResponse.json({ recipe: generated });
  } catch (e) {
    console.error("HF route error:", e);
    const err = e as Error
    return NextResponse.json({ recipe: null, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
