/**
 * API Route: POST /content-curator/api/generate-title
 *
 * Step 1 — Viết title. Nhận skill_title section + keywords + image context.
 * Trả về plain string (title text).
 *
 * Body: {
 *   skillContent: string,      — full skill file content (no-split)
 *   assignedKeywords: string[], — keywords user assign cho title
 *   availablePool: string[],  — keywords chưa assign (unassigned pool)
 *   imageAnalysis?: object,
 *   limits: ContentLimits,
 *   notes?: string,
 *   occasion?: string,
 *   model?: string,
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { callAI, resolveAiHeaders } from "../../lib/aiCall";
import { buildTitlePrompt, type ImageAnalysis } from "../../lib/promptBuilderV3";
import type { ContentLimits } from "../../lib/useContentLimits";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      skillContent = "",
      assignedKeywords = [],
      availablePool = [],
      imageAnalysis = null,
      limits,
      notes,
      occasion,
      model,
    } = body as {
      skillContent?: string;
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

    const prompt = buildTitlePrompt({
      skillContent,
      imageAnalysis,
      assignedKeywords,
      availablePool,
      limits: effectiveLimits,
      notes,
      occasion,
    });

    const raw = await callAI({ prompt, headers, model, responseType: "text", temperature: 0.75 });

    // Strip surrounding quotes AI sometimes adds
    const title = raw.replace(/^["'`]+|["'`]+$/g, "").trim();

    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error("[generate-title] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
