/**
 * Utility for managing the Gemini API Key in localStorage.
 * This allows users to "Bring Your Own Key" (BYOK) for Vercel deployments.
 */

const API_KEY_STORAGE_KEY = "gemini_api_key_v1";

export function getStoredApiKey(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setStoredApiKey(key: string): void {
    if (typeof window !== "undefined") {
        if (key.trim() === "") {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
        } else {
            localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
        }
    }
}

export function removeStoredApiKey(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
}
