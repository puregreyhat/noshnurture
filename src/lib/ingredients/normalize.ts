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
  // return the last token as a fallback head
  return tokens[tokens.length - 1];
}

function findClosestByFuzzy(name: string, maxDistance = 2): string | null {
  let best: { item: string; score: number } | null = null;
  for (const cand of CANONICAL_INGREDIENTS) {
    const d = levenshtein(name, cand);
    if (best === null || d < best.score) best = { item: cand, score: d };
  }
  if (best && best.score <= maxDistance) return best.item;
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
  if (fuzzy) return fuzzy;

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
