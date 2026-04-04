/**
 * Sticker Generator Local Storage
 * 
 * Manages API keys and model selections specifically for the Sticker Generator.
 */

const LEGACY_KEY = "gemini_api_key_v1";
const STICKER_API_KEY = "sticker_gemini_api_key";
const STICKER_VERTEX_API_KEY_LS = "sticker_vertex_api_key";
const STICKER_VERTEX_JSON_LS = "sticker_vertex_ai_json";
const STICKER_MODEL_KEY = "sticker_gemini_model";
const STICKER_ANALYSIS_MODEL_KEY = "sticker_analysis_model";
const STICKER_IMAGE_MODEL_KEY = "sticker_image_model";

export function getStickerApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STICKER_API_KEY) ?? localStorage.getItem(LEGACY_KEY);
}

export function setStickerApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  trimmed ? localStorage.setItem(STICKER_API_KEY, trimmed) : localStorage.removeItem(STICKER_API_KEY);
}

export function removeStickerApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STICKER_API_KEY);
}

export function getStickerVertexApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STICKER_VERTEX_API_KEY_LS);
}

export function setStickerVertexApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  trimmed ? localStorage.setItem(STICKER_VERTEX_API_KEY_LS, trimmed) : localStorage.removeItem(STICKER_VERTEX_API_KEY_LS);
}

export function getStickerVertexJson(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STICKER_VERTEX_JSON_LS);
}

export function setStickerVertexJson(json: string): void {
  if (typeof window === "undefined") return;
  const trimmed = json.trim();
  trimmed ? localStorage.setItem(STICKER_VERTEX_JSON_LS, trimmed) : localStorage.removeItem(STICKER_VERTEX_JSON_LS);
}

/**
 * Returns the highest-priority configured key from localStorage.
 * Priority mirrors server-side: Vertex JSON > Vertex API Key > Gemini AI Studio
 */
export function getStickerActiveKey(): string | null {
  if (typeof window === "undefined") return null;
  return (
    getStickerVertexJson() ||
    getStickerVertexApiKey() ||
    getStickerApiKey() ||
    null
  );
}

export function getStickerAnalysisModel(): string {
  if (typeof window === "undefined") return "gemini-2.0-flash";
  return localStorage.getItem(STICKER_ANALYSIS_MODEL_KEY) ?? "gemini-2.0-flash";
}

export function setStickerAnalysisModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STICKER_ANALYSIS_MODEL_KEY, model);
}

export function getStickerImageModel(): string {
  if (typeof window === "undefined") return "gemini-2.0-flash";
  return localStorage.getItem(STICKER_IMAGE_MODEL_KEY) ?? "gemini-2.0-flash";
}

export function setStickerImageModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STICKER_IMAGE_MODEL_KEY, model);
}

export function getStickerModel(): string {
  if (typeof window === "undefined") return "gemini-2.0-flash";
  return localStorage.getItem(STICKER_MODEL_KEY) ?? "gemini-2.0-flash";
}

export function setStickerModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STICKER_MODEL_KEY, model);
}

/** Returns all sticker keys currently in localStorage, keyed by server ProviderKey name. */
export function getAllStickerLocalKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const result: Record<string, string> = {};
  const vertexJson = getStickerVertexJson();
  const vertexKey  = getStickerVertexApiKey();
  const geminiKey  = getStickerApiKey();
  if (vertexJson) result["STICKER_VERTEX_AI_JSON"] = vertexJson;
  if (vertexKey)  result["STICKER_VERTEX_API_KEY"] = vertexKey;
  if (geminiKey)  result["STICKER_GEMINI_API_KEY"] = geminiKey;
  return result;
}

// Backward compatibility with older components
export const getStoredApiKey = getStickerApiKey;
export const setStoredApiKey = setStickerApiKey;
export const removeStoredApiKey = removeStickerApiKey;
