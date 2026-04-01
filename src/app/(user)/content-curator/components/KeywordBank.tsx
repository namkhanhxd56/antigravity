"use client";

import { useMemo } from "react";

interface KeywordBankProps {
  value: string;
  onChange: (value: string) => void;
  /** Live content text for cross-referencing keyword usage */
  contentText?: string;
}

interface ParsedKeyword {
  keyword: string;
  volume: number | null; // null = no volume provided, means "-" or omitted
}

interface KeywordStat {
  keyword: string;
  volume: number | null;
  count: number; // repeat count in content
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse a line like "funny cat stickers 12000" or "bi stickers -" or "cat decal"
 * Strategy: try to match a trailing number or "-" at the end of the line
 */
function parseLine(line: string): ParsedKeyword | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Match: keyword text  +  optional trailing whitespace + (number or "-")
  const match = trimmed.match(/^(.+?)\s+([\d]+|-)\s*$/);
  if (match) {
    const keyword = match[1].trim();
    const volStr = match[2];
    const volume = volStr === "-" ? null : parseInt(volStr, 10);
    return keyword ? { keyword, volume } : null;
  }

  // No volume suffix — treat as keyword only
  return { keyword: trimmed, volume: null };
}

/**
 * Parse all lines, deduplicate by keyword (keep first occurrence)
 */
function parseKeywords(raw: string): ParsedKeyword[] {
  const lines = raw.split(/[\n]+/).filter(Boolean);
  const seen = new Set<string>();
  const result: ParsedKeyword[] = [];

  for (const line of lines) {
    // Support comma-separated within a line too
    const parts = line.split(/,/);
    for (const part of parts) {
      const parsed = parseLine(part);
      if (parsed) {
        const key = parsed.keyword.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(parsed);
        }
      }
    }
  }

  return result;
}

function analyzeKeywords(
  parsedKeywords: ParsedKeyword[],
  contentText: string
): KeywordStat[] {
  return parsedKeywords.map((pk) => {
    const regex = new RegExp(`(?<=^|\\W)(${escapeRegExp(pk.keyword)})(?=$|\\W)`, "gi");
    const matches = contentText.match(regex);
    const count = matches ? matches.length : 0;
    return { keyword: pk.keyword, volume: pk.volume, count };
  });
}

export default function KeywordBank({
  value,
  onChange,
  contentText = "",
}: KeywordBankProps) {
  const parsedKeywords = useMemo(() => parseKeywords(value), [value]);
  const keywordCount = parsedKeywords.length;

  // Always compute analytics
  const stats = useMemo(() => {
    if (!contentText || keywordCount === 0) return [];
    return analyzeKeywords(parsedKeywords, contentText);
  }, [parsedKeywords, contentText, keywordCount]);

  const usedCount = stats.filter((s) => s.count > 0).length;
  const unusedCount = stats.filter((s) => s.count === 0).length;
  const coveragePercent =
    stats.length > 0 ? Math.round((usedCount / stats.length) * 100) : 0;

  const intensity =
    keywordCount >= 30
      ? "HIGH"
      : keywordCount >= 15
        ? "MEDIUM"
        : keywordCount > 0
          ? "LOW"
          : "—";

  const intensityColor =
    keywordCount >= 30
      ? "text-[#EA580C]"
      : keywordCount >= 15
        ? "text-amber-500"
        : "text-zinc-400";

  /** Format volume as short string */
  const fmtVol = (v: number | null) => {
    if (v === null) return "–";
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
    return String(v);
  };

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header — pinned top */}
      <div className="mb-4 flex items-center gap-2 shrink-0">
        <span className="material-symbols-outlined text-[#EA580C] rotate-45 transform">
          key
        </span>
        <h2 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">Keyword Bank</h2>
      </div>

      {/* Scrollable area: Textarea + Chips */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {/* Textarea */}
        <div className="mb-4">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-[180px] w-full resize-none rounded-lg bg-zinc-200/50 dark:bg-zinc-900/60 p-4 text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition-shadow"
            placeholder={"Enter keywords (optionally with volume):\nfunny cat stickers 12000\ncat decal -\nvinyl sticker"}
            spellCheck={false}
          />
        </div>

        {/* ═══ Keyword Analytics Chips ═══ */}
        {keywordCount > 0 && (
          <div className="flex flex-col min-h-0">
          {/* Stats row */}
          {contentText && stats.length > 0 && (
            <div className="mb-2 flex items-center gap-3 text-[11px] font-semibold tracking-wider">
              <span className="text-emerald-500 dark:text-emerald-400">✓ {usedCount}</span>
              <span className="text-zinc-400 dark:text-zinc-500">○ {unusedCount}</span>
              <div className="flex-1" />
              <span className="text-zinc-500 dark:text-zinc-400">COVERAGE {coveragePercent}%</span>
            </div>
          )}

          {/* Coverage bar */}
          {contentText && stats.length > 0 && (
            <div className="mb-3 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-amber-400 transition-all duration-300"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
          )}

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5 pr-1">
            {contentText && stats.length > 0
              ? stats.map((stat, i) => {
                  const used = stat.count > 0;
                  return (
                    <span
                      key={i}
                      className={`relative inline-flex flex-col rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors min-w-[60px] ${
                        used
                          ? "border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 text-[#EA580C] dark:text-orange-400"
                          : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {/* Main keyword text */}
                      <span className={`leading-snug ${used ? "line-through decoration-[#EA580C]/40 dark:decoration-orange-500/40" : ""}`}>
                        {stat.keyword}
                      </span>

                      {/* Bottom row: volume (left) + repeat (right) */}
                      <span className="flex items-center justify-between mt-0.5">
                        {/* Volume badge */}
                        <span className={`text-[9px] font-semibold ${
                          stat.volume !== null
                            ? "text-blue-500 dark:text-blue-400"
                            : "text-zinc-300 dark:text-zinc-600"
                        }`}>
                          {fmtVol(stat.volume)}
                        </span>

                        {/* Repeat count */}
                        {stat.count >= 1 && (
                          <span
                            className={`text-[9px] font-bold ${
                              stat.count >= 2
                                ? "text-red-500 dark:text-red-400"
                                : "text-emerald-500 dark:text-emerald-400"
                            }`}
                          >
                            ×{stat.count}
                          </span>
                        )}
                      </span>
                    </span>
                  );
                })
              : parsedKeywords.map((pk, i) => (
                  <span
                    key={i}
                    className="relative inline-flex flex-col rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 min-w-[60px]"
                  >
                    <span className="leading-snug">{pk.keyword}</span>
                    {pk.volume !== null && (
                      <span className="text-[9px] font-semibold text-blue-500 dark:text-blue-400 mt-0.5">
                        {fmtVol(pk.volume)}
                      </span>
                    )}
                  </span>
                ))}
          </div>

          {/* Legend */}
          {contentText && stats.length > 0 && (
            <div className="mt-3 flex items-center gap-4 text-[10px] text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-[#EA580C]" />
                Used
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                Unused
              </span>
              <span className="flex items-center gap-1">
                <span className="text-blue-500 font-bold">vol</span>
                = volume
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-500 font-bold">×1</span>
                = repeat
              </span>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Suggested Intensity & Analytics — pinned bottom */}
      <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4 shrink-0">
        <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider">
          <span className="text-zinc-500 dark:text-zinc-400">SUGGESTED INTENSITY</span>
          <span className={intensityColor}>
            {intensity}
            {keywordCount > 0 ? ` (${keywordCount})` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
