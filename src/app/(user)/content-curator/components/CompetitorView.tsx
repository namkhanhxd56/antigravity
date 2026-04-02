"use client";

import { useState, useMemo } from "react";
import HighlightTextarea from "./HighlightTextarea";

// ─── Keyword highlight (read-only display) ────────────────────────────────────

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({
  text,
  keywords,
  placeholder,
}: {
  text: string;
  keywords: string[];
  placeholder?: string;
}) {
  const chunks = useMemo(() => {
    if (!text) return [];
    if (!keywords.length) return [{ text, match: false }];

    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    const regex = new RegExp(
      `(?<=^|\\W)(${sorted.map(escapeRegExp).join("|")})(?=$|\\W)`,
      "gi"
    );

    const result: { text: string; match: boolean }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex)
        result.push({ text: text.slice(lastIndex, match.index), match: false });
      result.push({ text: match[1], match: true });
      lastIndex = match.index + match[1].length;
    }
    if (lastIndex < text.length)
      result.push({ text: text.slice(lastIndex), match: false });

    return result;
  }, [text, keywords]);

  if (!text) {
    return (
      <span className="text-zinc-400 dark:text-zinc-600 italic text-[13px]">
        {placeholder}
      </span>
    );
  }

  return (
    <>
      {chunks.map((chunk, i) =>
        chunk.match ? (
          <span key={i} className="text-[#EA580C] font-medium">
            {chunk.text}
          </span>
        ) : (
          <span key={i}>{chunk.text}</span>
        )
      )}
    </>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CompetitorViewProps {
  myTitle: string;
  bankKeywords: string;
}

// ─── Strip volume suffix from keyword lines ───────────────────────────────────

function stripVolume(line: string): string {
  return line.replace(/\s+(\d+|-)\s*$/, "").trim();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompetitorView({ myTitle, bankKeywords }: CompetitorViewProps) {
  const [competitors, setCompetitors] = useState<string[]>([""]);

  const keywordsList = useMemo(
    () =>
      Array.from(
        new Set(
          bankKeywords
            .split(/[\n,]+/)
            .map((k) => stripVolume(k))
            .filter(Boolean)
        )
      ),
    [bankKeywords]
  );

  const addCompetitor = () => {
    if (competitors.length < 10) setCompetitors((prev) => [...prev, ""]);
  };

  const removeCompetitor = (idx: number) => {
    setCompetitors((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCompetitor = (idx: number, val: string) => {
    setCompetitors((prev) => prev.map((c, i) => (i === idx ? val : c)));
  };

  return (
    <div className="flex flex-col p-6 md:p-8 w-full">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Competitor</h1>
        <p className="mt-1 text-[12px] text-zinc-400 dark:text-zinc-500">
          Compare your title against competitors. Keywords from your bank are highlighted in
          <span className="text-[#EA580C] font-semibold"> orange</span>.
        </p>
      </div>

      {/* My Title — read-only */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fed7aa] px-2.5 py-0.5 text-[11px] font-semibold text-[#b45309] tracking-wide">
            <span className="material-symbols-outlined text-[12px]">person</span>
            MY TITLE
          </span>
        </div>
        <div className="min-h-[52px] w-full rounded-lg bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-[14px] font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
          <HighlightText
            text={myTitle}
            keywords={keywordsList}
            placeholder="No title yet — generate content in Create My Content first."
          />
        </div>
      </div>

      {/* Divider */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">vs</span>
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Competitor titles */}
      <div className="space-y-4">
        {competitors.map((comp, idx) => (
          <div key={idx}>
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide">
                <span className="material-symbols-outlined text-[12px]">store</span>
                COMPETITOR {competitors.length > 1 ? idx + 1 : ""}
              </span>
              {competitors.length > 1 && (
                <button
                  onClick={() => removeCompetitor(idx)}
                  className="flex h-6 w-6 items-center justify-center rounded text-zinc-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-400 transition-colors"
                  title="Remove competitor"
                >
                  <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                </button>
              )}
            </div>
            <HighlightTextarea
              value={comp}
              onChange={(val) => updateCompetitor(idx, val)}
              keywords={keywordsList}
              placeholder={`Paste competitor title ${idx + 1} here…`}
              className="w-full rounded-lg bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus-within:border-[#EA580C] focus-within:ring-1 focus-within:ring-[#EA580C]"
              textClassName="text-[13px] text-zinc-700 dark:text-zinc-300"
              paddingClassName="px-4 py-3"
              minHeight="52px"
            />
            {/* Keyword coverage bar */}
            {comp && keywordsList.length > 0 && (
              <KeywordCoverage text={comp} keywords={keywordsList} />
            )}
          </div>
        ))}
      </div>

      {/* Add competitor button */}
      {competitors.length < 10 && (
        <button
          onClick={addCompetitor}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-2.5 text-[12px] font-medium text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">add</span>
          Add competitor
        </button>
      )}
    </div>
  );
}

// ─── Keyword coverage mini-bar ────────────────────────────────────────────────

function KeywordCoverage({ text, keywords }: { text: string; keywords: string[] }) {
  const { used, total } = useMemo(() => {
    const lower = text.toLowerCase();
    const used = keywords.filter((kw) => {
      const regex = new RegExp(
        `(?<=^|\\W)${escapeRegExp(kw.toLowerCase())}(?=$|\\W)`
      );
      return regex.test(lower);
    }).length;
    return { used, total: keywords.length };
  }, [text, keywords]);

  const pct = Math.round((used / total) * 100);

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#EA580C] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-zinc-400 shrink-0">
        {used}/{total} keywords
      </span>
    </div>
  );
}
