/**
 * Sticker Generator — Model preferences (localStorage).
 * API key storage has been moved to sticker-keys.ts.
 */

const STICKER_MODEL_KEY = "sticker_gemini_model";
const STICKER_ANALYSIS_MODEL_KEY = "sticker_analysis_model";
const STICKER_IMAGE_MODEL_KEY = "sticker_image_model";
const STICKER_USE_PIAPI_RMBG_KEY = "sticker_use_piapi_rmbg";

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

export function getUsePiapiRemoveBg(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STICKER_USE_PIAPI_RMBG_KEY) === "true";
}

export function setUsePiapiRemoveBg(value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STICKER_USE_PIAPI_RMBG_KEY, value ? "true" : "false");
}
