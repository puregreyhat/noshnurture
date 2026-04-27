import { describe, expect, it } from 'vitest';
import { resolveDeterministicIntent } from '@/lib/voice-assistant/deterministic-intent';

describe('resolveDeterministicIntent', () => {
  it('maps expiring soon query to get_expiring_items', () => {
    const intent = resolveDeterministicIntent('what ingredients are expiring soon?');
    expect(intent.intent).toBe('get_expiring_items');
    expect(intent.parameters.days).toBe(7);
  });

  it('parses specific day windows', () => {
    const intent = resolveDeterministicIntent('what expires in next 3 days');
    expect(intent.intent).toBe('get_expiring_items');
    expect(intent.parameters.days).toBe(3);
  });

  it('maps recipe query', () => {
    const intent = resolveDeterministicIntent('what can i cook today');
    expect(intent.intent).toBe('get_makeable_recipes');
  });

  it('maps inventory query', () => {
    const intent = resolveDeterministicIntent('what do i have in my pantry');
    expect(intent.intent).toBe('get_inventory');
  });
});
