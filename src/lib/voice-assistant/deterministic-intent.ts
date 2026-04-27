export type AssistantIntent =
  | 'get_expiring_items'
  | 'get_makeable_recipes'
  | 'get_inventory'
  | 'smalltalk';

export interface DeterministicIntent {
  intent: AssistantIntent;
  parameters: {
    days?: number;
    timeframe?: string;
  };
  confidence: number;
}

function hasAny(query: string, phrases: ReadonlyArray<string>): boolean {
  return phrases.some((p) => query.includes(p));
}

function extractDays(query: string): number | null {
  const m = query.match(/\bnext\s+(\d{1,2})\s+days\b|\bin\s+(\d{1,2})\s+days\b/i);
  if (!m) return null;
  const val = Number(m[1] || m[2]);
  if (!Number.isFinite(val)) return null;
  return Math.max(1, Math.min(30, Math.floor(val)));
}

export function resolveDeterministicIntent(text: string): DeterministicIntent {
  const q = String(text || '').trim().toLowerCase();

  const isExpiring =
    hasAny(q, ['expire', 'expiring', 'expiry', 'going bad', 'go bad', 'spoil', 'expiring soon']) ||
    (hasAny(q, ['what']) && hasAny(q, ['expiring', 'expired']));

  if (isExpiring) {
    if (hasAny(q, ['today'])) {
      return {
        intent: 'get_expiring_items',
        parameters: { days: 0, timeframe: 'today' },
        confidence: 0.98,
      };
    }

    if (hasAny(q, ['tomorrow'])) {
      return {
        intent: 'get_expiring_items',
        parameters: { days: 1, timeframe: 'tomorrow' },
        confidence: 0.98,
      };
    }

    const parsedDays = extractDays(q);
    if (parsedDays !== null) {
      return {
        intent: 'get_expiring_items',
        parameters: { days: parsedDays, timeframe: `next_${parsedDays}_days` },
        confidence: 0.97,
      };
    }

    if (hasAny(q, ['this week', 'next 7 days', 'upcoming week'])) {
      return {
        intent: 'get_expiring_items',
        parameters: { days: 7, timeframe: 'this_week' },
        confidence: 0.98,
      };
    }

    return {
      intent: 'get_expiring_items',
      parameters: { days: 7, timeframe: 'soon' },
      confidence: 0.95,
    };
  }

  const isRecipe = hasAny(q, [
    'what can i cook',
    'recipe ideas',
    'suggest a dish',
    'what can i make',
    'what should i prepare',
    'recipes can i make',
    'cook',
    'recipe',
    'make with',
  ]);

  if (isRecipe) {
    return {
      intent: 'get_makeable_recipes',
      parameters: { timeframe: hasAny(q, ['today', 'right now']) ? 'today' : 'anytime' },
      confidence: 0.95,
    };
  }

  const isInventory = hasAny(q, [
    'inventory',
    'what do i have',
    'what i have',
    'in my fridge',
    'in my pantry',
    'do i have',
    'ingredients i have',
    'stock',
  ]);

  if (isInventory) {
    return {
      intent: 'get_inventory',
      parameters: {},
      confidence: 0.92,
    };
  }

  return {
    intent: 'smalltalk',
    parameters: {},
    confidence: 0.55,
  };
}
