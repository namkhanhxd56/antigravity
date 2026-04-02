import { NextRequest } from "next/server";
import { FNSKU_PATTERN, MAX_FILE_SIZE_BYTES, MAX_LABEL_TEXT_LENGTH } from "../../lib/constants";
import { readDriveConfig } from "../../lib/drive-config";
import { getAuthenticatedClient } from "../../lib/google-auth";
import { uploadPng } from "../../lib/drive-upload";
import { getExistingFnskus, appendRow } from "../../lib/sheet-writer";

const PROCESS_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface ProcessConfig {
  addText: boolean;
  text: string;
  x: number;
  y: number;
  fontsize: number;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const configStr = formData.get("config") as string | null;

  if (!file) {
    return new Response(
      JSON.stringify({ type: "log", msg: "Không có file", level: "err" }) + "\n",
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return new Response(
      JSON.stringify({ type: "log", msg: `File vượt quá ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`, level: "err" }) + "\n",
      { status: 400 }
    );
  }

  let config: ProcessConfig = { addText: false, text: "", x: 10, y: 78, fontsize: 7 };
  if (configStr) {
    try {
      const parsed = JSON.parse(configStr);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.addText === "boolean" &&
        typeof parsed.text === "string" &&
        typeof parsed.x === "number" &&
        typeof parsed.y === "number" &&
        typeof parsed.fontsize === "number"
      ) {
        config = parsed;
      }
    } catch {
      // malformed config — use defaults
    }
  }

  // Sanitize text: strip control characters, enforce length limit
  config.text = config.text.replace(/[\x00-\x1F\x7F]/g, "").slice(0, MAX_LABEL_TEXT_LENGTH);

  const buffer = Buffer.from(await file.arrayBuffer());
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (msg: string, level = "info") => {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "log", msg, level }) + "\n")
        );
      };

      try {
        // Dynamic imports — not bundled, resolved at runtime
        const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
        const pdfjsLib = await import("pdfjs-dist");
        // Empty string disables Web Worker — correct for server-side Node.js (no DOM/Worker API)
        pdfjsLib.GlobalWorkerOptions.workerSrc = "";
        const JSZip = (await import("jszip")).default;
        const { createCanvas } = await import("@napi-rs/canvas");

        emit("Đang phân tích PDF...");

        const srcDoc = await PDFDocument.load(buffer);
        const pageCount = srcDoc.getPageCount();
        emit(`Tổng ${pageCount} trang`);

        // Load with pdfjs for text extraction
        const pdfjsDoc = await pdfjsLib
          .getDocument({ data: new Uint8Array(buffer) })
          .promise;

        // ── Google Drive / Sheets (optional) ────────────────────────────────
        const driveConfig = readDriveConfig();
        const driveEnabled = !!(driveConfig.folderId && driveConfig.spreadsheetId);
        const driveAuth = driveEnabled ? await getAuthenticatedClient() : null;
        const existingFnskus = new Set<string>();

        if (driveEnabled && driveAuth) {
          emit("Google Drive: đang tải danh sách FNSKU đã có...", "info");
          try {
            const existing = await getExistingFnskus(driveAuth, driveConfig.spreadsheetId, driveConfig.sheetName);
            existing.forEach((f) => existingFnskus.add(f));
            emit(`Google Drive: ${existingFnskus.size} FNSKU đã có trong Sheet — sẽ bỏ qua.`, "info");
          } catch (e) {
            emit(`[WARN] Không đọc được Sheet: ${e instanceof Error ? e.message : String(e)}`, "warn");
          }
        } else if (driveEnabled && !driveAuth) {
          emit("[WARN] Google Drive đã cấu hình nhưng chưa đăng nhập — bỏ qua upload.", "warn");
        }
        // ────────────────────────────────────────────────────────────────────

        const zip = new JSZip();
        let success = 0;
        const failed: string[] = [];
        const fnskuCount: Record<string, number> = {};
        const startTime = Date.now();

        for (let i = 0; i < pageCount; i++) {
          if (Date.now() - startTime > PROCESS_TIMEOUT_MS) {
            emit(`Timeout: quá trình xử lý vượt quá ${PROCESS_TIMEOUT_MS / 60000} phút. Đã xử lý ${i}/${pageCount} trang.`, "err");
            break;
          }
          const pageNum = i + 1;

          // Extract FNSKU
          const pdfjsPage = await pdfjsDoc.getPage(pageNum);
          const textContent = await pdfjsPage.getTextContent();
          const text = textContent.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");
          const match = FNSKU_PATTERN.exec(text);
          const fnsku = match ? match[0] : `unknown_${pageNum}`;

          // Handle duplicate FNSKUs
          if (fnskuCount[fnsku]) {
            fnskuCount[fnsku]++;
          } else {
            fnskuCount[fnsku] = 1;
          }
          const fnsku_file =
            fnskuCount[fnsku] > 1 ? `${fnsku}_v${fnskuCount[fnsku]}` : fnsku;

          emit(`Đang xử lý: ${fnsku_file}`);

          try {
            // Extract single page with pdf-lib
            const singleDoc = await PDFDocument.create();
            const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
            singleDoc.addPage(copiedPage);

            // Add text if enabled
            if (config.addText && config.text.trim()) {
              const page = singleDoc.getPages()[0];
              const font = await singleDoc.embedFont(StandardFonts.Helvetica);
              const pageHeight = page.getHeight();
              page.drawText(config.text.trim(), {
                x: config.x,
                y: pageHeight - config.y, // pdf-lib: y=0 is bottom; pyfitz: y=0 is top
                size: config.fontsize,
                font,
                color: rgb(0, 0, 0),
              });
            }

            const editedBytes = await singleDoc.save();

            // Render to PNG via pdfjs + canvas
            const editedDoc = await pdfjsLib
              .getDocument({ data: editedBytes })
              .promise;
            const editedPage = await editedDoc.getPage(1);
            const viewport = editedPage.getViewport({ scale: 300 / 72 }); // 300 DPI

            const canvas = createCanvas(
              Math.floor(viewport.width),
              Math.floor(viewport.height)
            );
            const ctx = canvas.getContext("2d");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await editedPage.render({ canvasContext: ctx as any, viewport } as any).promise;

            const pngBuffer = await canvas.encode("png");
            zip.file(`${fnsku_file}.png`, pngBuffer);
            emit(`[OK] ${fnsku_file}.png`, "ok");

            // ── Upload to Drive + append to Sheet ───────────────────────────
            if (driveAuth && driveEnabled) {
              const rawFnsku = match ? match[0] : fnsku_file;
              if (existingFnskus.has(rawFnsku)) {
                emit(`[SKIP] ${fnsku_file} đã có trong Sheet`, "warn");
              } else {
                try {
                  const { link } = await uploadPng(
                    driveAuth,
                    Buffer.from(pngBuffer),
                    `${fnsku_file}.png`,
                    driveConfig.folderId
                  );
                  await appendRow(driveAuth, driveConfig.spreadsheetId, driveConfig.sheetName, rawFnsku, link);
                  emit(`[DRIVE] ${fnsku_file} → ${link}`, "ok");
                  existingFnskus.add(rawFnsku);
                } catch (e) {
                  emit(`[WARN] Drive upload thất bại (${fnsku_file}): ${e instanceof Error ? e.message : String(e)}`, "warn");
                }
              }
            }
            // ────────────────────────────────────────────────────────────────

            success++;
          } catch (e) {
            emit(`[ERR] ${fnsku_file} — ${e instanceof Error ? e.message : String(e)}`, "err");
            failed.push(fnsku_file);
          }
        }

        // Summary
        emit("─".repeat(36));
        emit(
          `Thành công: ${success}  Bỏ qua: 0  Thất bại: ${failed.length}`,
          failed.length ? "warn" : "ok"
        );
        if (failed.length) {
          for (const f of failed) emit(`  ✗ ${f}`, "err");
        }

        emit("Đang đóng gói ZIP...");
        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
        const zipBase64 = zipBuffer.toString("base64");

        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "done", zipBase64 }) + "\n"
          )
        );
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "log", msg: `Lỗi: ${e instanceof Error ? e.message : String(e)}`, level: "err" }) + "\n"
          )
        );
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
