/**
 * API Route: POST /content-curator/api/upload-skill
 *
 * Nhận file .md từ client (multipart/form-data), lưu vào thư mục skills.
 * Đây là route riêng cho skill library — KHÔNG liên quan đến /api/settings
 * vốn chỉ dành cho API keys (Gemini, OpenAI...).
 *
 * Sau khi lưu, xóa cache của skill cũ (nếu ghi đè) và trả về
 * danh sách skill files hiện có để client cập nhật dropdown.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { clearSkillCache } from "../generate/route";

const SKILLS_DIR = path.join(
  process.cwd(),
  "src",
  "app",
  "(user)",
  "content-curator",
  "skills"
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".md")) {
      return NextResponse.json(
        { success: false, error: "Only .md files are accepted" },
        { status: 400 }
      );
    }

    const content = await file.text();

    if (!fs.existsSync(SKILLS_DIR)) {
      fs.mkdirSync(SKILLS_DIR, { recursive: true });
    }

    const filePath = path.join(SKILLS_DIR, file.name);
    fs.writeFileSync(filePath, content, "utf-8");

    // Xóa cache để lần generate tiếp theo đọc nội dung mới
    clearSkillCache(file.name);

    // Trả về danh sách skills cập nhật
    const skills = fs
      .readdirSync(SKILLS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({
        value: f,
        label: f.replace(/\.md$/, "").replace(/_/g, " "),
      }));

    return NextResponse.json({ success: true, fileName: file.name, skills });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
