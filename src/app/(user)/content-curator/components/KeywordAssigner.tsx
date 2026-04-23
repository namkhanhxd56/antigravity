"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import type { PipelineVersion } from "../lib/types";
import { KwTag, parseKeywordsWithVolume, formatVolume } from "./KwTag";

export interface KeywordAssignments {
  title: string[];
  bullets: string[];
  description: string[];
}

interface KeywordAssignerProps {
  keywords: string;
  assignments: KeywordAssignments;
  onAssignmentsChange: (a: KeywordAssignments) => void;
  bulletCount: number;
  onBulletCountChange: (n: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  /**
   * Count of how many times each keyword appears in generated content.
   * Keys are lowercase keyword strings.
   */
  usedKeywordCounts?: Record<string, number>;
  /** Active pipeline version */
  pipelineVersion?: PipelineVersion;
  /** Callback to clear all generated content in ContentCanvas */
  onClearContent?: () => void;
  /** Whether there is content to clear */
  hasContent?: boolean;
  /** Callback to change pipeline version */
  onVersionChange?: (v: PipelineVersion) => void;
}

type Zone = "title" | "bullets" | "description" | "unassigned";

const ZONE_CONFIG: Record<Exclude<Zone, "unassigned">, { label: string; color: string; dot: string }> = {
  title: {
    label: "TITLE",
    color: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  bullets: {
    label: "BULLETS",
    color: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  description: {
    label: "DESCRIPTION",
    color: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};


function moveKeyword(
  kw: string,
  to: Zone,
  assignments: KeywordAssignments
): KeywordAssignments {
  const next: KeywordAssignments = {
    title: assignments.title.filter((k) => k !== kw),
    bullets: assignments.bullets.filter((k) => k !== kw),
    description: assignments.description.filter((k) => k !== kw),
  };
  if (to !== "unassigned") {
    next[to] = [...next[to], kw];
  }
  return next;
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

interface DropZoneProps {
  zone: Exclude<Zone, "unassigned">;
  keywords: string[];
  volumeMap: Record<string, number | null>;
  usedKeywordCounts: Record<string, number>;
  onDrop: (zone: Zone) => void;
  onDragStart: (kw: string) => void;
  onRemove: (kw: string) => void;
  onAdd: (kw: string) => void;
}

function DropZone({ zone, keywords, volumeMap, usedKeywordCounts, onDrop, onDragStart, onRemove, onAdd }: DropZoneProps) {
  const [over, setOver] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const cfg = ZONE_CONFIG[zone];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputVal.trim()) {
      onAdd(inputVal.trim());
      setInputVal("");
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDrop(zone); }}
      className={`rounded-lg border-2 border-dashed p-2.5 min-h-[52px] transition-colors ${
        over
          ? "border-zinc-400 dark:border-zinc-500 bg-zinc-100/60 dark:bg-zinc-800/60"
          : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30"
      }`}
    >
      <div className={`mb-1.5 text-[10px] font-bold tracking-widest ${cfg.color}`}>
        {cfg.label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {keywords.length === 0 && (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
            Drop or type keywords…
          </span>
        )}
        {keywords.map((kw) => (
          <KwTag
            key={kw}
            kw={kw}
            volume={volumeMap[kw.toLowerCase()] ?? null}
            usedCount={usedKeywordCounts[kw.toLowerCase()] ?? 0}
            dotClass={cfg.dot}
            onDragStart={() => onDragStart(kw)}
            onRemove={() => onRemove(kw)}
          />
        ))}
      </div>

      {/* Inline keyword input */}
      <div className="mt-2 flex items-center gap-1">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type keyword + Enter"
          className={`flex-1 bg-transparent border-b text-[11px] px-1 py-0.5 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 transition-colors ${cfg.color} border-zinc-200 dark:border-zinc-700 focus:border-current`}
        />
        <span className="material-symbols-outlined text-[12px] text-zinc-300 dark:text-zinc-600">keyboard_return</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KeywordAssigner({
  keywords,
  assignments,
  onAssignmentsChange,
  bulletCount,
  onBulletCountChange,
  onGenerate,
  isGenerating,
  canGenerate,
  usedKeywordCounts = {},
  pipelineVersion = "v1",
  onVersionChange,
  onClearContent,
  hasContent = false,
}: KeywordAssignerProps) {
  const parsedKeywords = useMemo(() => parseKeywordsWithVolume(keywords), [keywords]);
  const allKeywords = useMemo(() => parsedKeywords.map((p) => p.kw), [parsedKeywords]);

  /** Map from lowercase keyword → volume */
  const volumeMap = useMemo(() => {
    const m: Record<string, number | null> = {};
    for (const { kw, volume } of parsedKeywords) {
      m[kw.toLowerCase()] = volume;
    }
    return m;
  }, [parsedKeywords]);

  const dragRef = useRef<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const assignedSet = useMemo(
    () => new Set([...assignments.title, ...assignments.bullets, ...assignments.description]),
    [assignments]
  );
  const unassigned = allKeywords.filter((kw) => !assignedSet.has(kw) && !dismissed.has(kw.toLowerCase()));

  const handleDragStart = (kw: string) => { dragRef.current = kw; };

  const handleDrop = (zone: Zone) => {
    if (!dragRef.current) return;
    onAssignmentsChange(moveKeyword(dragRef.current, zone, assignments));
    dragRef.current = null;
  };

  const handleRemove = (kw: string) => {
    onAssignmentsChange(moveKeyword(kw, "unassigned", assignments));
  };

  const handleAdd = (zone: Exclude<Zone, "unassigned">, kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    onAssignmentsChange(moveKeyword(trimmed, zone, assignments));
  };

  const handleDismiss = (kw: string) => {
    setDismissed((prev) => new Set([...prev, kw.toLowerCase()]));
  };

  const [overPool, setOverPool] = useState(false);

  return (
    <div className="flex h-full flex-col p-5 gap-4 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="material-symbols-outlined text-[#EA580C] text-[20px]">style</span>
        <h2 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">Keyword Assigner</h2>
      </div>

      {/* Drop zones */}
      <div className="flex flex-col gap-2.5 shrink-0">
        {(["title", "bullets", "description"] as const).map((zone) => (
          <DropZone
            key={zone}
            zone={zone}
            keywords={assignments[zone]}
            volumeMap={volumeMap}
            usedKeywordCounts={usedKeywordCounts}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onRemove={handleRemove}
            onAdd={(kw) => handleAdd(zone, kw)}
          />
        ))}
      </div>

      {/* Unassigned pool */}
      <div
        onDragOver={(e) => { e.preventDefault(); setOverPool(true); }}
        onDragLeave={() => setOverPool(false)}
        onDrop={(e) => { e.preventDefault(); setOverPool(false); handleDrop("unassigned"); }}
        className={`rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 min-h-[64px] transition-colors ${
          overPool ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"
        }`}
      >
        <div className="mb-1.5 text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500">
          UNASSIGNED — drag to a zone above
        </div>
        <div className="flex flex-wrap gap-1.5">
          {unassigned.length === 0 && allKeywords.length > 0 && (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">All keywords assigned</span>
          )}
          {unassigned.length === 0 && allKeywords.length === 0 && (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">Add keywords in Col 1…</span>
          )}
          {unassigned.map((kw) => (
            <KwTag
              key={kw}
              kw={kw}
              volume={volumeMap[kw.toLowerCase()] ?? null}
              usedCount={usedKeywordCounts[kw.toLowerCase()] ?? 0}
              onDragStart={() => handleDragStart(kw)}
            />
          ))}
        </div>
      </div>

      <hr className="border-zinc-100 dark:border-zinc-800 shrink-0" />

      {/* Bullet count stepper */}
      <div className="flex items-center justify-between shrink-0">
        <span className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
          Bullet Points
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBulletCountChange(Math.max(1, bulletCount - 1))}
            disabled={bulletCount <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <span className="w-6 text-center text-[15px] font-bold text-zinc-800 dark:text-zinc-200">
            {bulletCount}
          </span>
          <button
            onClick={() => onBulletCountChange(Math.min(10, bulletCount + 1))}
            disabled={bulletCount >= 10}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
        </div>
      </div>

      <hr className="border-zinc-100 dark:border-zinc-800 shrink-0" />

      {/* Pipeline version toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase shrink-0">
          Pipeline
        </span>
        <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold">
          <button
            onClick={() => onVersionChange?.("v1")}
            disabled={isGenerating}
            className={`px-3 py-1.5 transition-colors ${
              pipelineVersion === "v1"
                ? "bg-[#EA580C] text-white"
                : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            } disabled:cursor-not-allowed`}
          >
            V1 — Sequential
          </button>
          <button
            onClick={() => onVersionChange?.("v2")}
            disabled={isGenerating}
            className={`px-3 py-1.5 transition-colors border-l border-zinc-200 dark:border-zinc-700 ${
              pipelineVersion === "v2"
                ? "bg-[#EA580C] text-white"
                : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            } disabled:cursor-not-allowed`}
          >
            V2 — Cascade
          </button>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !canGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#B45309] py-3 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-[#92400e] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
      >
        {isGenerating ? (
          <>
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            Generating…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Generate content
          </>
        )}
      </button>

      {/* Clear content button — always visible, disabled when canvas is empty */}
      <button
        onClick={onClearContent}
        disabled={isGenerating || !hasContent}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 py-2.5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-800 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-zinc-200 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
      >
        <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
        Clear content
      </button>
    </div>
  );
}
