import { NextRequest, NextResponse } from "next/server";
import { FNSKU_PATTERN, MAX_FILE_SIZE_BYTES } from "../../lib/constants";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Không có file" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".pdf"))
    return NextResponse.json({ error: "Chỉ nhận file .pdf" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE_BYTES)
    return NextResponse.json({ error: `File vượt quá ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB` }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const pdfjsLib = await import("pdfjs-dist");
    // Empty string disables Web Worker — correct for server-side Node.js (no DOM/Worker API)
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages: { page: number; fnsku: string | null; found: boolean }[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      const match = FNSKU_PATTERN.exec(text);
      pages.push({ page: i, fnsku: match ? match[0] : null, found: !!match });
    }

    return NextResponse.json({
      pages,
      total: doc.numPages,
      found: pages.filter((p) => p.found).length,
      errors: pages.filter((p) => !p.found).length,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
