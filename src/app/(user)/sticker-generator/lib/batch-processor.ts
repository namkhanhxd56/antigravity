/**
 * Batch Processing Pipeline for Sticker Library.
 *
 * For each image:
 *   1. Upscale 2x via PiAPI  (if max dimension < 2048)
 *   2. Remove background      (local or PiAPI depending on setting)
 *   3. RefineAlpha             (erosion 3px + blur 1px)
 *   4. Save to "processed/" subfolder
 */

import { getStickerKey } from "./sticker-keys";
import { getUsePiapiRemoveBg } from "./client-storage";
import { refineAlpha } from "./alpha-postprocess";
import {
  type LibraryImage,
  getOrCreateSubdir,
  writeImageFile,
  dataUrlToBlob,
} from "./fs-access";

// Re-use the local exportPrintReadyPNG function from ResultGrid
// We need to duplicate/extract it here since it's defined inline in ResultGrid.
// This is the same flood-fill + erosion algorithm.

function exportPrintReadyPNG(imageUrl: string): Promise<string> {
  const TOLERANCE = 35;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = img.width;
      const h = img.height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);
      const { data } = imageData;

      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      const isBgColor = (x: number, y: number): boolean => {
        const i = (y * w + x) * 4;
        return (
          Math.abs(data[i] - bgR) <= TOLERANCE &&
          Math.abs(data[i + 1] - bgG) <= TOLERANCE &&
          Math.abs(data[i + 2] - bgB) <= TOLERANCE
        );
      };

      const bgMask = new Uint8Array(w * h);
      const queue: number[] = [];

      const pushQueue = (px: number, py: number) => {
        if (px < 0 || px >= w || py < 0 || py >= h) return;
        const idx = py * w + px;
        if (bgMask[idx] === 0 && isBgColor(px, py)) {
          bgMask[idx] = 1;
          queue.push(px, py);
        }
      };

      for (let x = 0; x < w; x++) {
        pushQueue(x, 0);
        pushQueue(x, h - 1);
      }
      for (let y = 1; y < h - 1; y++) {
        pushQueue(0, y);
        pushQueue(w - 1, y);
      }

      let qi = 0;
      while (qi < queue.length) {
        const px = queue[qi++];
        const py = queue[qi++];
        pushQueue(px - 1, py);
        pushQueue(px + 1, py);
        pushQueue(px, py - 1);
        pushQueue(px, py + 1);
      }

      const EXPAND_PIXELS = 10;
      for (let iter = 0; iter < EXPAND_PIXELS; iter++) {
        const tempMask = new Uint8Array(bgMask);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            if (bgMask[idx] === 0) {
              if (
                bgMask[idx - 1] === 1 ||
                bgMask[idx + 1] === 1 ||
                bgMask[idx - w] === 1 ||
                bgMask[idx + w] === 1
              ) {
                tempMask[idx] = 1;
              }
            }
          }
        }
        for (let i = 0; i < bgMask.length; i++) {
          bgMask[i] = tempMask[i];
        }
      }

      const alphas = new Uint8Array(w * h);
      for (let i = 0; i < alphas.length; i++) {
        alphas[i] = bgMask[i] ? 0 : 255;
      }

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (bgMask[idx] === 0) {
            let bgCount = 0;
            if (bgMask[idx - 1]) bgCount++;
            if (bgMask[idx + 1]) bgCount++;
            if (bgMask[idx - w]) bgCount++;
            if (bgMask[idx + w]) bgCount++;
            if (bgCount > 0) {
              alphas[idx] = 150;
            }
          }
        }
      }

      for (let i = 0; i < alphas.length; i++) {
        data[i * 4 + 3] = alphas[i];
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject("Failed to load image");
    img.src = imageUrl;
  });
}

// ─── PiAPI helpers (polling) ─────────────────────────────────────────────────

async function pollPiapiTask(taskId: string, piapiKey: string): Promise<string> {
  let status = "pending";
  let outputUrl = "";

  while (status === "pending" || status === "processing" || status === "starting") {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`/api/piapi/status/${taskId}`, {
      headers: { "x-piapi-key": piapiKey },
    });
    const data = await res.json();
    if (data.code !== 200) throw new Error("Status check failed");

    status = data.data.status;
    if (status === "completed") {
      outputUrl = data.data.output?.image_url || data.data.output?.image || "";
    } else if (status === "failed") {
      throw new Error("PiAPI task failed");
    }
  }

  if (!outputUrl) throw new Error("No output URL from PiAPI");
  return outputUrl;
}

async function piapiUpscale(imageUrl: string, piapiKey: string): Promise<string> {
  const res = await fetch("/api/piapi/upscale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-piapi-key": piapiKey,
    },
    body: JSON.stringify({ image: imageUrl, scale: 2 }),
  });
  const data = await res.json();
  if (!data.taskId) throw new Error(data.error || "Upscale: missing taskId");
  return pollPiapiTask(data.taskId, piapiKey);
}

async function piapiRemoveBg(imageUrl: string, piapiKey: string): Promise<string> {
  const res = await fetch("/api/piapi/remove-bg", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-piapi-key": piapiKey,
    },
    body: JSON.stringify({ image: imageUrl }),
  });
  const data = await res.json();
  if (!data.taskId) throw new Error(data.error || "RemoveBG: missing taskId");
  return pollPiapiTask(data.taskId, piapiKey);
}

/** Fetch a URL and return a compressed WebP data URL to prevent Payload size errors */
async function urlToDataUrl(url: string, maxWidth = 2048): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      
      // Downscale if larger than maxWidth
      if (width > maxWidth || height > maxWidth) {
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Use webp to preserve transparency but aggressively compress 
      // to avoid hitting Vercel's 4.5MB payload limit and PiAPI limits
      resolve(canvas.toDataURL("image/webp", 0.85));
    };
    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = objectUrl;
  });
}

// ─── Progress ────────────────────────────────────────────────────────────────

export interface BatchProgress {
  current: number;
  total: number;
  currentFile: string;
  step: "upscale" | "remove-bg" | "refine" | "save" | "done" | "error";
  error?: string;
}

export type ProgressCallback = (progress: BatchProgress) => void;

// ─── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Process a batch of library images sequentially.
 *
 * Pipeline per image:
 *   1. Upscale 2x (PiAPI) if max(w,h) < 2048
 *   2. Remove background (local or PiAPI depending on setting)
 *   3. RefineAlpha (3px erosion + 1px blur)
 *   4. Save to processed/ subfolder
 */
export async function processBatch(
  images: LibraryImage[],
  rootDir: FileSystemDirectoryHandle,
  onProgress: ProgressCallback
): Promise<{ success: number; failed: number }> {
  const processedDir = await getOrCreateSubdir(rootDir, "processed");
  const piapiKey = getStickerKey("piapi") || "";
  const usePiapiRmbg = getUsePiapiRemoveBg();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const baseName = img.name.replace(/\.[^.]+$/, "");

    try {
      // Convert the local object URL (blob:) to a base64 Data URL
      // PiAPI backend cannot read local blob: URLs, it needs base64.
      let currentUrl = await urlToDataUrl(img.url);

      // ── Step 1: Upscale if needed ───────────────────────────────────
      if (img.needsUpscale && piapiKey) {
        onProgress({
          current: i + 1,
          total: images.length,
          currentFile: img.name,
          step: "upscale",
        });
        const upscaledUrl = await piapiUpscale(currentUrl, piapiKey);
        currentUrl = await urlToDataUrl(upscaledUrl);
      }

      // ── Step 2: Remove background ───────────────────────────────────
      onProgress({
        current: i + 1,
        total: images.length,
        currentFile: img.name,
        step: "remove-bg",
      });

      let removedBgDataUrl: string;
      if (usePiapiRmbg && piapiKey) {
        const removedBgUrl = await piapiRemoveBg(currentUrl, piapiKey);
        removedBgDataUrl = await urlToDataUrl(removedBgUrl);
      } else {
        removedBgDataUrl = await exportPrintReadyPNG(currentUrl);
      }

      // ── Step 3: Refine Alpha ────────────────────────────────────────
      onProgress({
        current: i + 1,
        total: images.length,
        currentFile: img.name,
        step: "refine",
      });
      const refined = await refineAlpha(removedBgDataUrl, 3, 1);

      // ── Step 4: Save ────────────────────────────────────────────────
      onProgress({
        current: i + 1,
        total: images.length,
        currentFile: img.name,
        step: "save",
      });
      const blob = dataUrlToBlob(refined);
      await writeImageFile(processedDir, `${baseName}-processed.png`, blob);

      success++;
    } catch (err) {
      failed++;
      console.error(`Failed to process ${img.name}:`, err);
      onProgress({
        current: i + 1,
        total: images.length,
        currentFile: img.name,
        step: "error",
        error: (err as Error).message,
      });
    }
  }

  onProgress({
    current: images.length,
    total: images.length,
    currentFile: "",
    step: "done",
  });

  return { success, failed };
}
