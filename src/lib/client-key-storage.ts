/**
 * DEPRECATED: Shared Client Key Storage
 * 
 * Logic has been moved to app-specific folders:
 * - src/app/(user)/sticker-generator/lib/client-storage.ts
 * - src/app/(user)/content-curator/lib/client-storage.ts
 * - src/app/(user)/fba-label/lib/client-storage.ts
 * 
 * Please import from the respective app's local library instead.
 */

export const DEPRECATED_MESSAGE = "client-key-storage.ts is deprecated. Use app-local storage instead.";

// This file is kept temporarily to avoid build breaks during transition.
export * from "../app/(user)/sticker-generator/lib/client-storage";
