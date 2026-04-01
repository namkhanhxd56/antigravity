/**
 * Per-tool localStorage keys for API key and model.
 *
 * Each tool stores its own API key and model independently:
 *   sticker-generator  → "sticker_gemini_api_key" / "sticker_gemini_model"
 *   content-curator    → "curator_gemini_api_key" / "curator_gemini_model"
 *
 * Legacy key "gemini_api_key_v1" is read as fallback so existing
 * users don't lose their saved key on first load.
 */

const LEGACY_KEY = "gemini_api_key_v1";

// ─── Sticker Generator ────────────────────────────────────────────────────────

const STICKER_API_KEY = "sticker_gemini_api_key";
const STICKER_MODEL_KEY = "sticker_gemini_model";

export function getStickerApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STICKER_API_KEY) ?? localStorage.getItem(LEGACY_KEY);
}

export function setStickerApiKey(key: string): void {
  if (typeof window === "undefined") return;
  key.trim() ? localStorage.setItem(STICKER_API_KEY, key.trim()) : localStorage.removeItem(STICKER_API_KEY);
}

export function removeStickerApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STICKER_API_KEY);
}

export function getStickerModel(): string {
  if (typeof window === "undefined") return "gemini-1.5-flash";
  // fallback to legacy "selectedModel" key
  return localStorage.getItem(STICKER_MODEL_KEY) ?? localStorage.getItem("selectedModel") ?? "gemini-1.5-flash";
}

export function setStickerModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STICKER_MODEL_KEY, model);
}

// ─── Content Curator ──────────────────────────────────────────────────────────

const CURATOR_API_KEY = "curator_gemini_api_key";
const CURATOR_MODEL_KEY = "curator_gemini_model";

export function getCuratorApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURATOR_API_KEY) ?? localStorage.getItem(LEGACY_KEY);
}

export function setCuratorApiKey(key: string): void {
  if (typeof window === "undefined") return;
  key.trim() ? localStorage.setItem(CURATOR_API_KEY, key.trim()) : localStorage.removeItem(CURATOR_API_KEY);
}

export function removeCuratorApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURATOR_API_KEY);
}

export function getCuratorModel(): string {
  if (typeof window === "undefined") return "gemini-2.5-flash";
  return localStorage.getItem(CURATOR_MODEL_KEY) ?? "gemini-2.5-flash";
}

export function setCuratorModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURATOR_MODEL_KEY, model);
}

// ─── Legacy shims (giữ để không break sticker-generator/page.tsx) ─────────────

/** @deprecated dùng getStickerApiKey() */
export function getStoredApiKey(): string | null {
  return getStickerApiKey();
}

/** @deprecated dùng setStickerApiKey() */
export function setStoredApiKey(key: string): void {
  setStickerApiKey(key);
}

/** @deprecated dùng removeStickerApiKey() */
export function removeStoredApiKey(): void {
  removeStickerApiKey();
}
