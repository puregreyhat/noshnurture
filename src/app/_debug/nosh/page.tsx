'use client';

import { useState } from 'react';

const EXPIRY_PHRASES = [
  'What items in my inventory are going to expire this week?',
  'Can you list all products that will expire within this week?',
  'Which of my stored items have expiry dates falling this week?',
  'Show me the products that are set to expire this week.',
  'Are there any items approaching their expiry date this week?',
  'Tell me which products are nearing expiration in the next seven days.',
  'What all things do I have that expire sometime this week?',
  'Which groceries or products should I consume before the week ends?',
  'Do I have any items that will go bad this week?',
  'Which items are due to expire over the upcoming week?'
];

const COOK_TODAY_PHRASES = [
  'What can I cook today with what I have?',
  'Suggest a dish I can make right now.',
  'What should I prepare for today’s meal?',
  'Based on my ingredients, what can I make today?',
  'Give me some recipe ideas for today.',
  'What’s a good thing to cook today?',
  'Tell me what I can whip up today.',
  'What meal options do I have for today?',
  'Any suggestions on what I could cook right now?',
  'What can I prepare using the items in my kitchen today?'
];

export default function NoshDebugPage() {
  const [intentJson, setIntentJson] = useState<any>(null);
  const [resultJson, setResultJson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPhrase = async (phrase: string) => {
    try {
      setLoading(true); setError(null);
      setIntentJson(null); setResultJson(null);

      // 1) Deterministic intent
      const ires = await fetch('/api/voice-assistant/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: phrase })
      });
      const intent = await ires.json();
      setIntentJson(intent);

      // 2) Data query
      const qres = await fetch('/api/voice-assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intent.intent, parameters: intent.parameters })
      });
      const data = await qres.json();
      setResultJson(data);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ title, phrases }: { title: string; phrases: string[] }) => (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {phrases.map((p, idx) => (
          <button
            key={idx}
            onClick={() => runPhrase(p)}
            className="text-left p-3 rounded-lg border hover:bg-gray-50"
          >{p}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 space-y-6">
      <h1 className="text-3xl font-bold">Hey Nosh QA Panel</h1>
      <p className="text-gray-600">Click any phrase to run deterministic intent → query → result. All equivalent phrasings return identical results.</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Expiring This Week" phrases={EXPIRY_PHRASES} />
        <Section title="What Can I Cook Today" phrases={COOK_TODAY_PHRASES} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-2xl shadow p-6 overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Detected Intent</h2>
          {intentJson ? (
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(intentJson, null, 2)}</pre>
          ) : (
            <p className="text-gray-500 text-sm">No intent yet</p>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow p-6 overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Result Data</h2>
          {loading && <p className="text-purple-600">Loading…</p>}
          {error && <p className="text-red-600">{error}</p>}
          {resultJson ? (
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(resultJson, null, 2)}</pre>
          ) : (
            <p className="text-gray-500 text-sm">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
