/**
 * API Route: POST /sticker-generator/api/analyze
 *
 * Key priority (sticker-specific first, then global fallback):
 *   STICKER_VERTEX_AI_JSON > STICKER_VERTEX_API_KEY > STICKER_GEMINI_API_KEY
 *   > VERTEX_AI_JSON > GEMINI_API_KEY
 *
 * Model is sent in request body (not header) to avoid stale closure issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { readStoredKeys } from "@/lib/key-storage";
import { routeAnalysis } from "../../services/router.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, model } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    // ─── Resolve credentials — client header first, then server-side fallback ──
    const storedKeys = readStoredKeys();

    const resolvedKey =
      request.headers.get("x-sticker-api-key") ||
      storedKeys.STICKER_VERTEX_AI_JSON ||
      process.env.STICKER_VERTEX_AI_JSON ||
      storedKeys.STICKER_VERTEX_API_KEY ||
      process.env.STICKER_VERTEX_API_KEY ||
      storedKeys.STICKER_GEMINI_API_KEY ||
      process.env.STICKER_GEMINI_API_KEY ||
      storedKeys.VERTEX_AI_JSON ||
      process.env.VERTEX_AI_JSON ||
      storedKeys.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      undefined;

    if (!resolvedKey) {
      return NextResponse.json(
        { success: false, error: "No API credentials configured. Please add a key in Sticker Generator Settings." },
        { status: 400 }
      );
    }

    const vertexApiKeyHint = request.headers.get("x-sticker-vertex-key") || undefined;

    const analysis = await routeAnalysis(
      imageBase64,
      mimeType || "image/png",
      resolvedKey,
      model,
      vertexApiKeyHint
    );

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Analysis failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
