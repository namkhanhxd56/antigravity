"use client";

import { useState, useMemo } from "react";
import { KwTag, parseKeywordsWithVolume } from "./KwTag";

export interface CompetitorInput {
  asin: string;
  title: string;
  bullets: string;
  description: string;
}

interface CompetitorViewProps {
  onGenerate: (data: CompetitorInput) => void;
  isGenerating: boolean;
  hasContent: boolean;
  onClearContent: () => void;
  keywords: string;
  usedKeywordCounts: Record<string, number>;
  onAddToGenericKeywords: (kw: string) => void;
}

export default function CompetitorView({
  onGenerate,
  isGenerating,
  hasContent,
  onClearContent,
  keywords,
  usedKeywordCounts,
  onAddToGenericKeywords,
}: CompetitorViewProps) {
  const [asin, setAsin] = useState("");
  const [title, setTitle] = useState("");
  const [bullets, setBullets] = useState("");
  const [description, setDescription] = useState("");

  const kwList = useMemo(() => parseKeywordsWithVolume(keywords), [keywords]);

  const canGenerate = !!(title.trim() || bullets.trim() || description.trim());

  const handleGenerate = () => {
    if (!canGenerate || isGenerating) return;
    onGenerate({ asin, title, bullets, description });
  };

  return (
    <div className="flex flex-col h-full p-5 gap-4 overflow-y-auto">
      <div>
        <p className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase mb-1">
          Competitor Mode
        </p>
        <p className="text-[12px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
          Paste a competitor listing below. AI will rewrite it using your keywords and product image.
        </p>
      </div>

      {/* ASIN */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          ASIN <span className="normal-case font-normal text-zinc-400">(optional, for reference)</span>
        </label>
        <input
          type="text"
          value={asin}
          onChange={(e) => setAsin(e.target.value)}
          placeholder="B0XXXXXXXXX"
          disabled={isGenerating}
          className="rounded-lg bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-[13px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#EA580C] focus:border-[#EA580C] disabled:opacity-50"
        />
      </div>

      {/* Competitor Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Competitor Title
        </label>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Paste competitor's product title here…"
          disabled={isGenerating}
          rows={3}
          className="resize-none rounded-lg bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-[13px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#EA580C] focus:border-[#EA580C] disabled:opacity-50"
        />
      </div>

      {/* Competitor Bullets */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Competitor Bullet Points
        </label>
        <textarea
          value={bullets}
          onChange={(e) => setBullets(e.target.value)}
          placeholder={"Paste all bullet points here…\n(one per line or as-is)"}
          disabled={isGenerating}
          rows={7}
          className="resize-none rounded-lg bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-[13px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#EA580C] focus:border-[#EA580C] disabled:opacity-50"
        />
      </div>

      {/* Competitor Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Competitor Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Paste competitor's product description here…"
          disabled={isGenerating}
          rows={5}
          className="resize-none rounded-lg bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-[13px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#EA580C] focus:border-[#EA580C] disabled:opacity-50"
        />
      </div>

      {/* Generate */}
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#B45309] py-3 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-[#92400e] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Generating…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Generate from Competitor
            </>
          )}
        </button>

        <button
          onClick={onClearContent}
          disabled={isGenerating || !hasContent}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 py-2.5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-800 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-zinc-200 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
        >
          <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
          Clear content
        </button>

        {kwList.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {kwList.map(({ kw, volume }) => (
                <KwTag
                  key={kw}
                  kw={kw}
                  volume={volume}
                  usedCount={usedKeywordCounts[kw.toLowerCase()] ?? 0}
                  onClickCard={onAddToGenericKeywords}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
