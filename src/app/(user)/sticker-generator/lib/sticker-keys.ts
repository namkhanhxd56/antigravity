"use client";

/**
 * Sticker Generator — Key Store
 *
 * Single source of truth for API keys in the browser.
 * Keys are stored ONLY in localStorage — never sent to server storage.
 *
 * Supported types:
 *   "vertex-json" — Vertex AI Service Account JSON ({ "type": "service_account", ... })
 *   "vertex"      — Vertex AI Express API Key (AIzaSy... from Google Cloud → Vertex AI Studio)
 *   "gemini"      — Google AI Studio API Key (AIzaSy... from aistudio.google.com)
 *
 * Priority: vertex-json > vertex > gemini
 */

export type StickerKeyType = "vertex-json" | "vertex" | "gemini" | "piapi";

interface StickerKeys {
  "vertex-json"?: string;
  vertex?: string;
  gemini?: string;
  piapi?: string;
}

const LS_KEY = "sticker_keys_v2";

function load(): StickerKeys {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function save(keys: StickerKeys): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(keys));
}

export function setStickerKey(type: StickerKeyType, value: string): void {
  const keys = load();
  const trimmed = value.trim();
  if (trimmed) {
    keys[type] = trimmed;
  } else {
    delete keys[type];
  }
  save(keys);
}

export function removeStickerKey(type: StickerKeyType): void {
  const keys = load();
  delete keys[type];
  save(keys);
}

export function getStickerKey(type: StickerKeyType): string | undefined {
  return load()[type];
}

export function getAllStickerKeys(): StickerKeys {
  return load();
}

/**
 * Returns the active key and its type.
 * Priority: vertex-json > vertex > gemini
 */
export function getActiveStickerKey(): { key: string; type: StickerKeyType } | null {
  const keys = load();
  if (keys["vertex-json"]) return { key: keys["vertex-json"], type: "vertex-json" };
  if (keys.vertex) return { key: keys.vertex, type: "vertex" };
  if (keys.gemini) return { key: keys.gemini, type: "gemini" };
  return null;
}
