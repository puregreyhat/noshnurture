"use client";
// Optional semantic similarity using TFJS + Universal Sentence Encoder (browser-only)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useModel: any | null = null;

async function ensureUseLoaded() {
  if (useModel) return useModel;
  // dynamic imports so this stays out of the default bundle/SSR
  const use = await import("@tensorflow-models/universal-sentence-encoder");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useModel = await (use as any).load();
  return useModel;
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export async function findClosestByEmbedding(query: string, candidates: string[]): Promise<string | null> {
  try {
    const model = await ensureUseLoaded();
    const embeddings = await model.embed([query, ...candidates]);
    const array = (await embeddings.array()) as number[][];
    const q = array[0];
    let bestScore = -Infinity;
    let bestIndex = -1;
    for (let i = 0; i < candidates.length; i++) {
      const score = cosineSim(q, array[i + 1]);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return bestIndex >= 0 ? candidates[bestIndex] : null;
  } catch {
    // If model fails to load (e.g., older browsers), degrade gracefully
    return null;
  }
}
