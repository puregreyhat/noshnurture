/**
 * Deterministic Intent Router for manual testing
 * POST { text: string }
 * Returns a stable intent JSON (no AI involved)
 */

import { NextResponse } from 'next/server';
import { resolveDeterministicIntent } from '@/lib/voice-assistant/deterministic-intent';
import { parseWakePhrase, shouldRequireWakeWord } from '@/lib/voice-assistant/wake';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const wakeRequired = shouldRequireWakeWord();
    const parsed = parseWakePhrase(String(text || ''));

    if (wakeRequired && !parsed.detected) {
      return NextResponse.json(
        {
          error: 'Wake word not detected',
          message: 'Say Hey Nosh before your command.',
          wakeDetected: false,
          wakeRequired,
        },
        { status: 428 }
      );
    }

    const intent = resolveDeterministicIntent(parsed.query || String(text || ''));
    const response = {
      ...intent,
      wakeDetected: parsed.detected,
      wakeRequired,
    };

    console.log('HeyNosh Intent Router:', response);
    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
