/**
 * API Route: POST /content-curator/api/rewrite
 *
 * Rewrite một section cụ thể theo 4 bước rõ ràng:
 *   1. Xác định vai trò & section cần viết
 *   2. Đọc nội dung hiện tại
 *   3. Đọc yêu cầu của user
 *   4. Xác định giới hạn ký tự → viết đúng yêu cầu, không vượt limit
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import type { RewriteRequest } from "../../lib/types";

const BASE_DIR = path.join(
  process.cwd(), "src", "app", "(user)", "content-curator", "skills", "_base"
);

// ─── Fallback limits (khi client không truyền charLimit) ─────────────────────

interface LimitsConfig {
  title: number;
  bulletItem: number;
  description: number;
}

const DEFAULT_LIMITS: LimitsConfig = { title: 200, bulletItem: 500, description: 2000 };

function readLimits(): LimitsConfig {
  try {
    const filePath = path.join(BASE_DIR, "limits.json");
    if (fs.existsSync(filePath)) {
      return { ...DEFAULT_LIMITS, ...JSON.parse(fs.readFileSync(filePath, "utf-8")) };
    }
  } catch { /* ignore */ }
  return DEFAULT_LIMITS;
}


// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildRewritePrompt(
  body: RewriteRequest,
  resolvedCharLimit: number,
): string {
  const { section, bulletIndex, currentContent, instruction } = body;

  const sectionLabel =
    section === "title"  ? "Product Title" :
    section === "bullet" ? `Feature Bullet #${(bulletIndex ?? 0) + 1}` :
                           "Product Description";

  const overBy = currentContent.length - resolvedCharLimit;
  const limitNote = overBy > 0
    ? `Current content is ${overBy} chars OVER the limit — you MUST shorten it.`
    : `Current content is within limit (${currentContent.length}/${resolvedCharLimit} chars).`;

  return [
    `You are an Amazon listing copywriter. Rewrite the ${sectionLabel} below.`,

    `--- CURRENT CONTENT (${currentContent.length} chars) ---\n${currentContent}\n--- END ---`,

    `--- WHAT TO CHANGE ---\n${instruction}\n--- END ---`,

    `--- CHARACTER LIMIT ---\n` +
    `Maximum: ${resolvedCharLimit} characters.\n` +
    `${limitNote}\n` +
    `Rules:\n` +
    `- Stay strictly under ${resolvedCharLimit} characters.\n` +
    `- Do not add bullet symbols (•, -, *) at the start.\n` +
    `- Return ONLY the rewritten text. No labels, no JSON, no explanation.`,
  ].join("\n\n");
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RewriteRequest;
    const { section, currentContent, instruction, model, charLimit } = body;

    if (!section || !currentContent?.trim() || !instruction?.trim()) {
      return NextResponse.json(
        { success: false, error: "section, currentContent, and instruction are required" },
        { status: 400 }
      );
    }

    const apiKey =
      request.headers.get("x-gemini-api-key") || 
      process.env.CURATOR_GEMINI_API_KEY || 
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured." },
        { status: 400 }
      );
    }

    // Resolve char limit: client value takes priority, fall back to limits.json
    const fileLimits = readLimits();
    const resolvedCharLimit =
      charLimit ??
      (section === "title"       ? fileLimits.title :
       section === "bullet"      ? fileLimits.bulletItem :
                                   fileLimits.description);

    const prompt = buildRewritePrompt(body, resolvedCharLimit);

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model: model || "gemini-2.5-flash",
      generationConfig: { temperature: 0.65 },
    });

    const result = await geminiModel.generateContent(prompt);
    const rewritten = result.response.text().trim().replace(/^["']+|["']+$/g, "");

    // Warn if AI still exceeded the limit
    const overBy = rewritten.length - resolvedCharLimit;

    return NextResponse.json({
      success: true,
      rewritten,
      meta: {
        charLimit: resolvedCharLimit,
        resultLength: rewritten.length,
        overBy: overBy > 0 ? overBy : 0,
      },
    });
  } catch (error) {
    console.error("[content-curator/rewrite] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
