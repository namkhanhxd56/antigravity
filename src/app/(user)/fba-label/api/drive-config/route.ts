import { NextRequest, NextResponse } from "next/server";
import { readDriveConfig, writeDriveConfig } from "../../lib/drive-config";
import type { DriveConfig } from "../../lib/drive-config";

// GET /fba-label/api/drive-config
export async function GET() {
  return NextResponse.json(readDriveConfig());
}

// POST /fba-label/api/drive-config
export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<DriveConfig>;

  if (
    typeof body.folderId !== "string" ||
    typeof body.spreadsheetId !== "string" ||
    typeof body.sheetName !== "string"
  ) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  writeDriveConfig({
    folderId: body.folderId.trim(),
    spreadsheetId: body.spreadsheetId.trim(),
    sheetName: body.sheetName.trim() || "Sheet1",
  });

  return NextResponse.json({ success: true });
}
