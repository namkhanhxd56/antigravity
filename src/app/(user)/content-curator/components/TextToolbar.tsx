"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

// Lazy-load emoji picker to avoid SSR issues and reduce bundle
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

/** Title Case — only capitalizes first letter of each word, preserves everything else */
function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/(^|\s)\S/g, (ch) => ch.toUpperCase());
}

interface TextToolbarProps {
  /** Current text value */
  value: string;
  /** Callback when toolbar transforms the text */
  onChange: (value: string) => void;
  /** Undo handler — return null if nothing to undo */
  onUndo?: () => string | null;
  /** Redo handler — return null if nothing to redo */
  onRedo?: () => string | null;
  /** Whether undo is available */
  canUndo?: boolean;
  /** Whether redo is available */
  canRedo?: boolean;
}

export default function TextToolbar({
  value,
  onChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: TextToolbarProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmoji]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  const handleUndo = () => {
    if (onUndo) {
      const prev = onUndo();
      if (prev !== null) onChange(prev);
    }
  };

  const handleRedo = () => {
    if (onRedo) {
      const prev = onRedo();
      if (prev !== null) onChange(prev);
    }
  };

  const handleUpperCase = () => {
    const result = value.toUpperCase();
    onChange(result);
  };

  const handleLowerCase = () => {
    const result = value.toLowerCase();
    onChange(result);
  };

  const handleTitleCase = () => {
    const result = toTitleCase(value);
    onChange(result);
  };

  const btnBase =
    "flex items-center justify-center h-6 min-w-[24px] px-1 rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-[11px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed active:bg-zinc-300 dark:active:bg-zinc-600";

  return (
    <div className="flex items-center gap-0.5 relative">
      {/* Case transforms */}
      <button
        type="button"
        onClick={handleUpperCase}
        className={btnBase}
        title="UPPERCASE"
      >
        AB
      </button>
      <button
        type="button"
        onClick={handleLowerCase}
        className={btnBase}
        title="lowercase"
      >
        ab
      </button>
      <button
        type="button"
        onClick={handleTitleCase}
        className={btnBase}
        title="Title Case"
      >
        Ab
      </button>

      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

      {/* Undo / Redo */}
      <button
        type="button"
        onClick={handleUndo}
        disabled={!canUndo}
        className={btnBase}
        title="Undo"
      >
        <span className="material-symbols-outlined text-[14px]">undo</span>
      </button>
      <button
        type="button"
        onClick={handleRedo}
        disabled={!canRedo}
        className={btnBase}
        title="Redo"
      >
        <span className="material-symbols-outlined text-[14px]">redo</span>
      </button>

      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

      {/* Emoji */}
      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className={btnBase}
          title="Insert Emoji"
        >
          😀
        </button>
        {showEmoji && (
          <div className="absolute left-0 top-8 z-50 shadow-xl rounded-xl overflow-hidden">
            <EmojiPicker
              theme={(theme === "dark" ? "dark" : "light") as any}
              width={320}
              height={400}
              onEmojiClick={(emojiData) => {
                onChange(value + emojiData.emoji);
                setShowEmoji(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className={`${btnBase} relative`}
        title="Copy to clipboard"
      >
        <span className="material-symbols-outlined text-[13px]">content_copy</span>
        {showCopied && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 dark:bg-zinc-700 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
            Copied!
          </div>
        )}
      </button>
    </div>
  );
}
