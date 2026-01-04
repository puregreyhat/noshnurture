/**
 * Deterministic Intent Router for manual testing
 * POST { text: string }
 * Returns a stable intent JSON (no AI involved)
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const q = String(text || '').trim().toLowerCase();

    // Helper: does the query contain any of the phrases
    const has = (phrases: string[]) => phrases.some((p) => q.includes(p));

    // Expiring this week synonyms
    const weekPhrases = [
      'this week',
      'the week',
      'upcoming week',
      'next seven days',
      'next 7 days',
      'before the week ends',
      'go bad this week',
      'expire this week',
      'expiring this week',
      'nearing expiration in the next seven days',
      'approaching their expiry date this week',
    ];

    // Cooking today synonyms
    const cookTodayPhrases = [
      'cook today',
      "today's meal",
      'make today',
      'today',
      'right now',
      'whip up today',
      'prepare for today',
      'meal options for today',
    ];

    // Decide intent deterministically
    if (
      has(['expire', 'expiring', 'expiry']) && has(weekPhrases) ||
      has(['expire this week', 'expiring this week', 'go bad this week'])
    ) {
      return NextResponse.json({
        intent: 'get_expiring_items',
        parameters: { days: 7, timeframe: 'this_week' },
        confidence: 1.0,
      });
    }

    if (
      (has(['what can i cook', 'suggest a dish', 'recipe ideas', 'what should i prepare', 'what can i make']) && has(['today'])) ||
      has(cookTodayPhrases)
    ) {
      return NextResponse.json({
        intent: 'get_makeable_recipes',
        parameters: { timeframe: 'today' },
        confidence: 1.0,
      });
    }

    // Fallbacks
    if (has(['inventory', 'what do i have', 'what i have'])) {
      return NextResponse.json({ intent: 'get_inventory', parameters: {}, confidence: 0.9 });
    }

    return NextResponse.json({ intent: 'smalltalk', parameters: {}, confidence: 0.5 });
  } catch (err) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
