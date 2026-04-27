export type WakeMode = 'always-on' | 'push-to-talk';

export interface WakeParseResult {
  detected: boolean;
  wakePhrase: string | null;
  query: string;
}

const WAKE_PATTERNS: ReadonlyArray<{ label: string; regex: RegExp }> = [
  { label: 'hey nosh', regex: /\bhey\s+nosh\b/i },
  { label: 'hi nosh', regex: /\bhi\s+nosh\b/i },
  { label: 'hello nosh', regex: /\bhello\s+nosh\b/i },
  { label: 'ok nosh', regex: /\bok(?:ay)?\s+nosh\b/i },
];

function cleanSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function normalizeSpeechText(text: string): string {
  return cleanSpaces(String(text || ''));
}

export function parseWakePhrase(rawText: string): WakeParseResult {
  const normalized = normalizeSpeechText(rawText);

  if (!normalized) {
    return { detected: false, wakePhrase: null, query: '' };
  }

  for (const item of WAKE_PATTERNS) {
    const match = item.regex.exec(normalized);
    if (!match || match.index < 0) continue;

    const before = normalized.slice(0, match.index).trim();
    const after = normalized.slice(match.index + match[0].length);
    const merged = `${before} ${after}`
      .replace(/[,:;.!?]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      detected: true,
      wakePhrase: item.label,
      query: merged,
    };
  }

  return {
    detected: false,
    wakePhrase: null,
    query: normalized,
  };
}

export function resolveWakeModeFromEnv(env = process.env): WakeMode {
  const wakeMode = String(env.HEYNOSH_WAKE_MODE || '').trim().toLowerCase();
  if (wakeMode === 'always-on' || wakeMode === 'always_on' || wakeMode === 'wake-word') {
    return 'always-on';
  }
  if (wakeMode === 'push-to-talk' || wakeMode === 'push_to_talk' || wakeMode === 'button') {
    return 'push-to-talk';
  }
  return 'push-to-talk';
}

export function shouldRequireWakeWord(env = process.env): boolean {
  const explicit = String(env.HEYNOSH_REQUIRE_WAKE_WORD || '').trim().toLowerCase();
  if (explicit === 'true' || explicit === '1' || explicit === 'yes') return true;
  if (explicit === 'false' || explicit === '0' || explicit === 'no') return false;
  return resolveWakeModeFromEnv(env) === 'always-on';
}
