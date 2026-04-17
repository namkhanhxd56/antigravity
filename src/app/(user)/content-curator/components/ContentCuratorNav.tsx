"use client";

import Link from "next/link";
import { useState } from "react";
import { useCuratorMode } from "../lib/ModeContext";
import { getCuratorModel } from "../lib/client-storage";
import SettingsPanel from "./SettingsPanel";

export const GEMINI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Latest)" },
  { value: "gemini-2.5-flash-lite-preview-06-17", label: "Gemini 2.5 Flash Lite (Fast)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Stable)" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Legacy)" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Legacy)" },
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number]["value"];

export function getStoredModel(): GeminiModel {
  return (getCuratorModel() as GeminiModel) || "gemini-2.0-flash";
}

export const DEFAULT_MODEL = "gemini-2.0-flash";

export default function ContentCuratorNav() {
  const { mode, setMode } = useCuratorMode();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 z-40 w-full font-sans">
        <Link
          href="/content-curator"
          className="text-[17px] font-bold tracking-tight text-[#EA580C] hover:opacity-80 transition-opacity flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          AMZ Content Curator
        </Link>

      <div className="flex items-center gap-6">
        {/* Mode Switcher */}
        <div className="flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-1">
          <Link
            href="/"
            className="px-4 py-1 flex items-center gap-1.5 text-[13px] font-semibold rounded-md transition-colors text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white hover:shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            Home
          </Link>
          <button
            onClick={() => setMode("create")}
            className={`px-4 py-1 flex items-center gap-1.5 text-[13px] font-semibold rounded-md transition-colors ${mode === "create" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            <span className="material-symbols-outlined text-[16px]">edit_document</span>
            Create
          </button>
          <button
            onClick={() => setMode("compare")}
            className={`px-4 py-1 flex items-center gap-1.5 text-[13px] font-semibold rounded-md transition-colors ${mode === "compare" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            <span className="material-symbols-outlined text-[16px]">radar</span>
            Compare
          </button>
          <button
            onClick={() => setMode("competitor")}
            className={`px-4 py-1 flex items-center gap-1.5 text-[13px] font-semibold rounded-md transition-colors ${mode === "competitor" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            Competitor
          </button>
        </div>

        <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-6 ml-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-[#EA580C] dark:hover:text-[#EA580C] transition-all hover:scale-105"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#EA580C] to-orange-400 border border-white/20 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
            CC
          </div>
        </div>
      </div>
    </header>

    <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
