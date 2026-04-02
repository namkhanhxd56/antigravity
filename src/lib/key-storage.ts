/**
 * API Key Storage
 *
 * Manages API keys stored in a JSON file on the server.
 * Keys are read at runtime from both process.env AND the stored file,
 * so users can add keys via the UI without modifying .env.local.
 *
 * Storage file: data/api-keys.json (gitignored)
 */

import fs from "fs";
import path from "path";

const KEYS_FILE = path.join(process.cwd(), "data", "api-keys.json");

/** Supported provider key names. */
export type ProviderKey =
  | "GEMINI_API_KEY"
  | "IDEOGRAM_API_KEY"
  | "OPENAI_API_KEY"
  | "VERTEX_AI_JSON";

/** Shape of the stored keys file. */
export type StoredKeys = Partial<Record<ProviderKey, string>>;

/**
 * Reads stored API keys from the JSON file.
 * Returns an empty object if the file doesn't exist yet.
 */
export function readStoredKeys(): StoredKeys {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const raw = fs.readFileSync(KEYS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to read API keys file:", err);
  }
  return {};
}

/**
 * Writes API keys to the JSON file.
 * Creates the data directory if it doesn't exist.
 */
export function writeStoredKeys(keys: StoredKeys): void {
  const dir = path.dirname(KEYS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), "utf-8");
}

/**
 * Resolves an API key by checking:
 * 1. process.env (from .env.local) — takes priority
 * 2. Stored keys file (from UI)
 *
 * Returns the key string or undefined if not set anywhere.
 */
export function resolveApiKey(key: ProviderKey): string | undefined {
  return process.env[key] || readStoredKeys()[key] || undefined;
}

/**
 * Returns a summary of all providers with availability status.
 * Does NOT expose the actual key values — only masked previews.
 */
export function getKeyStatus(): Record<
  ProviderKey,
  { configured: boolean; source: "env" | "stored" | null; preview: string }
> {
  const stored = readStoredKeys();

  const check = (
    key: ProviderKey
  ): { configured: boolean; source: "env" | "stored" | null; preview: string } => {
    const envVal = process.env[key];
    const storedVal = stored[key];

    if (envVal) {
      return {
        configured: true,
        source: "env",
        preview: maskKey(envVal),
      };
    }
    if (storedVal) {
      return {
        configured: true,
        source: "stored",
        preview: maskKey(storedVal),
      };
    }
    return { configured: false, source: null, preview: "" };
  };

  return {
    GEMINI_API_KEY: check("GEMINI_API_KEY"),
    IDEOGRAM_API_KEY: check("IDEOGRAM_API_KEY"),
    OPENAI_API_KEY: check("OPENAI_API_KEY"),
    VERTEX_AI_JSON: check("VERTEX_AI_JSON"),
  };
}

/** Masks an API key: shows first 4 and last 4 chars. */
function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}
