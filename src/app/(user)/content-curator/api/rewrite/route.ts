/**
 * API Route: POST /content-curator/api/rewrite
 *
 * Rewrite một section cụ thể (title | bullet | description) dựa trên
 * nội dung hiện tại + instruction của user.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import type { RewriteRequest } from "../../lib/types";

const SKILLS_DIR = path.join(
  process.cwd(), "src", "app", "(user)", "content-curator", "skills"
);
const BASE_DIR = path.join(SKILLS_DIR, "_base");

function readSkillFile(skillName: string): string {
  try {
    const filePath = path.join(SKILLS_DIR, skillName);
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf-8");
  } catch { /* ignore */ }
  return "";
}

function readBaseRules(): string {
  try {
    const filePath = path.join(BASE_DIR, "base_rules.md");
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf-8");
  } catch { /* ignore */ }
  return "";
}

function buildRewritePrompt(body: RewriteRequest, skillContent: string, baseRules: string): string {
  const { section, bulletIndex, currentContent, instruction, context } = body;

  const sectionLabel =
    section === "title" ? "Product Title" :
    section === "bullet" ? `Feature Bullet #${(bulletIndex ?? 0) + 1}` :
    "Product Description";

  const limits =
    section === "title" ? "Max 200 characters." :
    section === "bullet" ? "Max 500 characters." :
    "Max 2000 characters.";

  const contextBlock = [
    context.keywords ? `KEYWORDS: ${context.keywords}` : "",
    context.otherSections?.title && section !== "title"
      ? `CURRENT TITLE: ${context.otherSections.title}` : "",
    context.otherSections?.description && section !== "description"
      ? `CURRENT DESCRIPTION: ${context.otherSections.description}` : "",
  ].filter(Boolean).join("\n");

  return `You are an Amazon listing copywriter. Rewrite only the specified section based on the user's instruction.

${baseRules ? `BASE RULES:\n${baseRules}\n` : ""}
${skillContent ? `SKILL / STYLE GUIDE:\n${skillContent}\n` : ""}
CONTEXT:
${contextBlock}

SECTION TO REWRITE: ${sectionLabel}
CURRENT CONTENT:
${currentContent}

USER INSTRUCTION:
${instruction}

CONSTRAINTS:
- ${limits}
- Keep keyword density high. Do not remove existing keywords unless instructed.
- Return ONLY the rewritten text for this section. No labels, no JSON, no markdown.
- Do not add bullet symbols (•, -, *) at the start.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RewriteRequest;
    const { section, currentContent, instruction, model } = body;

    if (!section || !currentContent?.trim() || !instruction?.trim()) {
      return NextResponse.json(
        { success: false, error: "section, currentContent, and instruction are required" },
        { status: 400 }
      );
    }

    const apiKey =
      request.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured." },
        { status: 400 }
      );
    }

    const skillContent = readSkillFile(body.context?.skillName || "Editorial_Pro_V2.md");
    const baseRules = readBaseRules();
    const prompt = buildRewritePrompt(body, skillContent, baseRules);

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model: model || "gemini-2.5-flash",
      generationConfig: { temperature: 0.7 },
    });

    const result = await geminiModel.generateContent(prompt);
    const rewritten = result.response.text().trim().replace(/^["']+|["']+$/g, "");

    return NextResponse.json({ success: true, rewritten });
  } catch (error) {
    console.error("[content-curator/rewrite] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
