"use client";

import React, { useState, useCallback, useRef } from "react";
import type { StickerResult } from "../lib/types";

interface ResultGridProps {
  results: StickerResult[];
  isGenerating: boolean;
  skeletonCount: number;
  onRefresh: (id: string) => void;
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
  const BG_THRESHOLD = 245;

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

      const isPureWhite = (x: number, y: number): boolean => {
        const i = (y * w + x) * 4;
        return data[i] >= BG_THRESHOLD && data[i + 1] >= BG_THRESHOLD && data[i + 2] >= BG_THRESHOLD;
      };

      // Flood-fill from edges — pure white only
      const bgMask = new Uint8Array(w * h);
      const queue: number[] = [];

      const pushQueue = (px: number, py: number) => {
        if (px < 0 || px >= w || py < 0 || py >= h) return;
        const idx = py * w + px;
        if (bgMask[idx] === 0 && isPureWhite(px, py)) {
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

      // Basic Anti-Aliasing (Feathering) for the hard edges
      // Softens the transition between the removed background and the preserved sticker edge.
      const alphas = new Uint8Array(w * h);
      for (let i = 0; i < alphas.length; i++) {
        alphas[i] = bgMask[i] ? 0 : 255;
      }
      
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (bgMask[idx] === 0) {
            // Count surrounding background pixels
            let bgCount = 0;
            if (bgMask[idx - 1]) bgCount++;
            if (bgMask[idx + 1]) bgCount++;
            if (bgMask[idx - w]) bgCount++;
            if (bgMask[idx + w]) bgCount++;
            
            if (bgCount > 0) {
              // Edge pixel: soften it based on how white it is
              const r = data[idx * 4], g = data[idx * 4 + 1], b = data[idx * 4 + 2];
              const lum = (r + g + b) / 3;
              // If it's closer to pure white, it's more transparent
              // lum at 245 => alpha ~0; lum at 200 => alpha 255
              let alphaFactor = (245 - lum) / 45;
              if (alphaFactor < 0) alphaFactor = 0;
              if (alphaFactor > 1) alphaFactor = 1;
              
              alphas[idx] = Math.max(0, Math.min(255, Math.floor(alphaFactor * 255)));
            }
          }
        }
      }

      // Apply alphas
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
  onDownloadJpg,
  onRemoveBg,
  isRemovingBg,
}: {
  result: StickerResult;
  onClose: () => void;
  onDownloadJpg: () => void;
  onRemoveBg: () => void;
  isRemovingBg: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[85vh] max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>

        {/* Image */}
        <img
          src={result.imageUrl}
          alt="Generated sticker"
          className="w-full h-auto max-h-[70vh] object-contain p-4"
        />

        {/* Action bar */}
        <div className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onDownloadJpg}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Download JPG
          </button>
          <button
            onClick={onRemoveBg}
            disabled={isRemovingBg}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors border border-slate-300 shadow-sm disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-sm ${isRemovingBg ? "animate-spin" : ""}`}
            >
              {isRemovingBg ? "progress_activity" : "auto_fix_high"}
            </span>
            {isRemovingBg ? "Processing..." : "Export PNG 1000×1000"}
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
                  <div key={result.id} className="space-y-2 group">
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

                    {/* Action buttons */}
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionButton
                        icon="download"
                        label="Download JPG"
                        onClick={() => handleDownloadJpg(result)}
                      />
                      <ActionButton
                        icon="auto_fix_high"
                        label="Export PNG 1000×1000"
                        onClick={() => handleRemoveBg(result)}
                        loading={isProcessing}
                        hoverColor="hover:text-emerald-600 hover:border-emerald-400"
                      />
                      <ActionButton
                        icon="refresh"
                        label="Regenerate"
                        onClick={() => onRefresh(result.id)}
                      />
                      <ActionButton
                        icon="delete"
                        label="Delete"
                        onClick={() => onDelete(result.id)}
                        hoverColor="hover:text-red-500 hover:border-red-300"
                      />
                    </div>
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
          onDownloadJpg={() => handleDownloadJpg(lightboxResult)}
          onRemoveBg={() => handleRemoveBg(lightboxResult)}
          isRemovingBg={removingBgId === lightboxResult.id}
        />
      )}
    </>
  );
}
