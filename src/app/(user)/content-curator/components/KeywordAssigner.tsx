"use client";

import { useMemo, useState, useRef } from "react";

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

interface ParsedKeyword {
  kw: string;
  volume: number | null;
}

/** Parse raw keyword lines, extracting keyword string + optional volume */
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

/** Format volume number compactly: 12000 → "12K", 1500000 → "1.5M" */
function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

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

// ─── Keyword Tag ──────────────────────────────────────────────────────────────

interface KwTagProps {
  kw: string;
  volume: number | null;
  usedCount: number;
  /** Zone dot color (null = unassigned pool, no dot) */
  dotClass?: string;
  onDragStart: () => void;
  onRemove?: () => void;
}

function KwTag({ kw, volume, usedCount, dotClass, onDragStart, onRemove }: KwTagProps) {
  const isUsed = usedCount > 0;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`inline-flex flex-col rounded-lg px-2 pt-1.5 pb-1 text-[11px] font-medium border cursor-grab active:cursor-grabbing select-none transition-colors min-w-[72px] ${
        isUsed
          ? "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600 text-orange-900 dark:text-orange-100"
          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
      }`}
    >
      {/* Top row: dot + keyword + remove */}
      <div className="flex items-center gap-1">
        {dotClass && (
          <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
        )}
        <span className="leading-tight">{kw}</span>
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="ml-auto pl-1 opacity-40 hover:opacity-100 transition-opacity shrink-0"
            title="Remove from zone"
          >
            <span className="material-symbols-outlined text-[11px]">close</span>
          </button>
        )}
      </div>

      {/* Bottom row: volume left, count right */}
      {(volume !== null || isUsed) && (
        <div className="flex items-center justify-between mt-0.5 gap-2">
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
            {volume !== null ? formatVolume(volume) : ""}
          </span>
          {isUsed && (
            <span
              className={`text-[9px] font-bold leading-none ${
                usedCount === 1
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              x{usedCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
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

  const assignedSet = useMemo(
    () => new Set([...assignments.title, ...assignments.bullets, ...assignments.description]),
    [assignments]
  );
  const unassigned = allKeywords.filter((kw) => !assignedSet.has(kw));

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
    </div>
  );
}
