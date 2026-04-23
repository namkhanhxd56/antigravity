"use client";

import React, { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  isFileSystemAccessSupported,
  pickDirectory,
  readImageFiles,
  type LibraryImage,
} from "../lib/fs-access";
import {
  processBatch,
  type BatchProgress,
} from "../lib/batch-processor";
import SettingsPanel from "../components/SettingsPanel";

// ─── Step Labels ─────────────────────────────────────────────────────────────

const STEP_LABELS: Record<string, string> = {
  upscale: "Làm nét ảnh…",
  "remove-bg": "Tách nền…",
  refine: "Làm mượt viền…",
  save: "Lưu file…",
  done: "Hoàn tất!",
  error: "Lỗi!",
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [supported] = useState(isFileSystemAccessSupported());
  const [dirHandle, setDirHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [dirName, setDirName] = useState<string>("");
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ── Pick directory ────────────────────────────────────────────────────

  const handlePickDir = useCallback(async () => {
    try {
      setIsLoading(true);
      const handle = await pickDirectory();
      setDirHandle(handle);
      setDirName(handle.name);
      const imgs = await readImageFiles(handle);
      setImages(imgs);
      setSelectedIds(new Set());
      setResult(null);
    } catch (err) {
      // User cancelled picker — ignore
      if ((err as Error).name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Refresh directory ─────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    if (!dirHandle) return;
    setIsLoading(true);
    try {
      // Revoke old object URLs
      images.forEach((img) => URL.revokeObjectURL(img.url));
      const imgs = await readImageFiles(dirHandle);
      setImages(imgs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [dirHandle, images]);

  // ── Selection ─────────────────────────────────────────────────────────

  const toggleSelect = useCallback((name: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(images.map((img) => img.name)));
  }, [images]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ── Batch Process ─────────────────────────────────────────────────────

  const handleProcess = useCallback(async () => {
    if (!dirHandle || selectedIds.size === 0) return;

    const selected = images.filter((img) => selectedIds.has(img.name));
    setIsProcessing(true);
    setProgress(null);
    setResult(null);

    try {
      const res = await processBatch(selected, dirHandle, (p) =>
        setProgress({ ...p })
      );
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [dirHandle, selectedIds, images]);

  // ── Render ────────────────────────────────────────────────────────────

  if (!supported) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4 border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-red-400">
            error
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            Trình duyệt không hỗ trợ
          </h2>
          <p className="text-sm text-slate-600">
            Tính năng Library yêu cầu{" "}
            <strong>File System Access API</strong>, chỉ có trên{" "}
            <strong>Chrome</strong> hoặc <strong>Edge</strong>.
          </p>
          <Link
            href="/sticker-generator"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Quay lại Sticker Generator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-300 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/sticker-generator"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  photo_library
                </span>
                Sticker Library
              </h1>
              <p className="text-sm text-slate-500">
                {dirName
                  ? `📂 ${dirName} — ${images.length} ảnh`
                  : "Chọn thư mục chứa sticker để bắt đầu"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePickDir}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors border border-slate-300 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                folder_open
              </span>
              {dirHandle ? "Đổi thư mục" : "Chọn thư mục"}
            </button>

            {dirHandle && (
              <button
                onClick={handleRefresh}
                disabled={isProcessing || isLoading}
                className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-slate-300 shadow-sm disabled:opacity-50"
                title="Tải lại"
              >
                <span className="material-symbols-outlined text-sm">
                  refresh
                </span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              disabled={isProcessing}
              className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-slate-300 shadow-sm disabled:opacity-50"
              title="Cài đặt"
            >
              <span className="material-symbols-outlined text-sm">
                settings
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar — only show when images exist */}
      {images.length > 0 && (
        <div className="bg-white border-b border-slate-200 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={selectedIds.size === images.length ? deselectAll : selectAll}
                disabled={isProcessing}
                className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  {selectedIds.size === images.length
                    ? "deselect"
                    : "select_all"}
                </span>
                {selectedIds.size === images.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </button>

              {selectedIds.size > 0 && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {selectedIds.size} đã chọn
                </span>
              )}
            </div>

            <button
              onClick={handleProcess}
              disabled={isProcessing || selectedIds.size === 0}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                auto_fix_high
              </span>
              Xử lý {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {isProcessing && progress && (
        <div className="bg-primary/5 border-b border-primary/20 px-6 py-4">
          <div className="max-w-6xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-700">
                {progress.step === "done"
                  ? "✅ Hoàn tất!"
                  : `⏳ ${progress.current}/${progress.total} — ${STEP_LABELS[progress.step] || progress.step}`}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {progress.currentFile}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Result banner */}
      {result && !isProcessing && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm font-bold text-emerald-700">
            <span className="material-symbols-outlined text-sm">
              check_circle
            </span>
            Xử lý xong: {result.success} thành công
            {result.failed > 0 && `, ${result.failed} lỗi`}
            . Ảnh lưu tại <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs">{dirName}/processed/</code>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Empty state — no directory */}
          {!dirHandle && !isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
              <span className="material-symbols-outlined text-6xl">
                folder_open
              </span>
              <div className="text-center">
                <p className="font-semibold text-lg text-slate-600">
                  Chưa chọn thư mục
                </p>
                <p className="text-sm mt-1 text-slate-500">
                  Bấm &quot;Chọn thư mục&quot; để mở thư mục chứa sticker trên
                  máy tính của bạn
                </p>
              </div>
              <button
                onClick={handlePickDir}
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-colors mt-2"
              >
                <span className="material-symbols-outlined text-sm">
                  folder_open
                </span>
                Chọn thư mục
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">
                progress_activity
              </span>
              <span className="text-sm font-bold text-slate-500">
                Đang đọc thư mục…
              </span>
            </div>
          )}

          {/* Empty folder */}
          {dirHandle && !isLoading && images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
              <span className="material-symbols-outlined text-6xl">
                image_not_supported
              </span>
              <p className="font-semibold text-slate-600">
                Thư mục không có ảnh
              </p>
              <p className="text-sm text-slate-500">
                Hỗ trợ: PNG, JPG, JPEG, WebP
              </p>
            </div>
          )}

          {/* Image grid */}
          {images.length > 0 && !isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {images.map((img) => {
                const isSelected = selectedIds.has(img.name);
                return (
                  <div
                    key={img.name}
                    onClick={() => !isProcessing && toggleSelect(img.name)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${
                      isSelected
                        ? "border-primary shadow-md shadow-primary/20 ring-2 ring-primary/30"
                        : "border-slate-200 hover:border-slate-400"
                    } ${isProcessing ? "pointer-events-none opacity-70" : ""}`}
                  >
                    {/* Image */}
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-contain bg-white p-1"
                      loading="lazy"
                    />

                    {/* Checkbox overlay */}
                    <div
                      className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-white/80 border-slate-300 group-hover:border-primary/50"
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-white text-sm">
                          check
                        </span>
                      )}
                    </div>

                    {/* Size badge */}
                    <div className="absolute bottom-1 right-1 flex items-center gap-1">
                      {img.needsUpscale && (
                        <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          ↑ 2x
                        </span>
                      )}
                      <span className="bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md">
                        {img.width}×{img.height}
                      </span>
                    </div>

                    {/* File name */}
                    <div className="absolute bottom-1 left-1 max-w-[calc(100%-60px)]">
                      <span className="bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-md truncate block">
                        {img.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
