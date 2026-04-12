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
}

type Zone = "title" | "bullets" | "description" | "unassigned";

const ZONE_CONFIG: Record<Exclude<Zone, "unassigned">, { label: string; color: string; bg: string; border: string; dot: string }> = {
  title: {
    label: "TITLE",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  bullets: {
    label: "BULLETS",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  description: {
    label: "DESCRIPTION",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
};

/** Parse raw keyword lines into keyword strings (strips volume) */
function parseKeywords(raw: string): string[] {
  const lines = raw.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const kw = line.replace(/\s+([\d]+|-)\s*$/, "").trim();
    if (kw && !seen.has(kw.toLowerCase())) {
      seen.add(kw.toLowerCase());
      result.push(kw);
    }
  }
  return result;
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

// ─── Draggable Tag ────────────────────────────────────────────────────────────

interface TagProps {
  kw: string;
  zone: Zone;
  onDragStart: (kw: string) => void;
}

function Tag({ kw, zone, onDragStart }: TagProps) {
  const cfg = zone !== "unassigned" ? ZONE_CONFIG[zone] : null;
  return (
    <span
      draggable
      onDragStart={() => onDragStart(kw)}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium border cursor-grab active:cursor-grabbing select-none transition-colors ${
        cfg
          ? `${cfg.bg} ${cfg.border} ${cfg.color}`
          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
      }`}
    >
      {cfg && <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />}
      {kw}
    </span>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

interface DropZoneProps {
  zone: Exclude<Zone, "unassigned">;
  keywords: string[];
  onDrop: (zone: Zone) => void;
  onDragStart: (kw: string) => void;
  onRemove: (kw: string) => void;
  onAdd: (kw: string) => void;
}

function DropZone({ zone, keywords, onDrop, onDragStart, onRemove, onAdd }: DropZoneProps) {
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
          ? `${cfg.bg} ${cfg.border}`
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
          <span
            key={kw}
            draggable
            onDragStart={() => onDragStart(kw)}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium border cursor-grab active:cursor-grabbing select-none ${cfg.bg} ${cfg.border} ${cfg.color}`}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {kw}
            <button
              onClick={() => onRemove(kw)}
              className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
              title="Remove from zone"
            >
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          </span>
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
}: KeywordAssignerProps) {
  const allKeywords = useMemo(() => parseKeywords(keywords), [keywords]);
  const dragRef = useRef<string | null>(null);

  // Zones keep ALL keywords (dragged OR manually typed)
  // Unassigned pool = Col 1 keywords not yet placed in any zone
  const assignedSet = useMemo(
    () => new Set([...assignments.title, ...assignments.bullets, ...assignments.description]),
    [assignments]
  );
  const unassigned = allKeywords.filter((kw) => !assignedSet.has(kw));

  const handleDragStart = (kw: string) => {
    dragRef.current = kw;
  };

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
    // moveKeyword deduplicates: removes from other zones, adds to target
    onAssignmentsChange(moveKeyword(trimmed, zone, assignments));
  };

  // Unassigned pool drop zone
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
            <Tag key={kw} kw={kw} zone="unassigned" onDragStart={handleDragStart} />
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
