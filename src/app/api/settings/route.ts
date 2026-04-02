/**
 * API Route: /api/settings
 *
 * GET  — Returns key status (masked) for all providers.
 * POST — Saves or deletes an API key.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getKeyStatus,
  readStoredKeys,
  writeStoredKeys,
  type ProviderKey,
} from "@/lib/key-storage";

const VALID_KEYS: ProviderKey[] = [
  "GEMINI_API_KEY",
  "IDEOGRAM_API_KEY",
  "OPENAI_API_KEY",
  "VERTEX_AI_JSON",
];

export async function GET() {
  const status = getKeyStatus();
  return NextResponse.json({ status });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body as { key: string; value: string };

    if (!VALID_KEYS.includes(key as ProviderKey)) {
      return NextResponse.json(
        { error: `Invalid key name: ${key}` },
        { status: 400 }
      );
    }

    const stored = readStoredKeys();

    if (value === "" || value === null || value === undefined) {
      // Delete the key
      delete stored[key as ProviderKey];
    } else {
      // Save the key
      stored[key as ProviderKey] = value;
    }

    writeStoredKeys(stored);

    // Also set in process.env so it takes effect immediately
    if (value) {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }

    const status = getKeyStatus();
    return NextResponse.json({ success: true, status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
