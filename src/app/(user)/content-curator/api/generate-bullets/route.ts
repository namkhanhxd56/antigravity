/**
 * API Route: POST /content-curator/api/generate-bullets
 *
 * Step 2 — Viết bullet points. Nhận title đã viết làm context.
 * Trả về JSON array of strings.
 *
 * Body: {
 *   skillBullets: string,
 *   titleText: string,         — output từ step 1
 *   assignedKeywords: string[],
 *   availablePool: string[],   — đã update sau step 1
 *   bulletCount: number,
 *   imageAnalysis?: object,
 *   limits: ContentLimits,
 *   notes?: string,
 *   occasion?: string,
 *   model?: string,
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { callAI, resolveAiHeaders } from "../../lib/aiCall";
import { buildBulletsPrompt, type ImageAnalysis } from "../../lib/promptBuilderV3";
import type { ContentLimits } from "../../lib/useContentLimits";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      skillBullets = "",
      titleText = "",
      assignedKeywords = [],
      availablePool = [],
      bulletCount = 5,
      imageAnalysis = null,
      limits,
      notes,
      occasion,
      model,
    } = body as {
      skillBullets?: string;
      titleText?: string;
      assignedKeywords?: string[];
      availablePool?: string[];
      bulletCount?: number;
      imageAnalysis?: ImageAnalysis | null;
      limits?: ContentLimits;
      notes?: string;
      occasion?: string;
      model?: string;
    };

    const headers = resolveAiHeaders(request);

    if (!headers.apiKey && !headers.vertexJson && !headers.vertexApiKey) {
      return NextResponse.json(
        { success: false, error: "No API credentials. Configure API key in Settings." },
        { status: 400 }
      );
    }

    const effectiveLimits: ContentLimits = limits ?? {
      title: 200,
      bulletItem: 500,
      description: 2000,
      searchTerms: 250,
    };

    const prompt = buildBulletsPrompt({
      skillBullets,
      imageAnalysis,
      titleText,
      assignedKeywords,
      availablePool,
      bulletCount,
      limits: effectiveLimits,
      notes,
      occasion,
    });

    const raw = await callAI({ prompt, headers, model, responseType: "json", temperature: 0.75 });

    const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    let bullets: string[];
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        bullets = parsed.map((b: unknown) => String(b).replace(/^["'`]+|["'`]+$/g, "").trim());
      } else if (typeof parsed === "string") {
        bullets = parsed.split("\n").map((b: string) => b.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
      } else {
        bullets = Object.values(parsed).map(String);
      }
    } catch {
      // fallback: split by newline
      bullets = clean.split("\n").map((b: string) => b.replace(/^[-•*\d.]\s*/, "").replace(/^["'`]+|["'`]+$/g, "").trim()).filter(Boolean);
    }

    // Ensure exact bulletCount
    while (bullets.length < bulletCount) bullets.push("");
    bullets = bullets.slice(0, bulletCount);

    return NextResponse.json({ success: true, bullets });
  } catch (error) {
    console.error("[generate-bullets] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
