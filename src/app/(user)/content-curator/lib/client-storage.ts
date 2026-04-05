/**
 * Content Curator Local Storage
 * 
 * Manages API keys and model selections specifically for the Content Curator.
 */

const LEGACY_KEY = "gemini_api_key_v1";
const CURATOR_API_KEY = "curator_gemini_api_key";
const CURATOR_VERTEX_API_KEY_LS = "curator_vertex_api_key";
const CURATOR_VERTEX_JSON_LS = "curator_vertex_ai_json";
const CURATOR_MODEL_KEY = "curator_gemini_model";

export function getCuratorApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURATOR_API_KEY) ?? localStorage.getItem(LEGACY_KEY);
}

export function setCuratorApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  trimmed ? localStorage.setItem(CURATOR_API_KEY, trimmed) : localStorage.removeItem(CURATOR_API_KEY);
}

export function removeCuratorApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURATOR_API_KEY);
}

export function getCuratorVertexApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURATOR_VERTEX_API_KEY_LS);
}

export function setCuratorVertexApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  trimmed ? localStorage.setItem(CURATOR_VERTEX_API_KEY_LS, trimmed) : localStorage.removeItem(CURATOR_VERTEX_API_KEY_LS);
}

export function getCuratorVertexJson(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURATOR_VERTEX_JSON_LS);
}

export function setCuratorVertexJson(json: string): void {
  if (typeof window === "undefined") return;
  const trimmed = json.trim();
  trimmed ? localStorage.setItem(CURATOR_VERTEX_JSON_LS, trimmed) : localStorage.removeItem(CURATOR_VERTEX_JSON_LS);
}

export function getCuratorModel(): string {
  if (typeof window === "undefined") return "gemini-2.0-flash-exp";
  return localStorage.getItem(CURATOR_MODEL_KEY) ?? "gemini-2.0-flash-exp";
}

export function setCuratorModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURATOR_MODEL_KEY, model);
}
