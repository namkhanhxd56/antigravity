"use client";

import { useMemo } from "react";

interface KeywordCoverageProps {
  /** Raw keyword textarea content */
  keywords: string;
  /**
   * Count of occurrences per keyword in generated content.
   * Keys are lowercase. Empty = no content generated yet.
   */
  usedKeywordCounts?: Record<string, number>;
}

interface ParsedKeyword {
  kw: string;
  volume: number | null;
}

function parseKeywordsWithVolume(raw: string): ParsedKeyword[] {
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

export default function KeywordCoverage({ keywords, usedKeywordCounts = {} }: KeywordCoverageProps) {
  const parsed = useMemo(() => parseKeywordsWithVolume(keywords), [keywords]);

  const hasContent = Object.keys(usedKeywordCounts).length > 0;

  const stats = useMemo(() => {
    return parsed.map(({ kw }) => ({
      kw,
      count: usedKeywordCounts[kw.toLowerCase()] ?? 0,
    }));
  }, [parsed, usedKeywordCounts]);

  const usedCount = stats.filter((s) => s.count > 0).length;
  const unusedCount = stats.filter((s) => s.count === 0).length;
  const coveragePercent = stats.length > 0 ? Math.round((usedCount / stats.length) * 100) : 0;

  const keywordCount = parsed.length;
  const intensity =
    keywordCount >= 30 ? "HIGH" : keywordCount >= 15 ? "MEDIUM" : keywordCount > 0 ? "LOW" : "—";
  const intensityColor =
    keywordCount >= 30
      ? "text-[#EA580C]"
      : keywordCount >= 15
        ? "text-amber-500"
        : "text-zinc-400";

  if (keywordCount === 0) return null;

  return (
    <div className="p-5 flex flex-col gap-3">

      {/* Suggested Intensity */}
      <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider">
        <span className="text-zinc-500 dark:text-zinc-400 uppercase">Suggested Intensity</span>
        <span className={intensityColor}>
          {intensity}
          {keywordCount > 0 ? ` (${keywordCount})` : ""}
        </span>
      </div>

      {/* Coverage stats row — only after generation */}
      {hasContent && (
        <>
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-wider">
            <span className="text-emerald-500 dark:text-emerald-400">✓ {usedCount} used</span>
            <span className="text-zinc-400 dark:text-zinc-500">○ {unusedCount} unused</span>
            <div className="flex-1" />
            <span className="text-zinc-500 dark:text-zinc-400">{coveragePercent}%</span>
          </div>

          {/* Coverage bar */}
          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-amber-400 transition-all duration-500"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
        </>
      )}

      {/* Legend — only after generation */}
      {hasContent && (
        <div className="flex items-center gap-3 text-[10px] text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#EA580C]" />
            Used
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            Unused
          </span>
          <span className="flex items-center gap-1 text-blue-500 font-bold">vol</span>
          <span className="flex items-center gap-1">
            <span className="text-emerald-500 font-bold">×1</span>
            <span className="text-red-500 font-bold">×2+</span>
            repeat
          </span>
        </div>
      )}
    </div>
  );
}
