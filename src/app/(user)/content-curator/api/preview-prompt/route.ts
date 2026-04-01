/**
 * API Route: POST /content-curator/api/preview-prompt
 *
 * Build prompt hoàn chỉnh từ inputs hiện tại — KHÔNG gọi Gemini.
 * Dùng cho Dev Inspector để xem AI sẽ đọc gì trước khi generate.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { buildGeneratePrompt, type LimitsConfig } from "../../lib/promptBuilder";
import type { GenerateRequest } from "../../lib/types";

const BASE_DIR = path.join(
  process.cwd(), "src", "app", "(user)", "content-curator", "skills", "_base"
);
const SKILLS_DIR = path.join(
  process.cwd(), "src", "app", "(user)", "content-curator", "skills"
);

const DEFAULT_LIMITS: LimitsConfig = {
  title: 200,
  bulletCount: 5,
  bulletItem: 500,
  description: 2000,
  searchTerms: 250,
};

function readLimits(): LimitsConfig {
  try {
    const filePath = path.join(BASE_DIR, "limits.json");
    if (fs.existsSync(filePath)) {
      return { ...DEFAULT_LIMITS, ...JSON.parse(fs.readFileSync(filePath, "utf-8")) };
    }
  } catch { /* ignore */ }
  return DEFAULT_LIMITS;
}

function readBaseRules(): string {
  try {
    const filePath = path.join(BASE_DIR, "base_rules.md");
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf-8");
  } catch { /* ignore */ }
  return "";
}

function readSkillFile(skillName: string): string {
  try {
    const filePath = path.join(SKILLS_DIR, skillName);
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf-8");
  } catch { /* ignore */ }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const { keywords, skillName, notes, occasion } = body;

    const skillContent = readSkillFile(skillName || "Editorial_Pro_V2.md");
    const baseRules = readBaseRules();
    const limits = readLimits();

    const prompt = buildGeneratePrompt({
      limits,
      baseRules,
      skillContent,
      keywords: keywords || "(no keywords provided)",
      notes,
      occasion,
    });

    // Phân tích các block trùng lặp trong skill file
    const duplicateWarnings = findDuplicateBlocks(skillContent);

    return NextResponse.json({
      success: true,
      prompt,
      meta: {
        skillName: skillName || "Editorial_Pro_V2.md",
        skillCharCount: skillContent.length,
        baseRulesCharCount: baseRules.length,
        totalPromptChars: prompt.length,
        duplicateWarnings,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Tìm các heading hoặc câu lặp lại trong skill content.
 * Trả về danh sách chuỗi bị duplicate (xuất hiện ≥2 lần).
 */
function findDuplicateBlocks(skillContent: string): string[] {
  if (!skillContent.trim()) return [];

  const lines = skillContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 10); // bỏ qua dòng quá ngắn

  const seen = new Map<string, number>();
  for (const line of lines) {
    seen.set(line, (seen.get(line) ?? 0) + 1);
  }

  return Array.from(seen.entries())
    .filter(([, count]) => count >= 2)
    .map(([line]) => line);
}
