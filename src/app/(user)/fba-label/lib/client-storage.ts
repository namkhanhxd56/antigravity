/**
 * FBA Label Local Storage
 * 
 * Manages API keys and settings specifically for the FBA Label tool.
 */

const LEGACY_KEY = "gemini_api_key_v1";
const FBA_API_KEY = "fba_gemini_api_key";

export function getFbaApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FBA_API_KEY) ?? localStorage.getItem(LEGACY_KEY);
}

export function setFbaApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  trimmed ? localStorage.setItem(FBA_API_KEY, trimmed) : localStorage.removeItem(FBA_API_KEY);
}

export function removeFbaApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FBA_API_KEY);
}
