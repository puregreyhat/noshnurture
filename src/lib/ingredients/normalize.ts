import { CANONICAL_INGREDIENTS } from "./canonical";
import { SYNONYMS } from "./synonyms";

// Basic Levenshtein distance
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/\u2019|\u2018|\u2032|\u02bc/g, "'") // smart quotes to ascii
    .replace(/'s\b/g, "") // possessive
    .replace(/[^a-z0-9\s]/g, " ") // remove non-alphanum
    .replace(/\s+/g, " ")
    .trim();
}

function applySynonyms(token: string): string {
  if (SYNONYMS[token]) return SYNONYMS[token];
  return token;
}

function tokensToCandidate(tokens: string[]): string | null {
  // pick a token that is likely the ingredient head (heuristic: last or most specific)
  if (tokens.length === 0) return null;
  // try full join first
  const joined = tokens.join(" ");
  if (CANONICAL_INGREDIENTS.includes(joined)) return joined;
  // Prefer the first meaningful token (skip size/descriptor words like 'medium', 'optional')
  const descriptors = new Set([
    'small','medium','large','optional','fresh','ripe','chopped','diced','sliced','thinly','grated','ground','minced','crushed','to','taste','soft','dinner','pieces','piece'
  ]);

  // First, try to find a token that is already a canonical ingredient or has a synonym
  for (const t of tokens) {
    if (descriptors.has(t)) continue;
    if (CANONICAL_INGREDIENTS.includes(t)) return t;
  }
  // Next, try synonyms mapping (so words like 'chilli' -> 'chili')
  for (const t of tokens) {
    if (descriptors.has(t)) continue;
    // lazy import of SYNONYMS to avoid circular issues
    try {
      // require because this is JS/TS mixing context in build
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SYNONYMS } = require('./synonyms');
      if (SYNONYMS && SYNONYMS[t]) return SYNONYMS[t];
    } catch {
      // ignore
    }
  }

  // Fallback: return the longest non-descriptor token (likely the most specific)
  const nonDesc = tokens.filter(t => !descriptors.has(t));
  if (nonDesc.length > 0) return nonDesc.reduce((a, b) => (a.length >= b.length ? a : b));
  // ultimate fallback
  return tokens[0] || tokens[tokens.length - 1];
}

function findClosestByFuzzy(name: string, maxDistance = 2): { item: string; score: number } | null {
  let best: { item: string; score: number } | null = null;
  for (const cand of CANONICAL_INGREDIENTS) {
    const d = levenshtein(name, cand);
    if (best === null || d < best.score) best = { item: cand, score: d };
  }
  if (best && best.score <= maxDistance) return best;
  return null;
}

export type NormalizeOptions = {
  prefer?: "fuzzy" | "semantic";
};

export async function normalizeIngredientName(raw: string, opts?: NormalizeOptions): Promise<string> {
  const text = normalizeText(raw);
  // split and apply synonyms
  const tokens = text.split(" ").map(applySynonyms).filter(Boolean);
  const candidate = tokensToCandidate(tokens) ?? text;

  // exact match
  if (CANONICAL_INGREDIENTS.includes(candidate)) return candidate;

  // synonym direct map on full string
  if (SYNONYMS[text]) return SYNONYMS[text];

  // fuzzy first
  const fuzzy = findClosestByFuzzy(candidate);
  if (fuzzy) return fuzzy.item;

  // optional semantic
  if (opts?.prefer === "semantic") {
    try {
      const { findClosestByEmbedding } = await import("./semantic");
  const semantic = await findClosestByEmbedding(text, Array.from(CANONICAL_INGREDIENTS));
      if (semantic) return semantic;
    } catch {
      // ignore semantic failure
    }
  }

  // fallback: return cleaned candidate
  return candidate;
}

// Return canonical plus a fuzzy score/method to help UI show confidence
export async function normalizeIngredientNameWithScore(raw: string, opts?: NormalizeOptions): Promise<{
  canonical: string;
  distance: number | null;
  method: 'exact' | 'synonym' | 'fuzzy' | 'semantic' | 'fallback';
}> {
  const text = normalizeText(raw);
  const tokens = text.split(" ").map(applySynonyms).filter(Boolean);
  const candidate = tokensToCandidate(tokens) ?? text;

  if (CANONICAL_INGREDIENTS.includes(candidate)) {
    return { canonical: candidate, distance: 0, method: 'exact' };
  }

  if (SYNONYMS[text]) {
    return { canonical: SYNONYMS[text], distance: 0, method: 'synonym' };
  }

  const fuzzy = findClosestByFuzzy(candidate, 10);
  if (fuzzy) return { canonical: fuzzy.item, distance: fuzzy.score, method: 'fuzzy' };

  if (opts?.prefer === 'semantic') {
    try {
      const { findClosestByEmbedding } = await import('./semantic');
      const semantic = await findClosestByEmbedding(text, Array.from(CANONICAL_INGREDIENTS));
      if (semantic) return { canonical: semantic, distance: null, method: 'semantic' };
    } catch {
      // ignore semantic failure
    }
  }

  return { canonical: candidate, distance: null, method: 'fallback' };
}

export { levenshtein };
