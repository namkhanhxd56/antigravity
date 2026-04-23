"use client";

import { useState, useCallback } from "react";

// ─── Shared helpers ───────────────────────────────────────────────────────────

export interface ParsedKeyword {
  kw: string;
  volume: number | null;
}

/** Parse raw keyword lines, extracting keyword string + optional volume */
export function parseKeywordsWithVolume(raw: string): ParsedKeyword[] {
  const lines = raw.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const result: ParsedKeyword[] = [];
  for (const line of lines) {
    const volumeMatch = line.match(/\s+([\d,]+|-)\s*$/);
    const kw = volumeMatch
      ? line.slice(0, line.length - volumeMatch[0].length).trim()
      : line.trim();
    let volume: number | null = null;
    if (volumeMatch && volumeMatch[1] !== "-") {
      const n = parseInt(volumeMatch[1].replace(/,/g, ""), 10);
      if (!isNaN(n)) volume = n;
    }
    if (kw && !seen.has(kw.toLowerCase())) {
      seen.add(kw.toLowerCase());
      result.push({ kw, volume });
    }
  }
  return result;
}

/** Format volume number compactly: 12000 → "12K", 1500000 → "1.5M" */
export function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

// ─── KwTag component ──────────────────────────────────────────────────────────

export interface KwTagProps {
  kw: string;
  volume: number | null;
  usedCount: number;
  /** Zone dot color (null = unassigned pool, no dot) */
  dotClass?: string;
  /** Draggable behaviour — omit to disable drag */
  onDragStart?: () => void;
  /** Shows X button when provided */
  onRemove?: () => void;
  /**
   * Click the whole card (only fires when tag is NOT used).
   * Used in Competitor mode to add unused keyword to Generic Search Keywords.
   */
  onClickCard?: (kw: string) => void;
}

export function KwTag({ kw, volume, usedCount, dotClass, onDragStart, onRemove, onClickCard }: KwTagProps) {
  const isUsed = usedCount > 0;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(kw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }, [kw]);

  const handleCardClick = useCallback(() => {
    if (!isUsed && onClickCard) onClickCard(kw);
  }, [isUsed, onClickCard, kw]);

  const isClickable = !isUsed && !!onClickCard;

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onClick={isClickable ? handleCardClick : undefined}
      className={`relative inline-flex flex-col rounded-lg px-2 pt-1.5 pb-1 text-[11px] font-medium border transition-colors min-w-[60px] ${
        onDragStart ? "cursor-grab active:cursor-grabbing" : isClickable ? "cursor-pointer" : "cursor-default"
      } ${
        isUsed
          ? "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600 text-orange-900 dark:text-orange-100"
          : isClickable
            ? "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
      }`}
    >
      {/* Copied tooltip */}
      {copied && (
        <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 z-10">
          copied!
        </span>
      )}

      {/* Top row: dot | text (click=copy) | remove */}
      <div className="flex items-center gap-1">
        {dotClass && (
          <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
        )}
        <span
          className="leading-tight cursor-pointer select-text flex-1"
          onClick={handleCopy}
        >
          {kw}
        </span>
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="ml-0.5 opacity-30 hover:opacity-100 transition-opacity shrink-0"
            title="Remove"
          >
            <span className="material-symbols-outlined text-[11px]">close</span>
          </button>
        )}
      </div>

      {/* Bottom row: volume | count */}
      {(volume !== null || isUsed) && (
        <div className="flex items-center justify-between mt-0.5 gap-2">
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
            {volume !== null ? formatVolume(volume) : ""}
          </span>
          {isUsed && (
            <span className={`text-[9px] font-bold leading-none ${
              usedCount === 1 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}>
              x{usedCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
