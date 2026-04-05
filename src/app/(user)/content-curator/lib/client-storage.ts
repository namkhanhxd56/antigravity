/**
 * Content Curator — Model preferences (localStorage).
 * API key storage has been moved to curator-keys.ts.
 */

const CURATOR_MODEL_KEY = "curator_gemini_model";

export function getCuratorModel(): string {
  if (typeof window === "undefined") return "gemini-2.0-flash-exp";
  return localStorage.getItem(CURATOR_MODEL_KEY) ?? "gemini-2.0-flash-exp";
}

export function setCuratorModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURATOR_MODEL_KEY, model);
}
