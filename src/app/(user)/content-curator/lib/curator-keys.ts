"use client";

/**
 * Content Curator — Key Store
 *
 * Single source of truth for API keys in the browser.
 * Keys are stored ONLY in localStorage — never sent to server storage.
 *
 * Supported types:
 *   "vertex-json" — Vertex AI Service Account JSON ({ "type": "service_account", ... })
 *   "vertex"      — Vertex AI Express API Key (AIzaSy... from Google Cloud → Vertex AI Studio)
 *   "gemini"      — Google AI Studio API Key (AIzaSy... from aistudio.google.com)
 *
 * Routes use 3 separate headers — getCuratorHeaders() provides all three.
 */

export type CuratorKeyType = "vertex-json" | "vertex" | "gemini";

interface CuratorKeys {
  "vertex-json"?: string;
  vertex?: string;
  gemini?: string;
}

const LS_KEY = "curator_keys_v2";

function load(): CuratorKeys {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function save(keys: CuratorKeys): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(keys));
}

export function setCuratorKey(type: CuratorKeyType, value: string): void {
  const keys = load();
  const trimmed = value.trim();
  if (trimmed) {
    keys[type] = trimmed;
  } else {
    delete keys[type];
  }
  save(keys);
}

export function removeCuratorKey(type: CuratorKeyType): void {
  const keys = load();
  delete keys[type];
  save(keys);
}

export function getCuratorKey(type: CuratorKeyType): string | undefined {
  return load()[type];
}

export function getAllCuratorKeys(): CuratorKeys {
  return load();
}

/**
 * Returns all keys as the three HTTP headers that Curator routes expect.
 * Routes use separate headers per provider to avoid ambiguity.
 */
export function getCuratorHeaders(): {
  geminiKey: string | undefined;
  vertexKey: string | undefined;
  vertexJson: string | undefined;
} {
  const keys = load();
  return {
    geminiKey: keys.gemini,
    vertexKey: keys.vertex,
    vertexJson: keys["vertex-json"],
  };
}
