/**
 * API Route: GET /content-curator/api/skills
 *
 * Trả về danh sách các skill files (.md) hiện có trong thư mục skills.
 * Client dùng route này để load dropdown skills động —
 * bao gồm cả skill mặc định lẫn skill người dùng đã import.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SKILLS_DIR = path.join(
  process.cwd(),
  "src",
  "app",
  "(user)",
  "content-curator",
  "skills"
);

export async function GET() {
  try {
    if (!fs.existsSync(SKILLS_DIR)) {
      return NextResponse.json({ skills: [] });
    }

    const skills = fs
      .readdirSync(SKILLS_DIR)
      // Chỉ lấy file .md ở root của skills/ — bỏ qua thư mục _base/ (system files)
      .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
      .map((f) => ({
        value: f,
        label: f.replace(/\.md$/, "").replace(/_/g, " "),
      }));

    return NextResponse.json({ skills });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
