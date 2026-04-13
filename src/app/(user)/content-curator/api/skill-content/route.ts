/**
 * API Route: GET /content-curator/api/skill-content?name=xxx.md
 *
 * Đọc nội dung một skill file từ disk (skills/ folder).
 * Dùng khi skill không có trong localStorage (server-side skills).
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const SKILLS_DIR = path.join(
  process.cwd(),
  "src/app/(user)/content-curator/skills"
);

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");

  if (!name || !name.endsWith(".md")) {
    return NextResponse.json({ success: false, error: "Invalid skill name" }, { status: 400 });
  }

  // Chặn path traversal
  const safeName = path.basename(name);
  const filePath = path.join(SKILLS_DIR, safeName);

  try {
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ success: true, content });
  } catch {
    return NextResponse.json({ success: false, error: `Skill file not found: ${safeName}` }, { status: 404 });
  }
}
