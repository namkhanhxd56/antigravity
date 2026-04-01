"use client";

import { useCallback, useRef, useMemo } from "react";

interface HistoryEntry {
  value: string;
  cursor?: number;
}

/**
 * Custom hook providing undo/redo for a text field.
 *
 * Call `push(value)` every time the value changes.
 * Call `undo()` / `redo()` to navigate history.
 */
export function useUndoRedo(initialValue = "") {
  const past = useRef<HistoryEntry[]>([{ value: initialValue }]);
  const future = useRef<HistoryEntry[]>([]);

  const push = useCallback((value: string) => {
    const last = past.current[past.current.length - 1];
    if (last && last.value === value) return; // no change
    past.current.push({ value });
    future.current = []; // clear redo stack on new edit
  }, []);

  const undo = useCallback((): string | null => {
    if (past.current.length <= 1) return null;
    const entry = past.current.pop()!;
    future.current.push(entry);
    return past.current[past.current.length - 1].value;
  }, []);

  const redo = useCallback((): string | null => {
    if (future.current.length === 0) return null;
    const entry = future.current.pop()!;
    past.current.push(entry);
    return entry.value;
  }, []);

  const canUndo = useCallback(() => past.current.length > 1, []);
  const canRedo = useCallback(() => future.current.length > 0, []);

  // Stable reference — individual functions are already stable via useCallback
  return useMemo(() => ({ push, undo, redo, canUndo, canRedo }), [push, undo, redo, canUndo, canRedo]);
}
