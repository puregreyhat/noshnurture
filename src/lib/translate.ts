// Simplified stubbed translation module
// The project previously used external translation services (Sarvam AI, LibreTranslate, Anuvadak, etc.).
// To remove translation from the product and avoid runtime errors, this file implements no-op
// translation functions that simply return the original English text. Keeping the same
// function signatures prevents runtime import errors across the codebase.

import type { Language } from './translations';

export type TranslationProvider = 'disabled';

export function getPreferredProvider(): TranslationProvider | null {
  return 'disabled';
}

export function setPreferredProvider(_: TranslationProvider): void {
  // no-op
}

export async function translateText(text: string, _targetLanguage: Language): Promise<string> {
  // Translation removed — return original text
  return text;
}

export async function translateRecipeInstructions(
  instructions: string,
  _targetLanguage: Language,
): Promise<string> {
  return instructions;
}

export async function translateRecipeStep(step: string, _targetLanguage: Language): Promise<string> {
  return step;
}

export async function translateBatch(texts: string[], _targetLanguage: Language): Promise<string[]> {
  return texts;
}

