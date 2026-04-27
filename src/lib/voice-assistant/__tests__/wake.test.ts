import { describe, expect, it } from 'vitest';
import { parseWakePhrase, resolveWakeModeFromEnv, shouldRequireWakeWord } from '@/lib/voice-assistant/wake';

describe('wake phrase parsing', () => {
  it('detects hey nosh and strips wake phrase', () => {
    const out = parseWakePhrase('Hey Nosh what ingredients are expiring soon?');
    expect(out.detected).toBe(true);
    expect(out.wakePhrase).toBe('hey nosh');
    expect(out.query.toLowerCase()).toBe('what ingredients are expiring soon');
  });

  it('returns not detected when wake phrase missing', () => {
    const out = parseWakePhrase('what ingredients are expiring soon');
    expect(out.detected).toBe(false);
    expect(out.query).toBe('what ingredients are expiring soon');
  });
});

describe('wake mode from env', () => {
  it('defaults to push-to-talk when not configured', () => {
    expect(resolveWakeModeFromEnv({} as NodeJS.ProcessEnv)).toBe('push-to-talk');
    expect(shouldRequireWakeWord({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it('supports always-on mode', () => {
    const env = { HEYNOSH_WAKE_MODE: 'always-on' } as NodeJS.ProcessEnv;
    expect(resolveWakeModeFromEnv(env)).toBe('always-on');
    expect(shouldRequireWakeWord(env)).toBe(true);
  });

  it('allows explicit override with HEYNOSH_REQUIRE_WAKE_WORD', () => {
    const env = {
      HEYNOSH_WAKE_MODE: 'push-to-talk',
      HEYNOSH_REQUIRE_WAKE_WORD: 'true',
    } as NodeJS.ProcessEnv;
    expect(resolveWakeModeFromEnv(env)).toBe('push-to-talk');
    expect(shouldRequireWakeWord(env)).toBe(true);
  });
});
