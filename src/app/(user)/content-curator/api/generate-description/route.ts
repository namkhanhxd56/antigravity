/**
 * API Route: POST /content-curator/api/generate-description
 *
 * Step 3 — Viết description. Nhận title + bullets làm context, bổ sung thay vì lặp.
 * Trả về plain string (description text).
 *
 * Body: {
 *   skillDescription: string,
 *   titleText: string,         — output từ step 1
 *   bulletsText: string[],     — output từ step 2
 *   assignedKeywords: string[],
 *   availablePool: string[],   — đã update sau step 2
 *   imageAnalysis?: object,
 *   limits: ContentLimits,
 *   notes?: string,
 *   occasion?: string,
 *   model?: string,
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { callAI, resolveAiHeaders } from "../../lib/aiCall";
import { buildDescriptionPrompt, type ImageAnalysis } from "../../lib/promptBuilderV3";
import type { ContentLimits } from "../../lib/useContentLimits";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      skillContent = "",
      titleText = "",
      bulletsText = [],
      assignedKeywords = [],
      availablePool = [],
      imageAnalysis = null,
      limits,
      notes,
      occasion,
      model,
    } = body as {
      skillContent?: string;
      titleText?: string;
      bulletsText?: string[];
      assignedKeywords?: string[];
      availablePool?: string[];
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

    const prompt = buildDescriptionPrompt({
      skillContent,
      imageAnalysis,
      titleText,
      bulletsText,
      assignedKeywords,
      availablePool,
      limits: effectiveLimits,
      notes,
      occasion,
    });

    const raw = await callAI({ prompt, headers, model, responseType: "text", temperature: 0.75 });

    const description = raw.replace(/^["'`]+|["'`]+$/g, "").trim();

    return NextResponse.json({ success: true, description });
  } catch (error) {
    console.error("[generate-description] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
