/**
 * Content Curator — Model preferences (localStorage).
 * API key storage has been moved to curator-keys.ts.
 */

import { DEFAULT_GEMINI_MODEL } from "./types";

const CURATOR_MODEL_KEY = "curator_gemini_model";

export function getCuratorModel(): string {
  if (typeof window === "undefined") return DEFAULT_GEMINI_MODEL;
  return localStorage.getItem(CURATOR_MODEL_KEY) ?? DEFAULT_GEMINI_MODEL;
}

export function setCuratorModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURATOR_MODEL_KEY, model);
}
