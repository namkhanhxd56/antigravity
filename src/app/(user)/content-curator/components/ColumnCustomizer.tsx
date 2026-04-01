"use client";

import { useState, useRef } from "react";

// ─── Column definitions ───────────────────────────────────────────────────────

export type ColumnId =
  | "title"
  | `bullet_${number}`
  | "description"
  | "searchTerms"
  | `spacer_${number}`;

export interface Column {
  id: ColumnId;
  label: string;
  /** spacer = empty cell, used to separate columns in Excel */
  isSpacer: boolean;
}

/** Build default columns based on how many bullets currently exist */
export function buildDefaultColumns(bulletCount: number): Column[] {
  const cols: Column[] = [
    { id: "title", label: "Title", isSpacer: false },
  ];
  for (let i = 0; i < bulletCount; i++) {
    cols.push({ id: `bullet_${i}`, label: `Bullet ${i + 1}`, isSpacer: false });
  }
  cols.push({ id: "description", label: "Description", isSpacer: false });
  cols.push({ id: "searchTerms", label: "Generic Keywords", isSpacer: false });
  return cols;
}

let spacerCounter = 0;
function newSpacerId(): `spacer_${number}` {
  return `spacer_${++spacerCounter}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ColumnCustomizerProps {
  columns: Column[];
  includeHeaders: boolean;
  onColumnsChange: (cols: Column[]) => void;
  onIncludeHeadersChange: (v: boolean) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ColumnCustomizer({
  columns,
  includeHeaders,
  onColumnsChange,
  onIncludeHeadersChange,
  onClose,
}: ColumnCustomizerProps) {
  // Index of the item being dragged
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // ── Drag handlers ──
  const handleDragStart = (idx: number) => {
    dragIndex.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOver(idx);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === targetIdx) {
      setDragOver(null);
      return;
    }
    const next = [...columns];
    const [moved] = next.splice(from, 1);
    next.splice(targetIdx, 0, moved);
    onColumnsChange(next);
    dragIndex.current = null;
    setDragOver(null);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDragOver(null);
  };

  // ── Add / remove spacer ──
  const addSpacer = () => {
    onColumnsChange([...columns, { id: newSpacerId(), label: "", isSpacer: true }]);
  };

  const removeSpacer = (id: ColumnId) => {
    onColumnsChange(columns.filter((c) => c.id !== id));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
          <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
            Customize Columns
          </span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Include headers toggle */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <input
            id="include-headers"
            type="checkbox"
            checked={includeHeaders}
            onChange={(e) => onIncludeHeadersChange(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-[#EA580C] focus:ring-[#EA580C]"
          />
          <label htmlFor="include-headers" className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
            Include column headers (first row)
          </label>
        </div>

        {/* Column list */}
        <div className="px-3 py-3 space-y-1.5 max-h-[320px] overflow-y-auto">
          <p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase mb-2 px-1">
            Drag to reorder
          </p>

          {columns.map((col, idx) => (
            <div
              key={col.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-grab active:cursor-grabbing transition-colors select-none
                ${dragOver === idx
                  ? "bg-orange-50 dark:bg-orange-950/30 border border-[#EA580C]/40"
                  : col.isSpacer
                    ? "bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-300 dark:border-zinc-700"
                    : "bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                }`}
            >
              {/* Drag handle */}
              <span className="material-symbols-outlined text-[16px] text-zinc-300 dark:text-zinc-600 shrink-0">
                drag_indicator
              </span>

              {col.isSpacer ? (
                <>
                  <span className="flex-1 text-[11px] text-zinc-400 italic">
                    Empty spacer
                  </span>
                  <button
                    onClick={() => removeSpacer(col.id)}
                    className="text-zinc-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 transition-colors"
                    title="Remove spacer"
                  >
                    <span className="material-symbols-outlined text-[15px]">remove_circle</span>
                  </button>
                </>
              ) : (
                <span className="flex-1 text-[12px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {col.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Add spacer */}
        <div className="px-3 pb-3">
          <button
            onClick={addSpacer}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Add empty spacer
          </button>
        </div>

      </div>
    </>
  );
}
