"use client";

import * as tf from '@tensorflow/tfjs';

let model: tf.LayersModel | null = null;

export async function isLocalModelAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/models/recipe_rnn/model.json', { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loadLocalModel(): Promise<boolean> {
  try {
    if (model) return true;
    const available = await isLocalModelAvailable();
    if (!available) return false;
    model = await tf.loadLayersModel('/models/recipe_rnn/model.json');
    return true;
  } catch {
    model = null;
    return false;
  }
}

// NOTE: Real generation requires the same tokenizer/vocab used during training.
// This stub returns null to indicate that without a vocab we cannot generate reliably.
// Once vocab.json (with char -> index mapping) is provided under /models/recipe_rnn/vocab.json,
// we can implement proper sampling.
export async function generateLocalRecipe(_prompt: string): Promise<string | null> {
  const ok = await loadLocalModel();
  if (!ok) return null;
  try {
    const vocabRes = await fetch('/models/recipe_rnn/vocab.json');
    if (!vocabRes.ok) return null; // no vocab => skip
    // const vocab = await vocabRes.json();
    // TODO: implement sampling using vocab + model.predict
    // For now, return null so UI can fall back gracefully
    return null;
  } catch {
    return null;
  }
}
