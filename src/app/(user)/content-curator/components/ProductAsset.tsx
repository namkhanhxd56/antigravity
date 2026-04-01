'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface ProductAssetProps {
  onChange?: (base64: string | null) => void;
}

export default function ProductAsset({ onChange }: ProductAssetProps = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    if (onChange) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    if (onChange) onChange(null);
  };

  // Paste from clipboard (Ctrl+V anywhere on the page)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) loadFile(file);
          break;
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  return (
    <div className="flex flex-col p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#EA580C]">image</span>
        <h2 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">Product Asset</h2>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
      />

      {imageUrl ? (
        /* ── Preview ── */
        <div className="w-full">
          {/* Image container — fixed area, no distortion */}
          <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden flex items-center justify-center" style={{ maxHeight: '240px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Product asset"
              className="max-w-full max-h-[240px] object-contain"
            />
          </div>

          {/* Buttons BELOW the image */}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-2 text-[12px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
              Replace
            </button>
            <button
              onClick={handleRemove}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-2 text-[12px] font-semibold text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* ── Upload Zone ── */
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          tabIndex={0}
          className={`relative flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors outline-none focus:ring-2 focus:ring-[#EA580C]
            ${isDragging
              ? 'border-[#EA580C] bg-orange-50 dark:bg-orange-950/20'
              : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 hover:border-slate-400 dark:hover:border-zinc-600'
            }`}
        >
          {/* Icon Circle */}
          <div className={`mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full transition-colors ${isDragging ? 'bg-orange-100 dark:bg-orange-900/40 text-[#EA580C]' : 'bg-[#EDF2FE] dark:bg-blue-900/20 text-[#2563EB] dark:text-blue-400'}`}>
            <span className="material-symbols-outlined text-[32px]">
              {isDragging ? 'file_download' : 'upload_file'}
            </span>
          </div>

          <h3 className="mb-2 text-[17px] font-semibold tracking-tight text-slate-800 dark:text-zinc-200">
            {isDragging ? 'Drop to upload' : 'Drop, browse, or paste'}
          </h3>
          <p className="mb-7 text-[13px] font-medium text-slate-500 dark:text-zinc-400 tracking-wide">
            PNG, JPG, WEBP up to 10MB &middot;{' '}
            <span className="font-semibold text-[#2563EB] dark:text-blue-400">Ctrl+V</span> to paste
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-[#111827] dark:bg-zinc-800 px-8 py-3 text-[14px] font-semibold tracking-wide text-white shadow-sm transition-all hover:bg-black dark:hover:bg-zinc-700 active:scale-[0.98]"
          >
            Browse Files
          </button>
        </div>
      )}
    </div>
  );
}
