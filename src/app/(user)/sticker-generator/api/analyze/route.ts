/**
 * API Route: POST /sticker-generator/api/analyze
 *
 * Credentials (in priority order):
 *   1. x-sticker-key + x-sticker-key-type headers (per-browser localStorage key)
 *   2. process.env STICKER_* / VERTEX_AI_JSON / GEMINI_API_KEY (admin/shared, intentional)
 *
 * No server-side key storage is read — keys never leak across browsers.
 */

import { NextRequest, NextResponse } from "next/server";
import { routeAnalysis } from "../../services/router.service";
import type { StickerKeyType } from "../../lib/sticker-keys";

function resolveEnvCredentials(): { key: string; type: StickerKeyType } | null {
  if (process.env.STICKER_VERTEX_AI_JSON) return { key: process.env.STICKER_VERTEX_AI_JSON, type: "vertex-json" };
  if (process.env.STICKER_VERTEX_API_KEY) return { key: process.env.STICKER_VERTEX_API_KEY, type: "vertex" };
  if (process.env.STICKER_GEMINI_API_KEY) return { key: process.env.STICKER_GEMINI_API_KEY, type: "gemini" };
  if (process.env.VERTEX_AI_JSON) return { key: process.env.VERTEX_AI_JSON, type: "vertex-json" };
  if (process.env.GEMINI_API_KEY) return { key: process.env.GEMINI_API_KEY, type: "gemini" };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, model } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }

    const headerKey = request.headers.get("x-sticker-key");
    const headerType = request.headers.get("x-sticker-key-type") as StickerKeyType | null;

    const creds =
      headerKey && headerType
        ? { key: headerKey, type: headerType }
        : resolveEnvCredentials();

    if (!creds) {
      return NextResponse.json(
        { success: false, error: "No API credentials configured. Please add a key in Sticker Generator Settings." },
        { status: 400 }
      );
    }

    const analysis = await routeAnalysis(
      imageBase64,
      mimeType || "image/png",
      creds.key,
      creds.type,
      model
    );

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Analysis failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
