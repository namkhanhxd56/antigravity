"use client";

import React, { useState, useCallback, useRef } from "react";
import type { StickerResult } from "../lib/types";
import { getStickerKey } from "../lib/sticker-keys";

interface ResultGridProps {
  results: StickerResult[];
  isGenerating: boolean;
  skeletonCount: number;
  onRefresh: (id: string, customPrompt?: string) => void;
  onDownload: (id: string) => void;
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

// ─── Remove Background — Export PNG ──────────────────────────────────────────

/**
 * Removes outer white background only, preserving sticker interior.
 * Flood-fill from edges (pure white).
 * Adjusted: Removed shadow fringe expansion to preserve sticker's inherent background (shadow and border).
 */


function exportPrintReadyPNG(imageUrl: string): Promise<string> {
  const TOLERANCE = 35; // Increased tolerance to catch more anti-aliasing edge fuzz

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

      // Sample top-left corner for background color
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      const isBgColor = (x: number, y: number): boolean => {
        const i = (y * w + x) * 4;
        return Math.abs(data[i] - bgR) <= TOLERANCE &&
          Math.abs(data[i + 1] - bgG) <= TOLERANCE &&
          Math.abs(data[i + 2] - bgB) <= TOLERANCE;
      };

      // Flood-fill from edges
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

      // --- Expand Background (Erode Foreground) by 10 pixels ---
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

      // Basic Anti-Aliasing (Feathering) for the hard edges
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
              alphas[idx] = 150; // Simple soften edge
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

// ─── Download Helpers ────────────────────────────────────────────────────────

function downloadAsJpg(imageUrl: string, filename: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill white background for JPG (no transparency)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/jpeg", 1.0); // Max quality
    link.download = filename;
    link.click();
  };
  img.src = imageUrl;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  onClick,
  hoverColor = "hover:text-primary hover:border-primary",
  disabled = false,
  loading = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  hoverColor?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={label}
      className={`p-2 bg-white rounded-lg border border-slate-200 text-slate-500 ${hoverColor} transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <span
        className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}
      >
        {loading ? "progress_activity" : icon}
      </span>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-xl bg-slate-200 border border-slate-200 overflow-hidden shadow-sm animate-pulse relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-slate-400 animate-spin">
              progress_activity
            </span>
            <span className="text-xs font-bold text-slate-400">
              Generating...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Lightbox Modal ──────────────────────────────────────────────────────────

function LightboxModal({
  result,
  onClose,
}: {
  result: StickerResult;
  onClose: () => void;
}) {
  const [displayUrl, setDisplayUrl] = useState(result.imageUrl);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSharpen = async () => {
    setIsProcessing(true);
    try {
      // 1. Gửi lệnh tạo Task Upscale lên PiAPI
      const piapiKey = getStickerKey("piapi") || "";
      const res = await fetch('/api/piapi/upscale', {
        method: 'POST',
        headers: { 
           'Content-Type': 'application/json',
           'x-piapi-key': piapiKey 
        },
        body: JSON.stringify({ image: displayUrl, scale: 2 })
      });
      const data = await res.json();
      if (!data.taskId) throw new Error(data.error || "Missing taskId");

      // 2. Vòng lặp Polling liên tục kiểm tra tiến độ PiAPI
      let status = "pending";
      let finalImageUrl = "";
      while (status === "pending" || status === "processing" || status === "starting") {
        await new Promise(r => setTimeout(r, 4000)); // Nghỉ 4 giây mỗi nhịp
        const statusRes = await fetch(`/api/piapi/status/${data.taskId}`, {
           headers: { 'x-piapi-key': piapiKey }
        });
        const statusData = await statusRes.json();
        
        if (statusData.code !== 200) throw new Error("Status check failed");
        
        status = statusData.data.status;
        if (status === "completed") {
           // Lấy output url
           finalImageUrl = statusData.data.output?.image_url || statusData.data.output?.image; 
        } else if (status === "failed") {
           throw new Error("Upscale failed on PiAPI server.");
        }
      }

      if (finalImageUrl) {
         // Convert URL to data URL to avoid CORS when downloading later
         const imgRes = await fetch(finalImageUrl);
         const blob = await imgRes.blob();
         const reader = new FileReader();
         reader.onloadend = () => setDisplayUrl(reader.result as string);
         reader.readAsDataURL(blob);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải Model AI làm nét ảnh qua PiAPI: " + (err as Error).message);
    } finally { 
      setIsProcessing(false); 
    }
  }

  const handleRemoveBg = async () => {
    setIsProcessing(true);
    try {
      const removedBgUrl = await exportPrintReadyPNG(displayUrl);
      setDisplayUrl(removedBgUrl);
    } catch (err) {
      alert("Lỗi khi tách nền.");
    } finally { setIsProcessing(false); }
  }

  const handleDownload = () => {
    downloadDataUrl(displayUrl, `processed-${result.id.slice(0, 8)}.png`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[85vh] max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>

        {/* Image Display */}
        <div className="flex-1 bg-slate-100/50 flex items-center justify-center p-8 overflow-hidden min-h-[400px]">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">progress_activity</span>
              <span className="text-sm font-bold text-slate-500">Đang xử lý hình ảnh...</span>
            </div>
          ) : (
            <img
              src={displayUrl}
              alt="Generated sticker"
              className="w-full h-auto max-h-[60vh] object-contain shadow-sm border border-slate-200 bg-white"
            />
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handleSharpen}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors border border-slate-300 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">filter_center_focus</span>
            Làm nét ảnh
          </button>

          <button
            onClick={handleRemoveBg}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-emerald-700 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors border border-emerald-300 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">auto_fix_high</span>
            Tách nền
          </button>

          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Tải ảnh (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ResultGrid({
  results,
  isGenerating,
  skeletonCount,
  onRefresh,
  onDownload,
  onCopy,
  onDelete,
  onClearAll,
}: ResultGridProps) {
  const [lightboxResult, setLightboxResult] = useState<StickerResult | null>(
    null
  );
  const [removingBgId, setRemovingBgId] = useState<string | null>(null);
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const [refinePrompt, setRefinePrompt] = useState<string>("");

  const showSkeletons = isGenerating && results.length === 0;
  const showEmpty = !isGenerating && results.length === 0;

  const handleDownloadJpg = useCallback(
    (result: StickerResult) => {
      downloadAsJpg(result.imageUrl, `sticker-${result.id.slice(0, 8)}.jpg`);
    },
    []
  );

  const handleRemoveBg = useCallback(async (result: StickerResult) => {
    setRemovingBgId(result.id);
    try {
      const transparentPng = await exportPrintReadyPNG(result.imageUrl);
      downloadDataUrl(
        transparentPng,
        `sticker-${result.id.slice(0, 8)}-1000x1000.png`
      );
    } catch (err) {
      console.error("Remove BG failed:", err);
      alert("Failed to remove background. Please try again.");
    } finally {
      setRemovingBgId(null);
    }
  }, []);

  return (
    <>
      <section className="w-[450px] border-l border-slate-300 bg-white flex flex-col shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-500">
              auto_awesome
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Creative Output
            </h2>
            {results.length > 0 && (
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {results.length}
              </span>
            )}
          </div>
          <button
            onClick={onClearAll}
            className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar bg-slate-50">
          {showEmpty && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-16">
              <span className="material-symbols-outlined text-5xl">
                auto_awesome
              </span>
              <div className="text-center">
                <p className="font-semibold text-sm text-slate-600">
                  No stickers yet
                </p>
                <p className="text-xs mt-1 text-slate-500">
                  Configure your settings and hit Generate
                </p>
              </div>
            </div>
          )}

          {showSkeletons && (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: skeletonCount }, (_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {results.map((result) => {
                const isProcessing = removingBgId === result.id;
                return (
                  <div key={result.id} className="space-y-2 group relative">
                    {/* Clickable image — opens lightbox */}
                    <div
                      className="aspect-square rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:border-primary/40 transition-all relative"
                      onClick={() => setLightboxResult(result)}
                    >
                      <img
                        alt="Generated sticker"
                        className="w-full h-full object-contain p-1"
                        src={result.imageUrl}
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/0 group-hover:text-slate-600 text-2xl transition-colors">
                          zoom_in
                        </span>
                      </div>
                    </div>

                    {/* Action buttons or Refine Input */}
                    {refiningId === result.id ? (
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-white/95 backdrop-blur shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.15)] border border-slate-200 rounded-xl z-10 flex flex-col gap-2">
                        <textarea
                          autoFocus
                          value={refinePrompt}
                          onChange={(e) => setRefinePrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && refinePrompt.trim()) {
                              e.preventDefault();
                              onRefresh(result.id, refinePrompt.trim());
                              setRefiningId(null);
                              setRefinePrompt("");
                            } else if (e.key === "Escape") {
                              setRefiningId(null);
                            }
                          }}
                          rows={2}
                          placeholder="Describe edits..."
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-medium text-slate-800"
                        />
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setRefiningId(null); }} className="flex-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-1.5 rounded-lg transition-colors">Cancel</button>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            if (refinePrompt.trim()) {
                              onRefresh(result.id, refinePrompt.trim());
                              setRefiningId(null);
                              setRefinePrompt("");
                            }
                          }} className="flex-1 text-[11px] font-bold text-white bg-primary hover:bg-primary/90 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                            Apply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionButton
                          icon="download"
                          label="Download Raw PNG"
                          onClick={() => downloadDataUrl(result.imageUrl, `sticker-${result.id.slice(0, 8)}-raw.png`)}
                        />
                        <ActionButton
                          icon="refresh"
                          label="Regenerate / Refine"
                          onClick={() => {
                            setRefiningId(result.id);
                            setRefinePrompt("");
                          }}
                        />
                        <ActionButton
                          icon="delete"
                          label="Delete"
                          onClick={() => onDelete(result.id)}
                          hoverColor="hover:text-red-500 hover:border-red-300"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxResult && (
        <LightboxModal
          result={lightboxResult}
          onClose={() => setLightboxResult(null)}
        />
      )}
    </>
  );
}
