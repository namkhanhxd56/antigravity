"use client";

import React, { useCallback, useEffect } from "react";

interface SourceSidebarProps {
  uploadedImageUrl: string | null;
  onImageUpload: (file: File) => void;
  onImageDelete: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export default function SourceSidebar({
  uploadedImageUrl,
  onImageUpload,
  onImageDelete,
  onAnalyze,
  isAnalyzing,
}: SourceSidebarProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onImageUpload(file);
      }
    },
    [onImageUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImageUpload(file);
      }
    },
    [onImageUpload]
  );

  // Handle paste from clipboard (works on the sidebar element)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            onImageUpload(file);
          }
          return;
        }
      }
    },
    [onImageUpload]
  );

  // Global paste listener so Ctrl+V / Cmd+V works from anywhere on the page
  useEffect(() => {
    const globalPasteHandler = (e: ClipboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            onImageUpload(file);
          }
          return;
        }
      }
    };

    document.addEventListener("paste", globalPasteHandler);
    return () => document.removeEventListener("paste", globalPasteHandler);
  }, [onImageUpload]);

  const isAnalyzeEnabled = !!uploadedImageUrl && !isAnalyzing;

  return (
    <aside
      className="w-80 flex flex-col border-r border-slate-300 bg-white overflow-y-auto no-scrollbar p-6 gap-6 shrink-0"
      onPaste={handlePaste}
    >
      {/* Upload Zone */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4">
          Source: Upload Original
        </h3>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:border-primary transition-colors cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">upload_file</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Drop, browse, or paste
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PNG, JPG up to 10MB · <span className="font-semibold text-primary">Ctrl+V</span> to paste
            </p>
          </div>
          <label className="mt-2 text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
            Browse Files
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>

      {/* Original Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Original Preview
          </h3>
          {uploadedImageUrl && (
            <button
              onClick={onImageDelete}
              className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                delete
              </span>
              Remove
            </button>
          )}
        </div>
        <div className="bg-slate-100 rounded-xl aspect-square relative overflow-hidden group border border-slate-300">
          {uploadedImageUrl ? (
            <>
              <img
                alt="Uploaded original"
                className="w-full h-full object-cover"
                src={uploadedImageUrl}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-3xl">
                  visibility
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="material-symbols-outlined text-4xl">image</span>
              <p className="text-xs font-medium">No image uploaded</p>
            </div>
          )}
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={onAnalyze}
        disabled={!isAnalyzeEnabled}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all ${
          isAnalyzeEnabled
            ? "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isAnalyzing ? "hourglass_top" : "auto_awesome"}
        </span>
        {isAnalyzing ? "Analyzing..." : "Analyze Sticker"}
      </button>

      {/* Sidebar Nav */}
      <nav className="mt-auto space-y-1">
        <a
          className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-semibold"
          href="/sticker-generator"
        >
          <span className="material-symbols-outlined text-[20px]">
            dashboard
          </span>
          Dashboard
        </a>
        <a
          className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined text-[20px]">
            collections
          </span>
          Library
        </a>
      </nav>
    </aside>
  );
}
