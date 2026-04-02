"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useContentLimits, type ContentLimits } from "../lib/useContentLimits";
import { getCuratorApiKey, setCuratorApiKey, removeCuratorApiKey, getCuratorModel, setCuratorModel } from "../lib/client-storage";
import { useCuratorMode } from "../lib/ModeContext";

export const GEMINI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recommended)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number]["value"];

export function getStoredModel(): GeminiModel {
  return getCuratorModel() as GeminiModel;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 6)}••••••${key.slice(-4)}`;
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-[#EA580C]" : "bg-zinc-200"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`}
      />
    </button>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function Section({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">{title}</p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContentCuratorNav() {
  const { limits, save: saveLimits } = useContentLimits();
  const { mode, setMode } = useCuratorMode();

  const [open, setOpen] = useState(false);

  // Appearance
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Model
  const [model, setModel] = useState<GeminiModel>("gemini-2.5-flash");

  // API Key
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState<"none" | "saved">("none");
  const [showKey, setShowKey] = useState(false);

  // Content Limits (draft) — draftRaw stores raw string input to allow full deletion while typing
  const [draft, setDraft] = useState<ContentLimits>(limits);
  const [draftRaw, setDraftRaw] = useState<Record<keyof ContentLimits, string>>({
    title: String(limits.title),
    bulletItem: String(limits.bulletItem),
    description: String(limits.description),
    searchTerms: String(limits.searchTerms),
  });

  // Init on mount
  useEffect(() => {
    setTimeout(() => {
      setModel(getStoredModel());
      const saved = getCuratorApiKey();
      setApiKeyStatus(saved ? "saved" : "none");
    }, 0);
  }, []);

  // Sync draft when limits change externally
  useEffect(() => {
    setTimeout(() => {
      setDraft(limits);
      setDraftRaw({
        title: String(limits.title),
        bulletItem: String(limits.bulletItem),
        description: String(limits.description),
        searchTerms: String(limits.searchTerms),
      });
    }, 0);
  }, [limits]);

  const handleOpen = () => {
    setDraft(limits);
    setDraftRaw({
      title: String(limits.title),
      bulletItem: String(limits.bulletItem),
      description: String(limits.description),
      searchTerms: String(limits.searchTerms),
    });
    setApiKeyInput("");
    setShowKey(false);
    setOpen(true);
  };

  // Dark Mode
  const handleDarkMode = (v: boolean) => {
    setTheme(v ? "dark" : "light");
  };

  // Ensure hydration matches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Model
  const handleModelChange = (v: GeminiModel) => {
    setModel(v);
    setCuratorModel(v);
  };

  // API Key
  const handleSaveKey = () => {
    if (!apiKeyInput.trim()) return;
    setCuratorApiKey(apiKeyInput.trim());
    setApiKeyInput("");
    setApiKeyStatus("saved");
  };

  const handleClearKey = () => {
    removeCuratorApiKey();
    setApiKeyStatus("none");
    setApiKeyInput("");
  };

  // Limits
  const handleLimitChange = (field: keyof ContentLimits, raw: string) => {
    setDraftRaw((d) => ({ ...d, [field]: raw }));
    const v = parseInt(raw, 10);
    if (!isNaN(v) && v > 0) setDraft((d) => ({ ...d, [field]: v }));
  };

  const handleSaveLimits = () => {
    saveLimits(draft);
    setOpen(false);
  };

  const handleResetLimits = () => {
    const defaults = { title: 200, bulletItem: 500, description: 2000, searchTerms: 250 };
    setDraft(defaults);
    setDraftRaw({ title: "200", bulletItem: "500", description: "2000", searchTerms: "250" });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 z-40 w-full">
      <Link
        href="/content-curator"
        className="text-[17px] font-bold tracking-tight text-[#EA580C] hover:opacity-80 transition-opacity"
      >
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
            Create My Content
          </button>
          <button
            onClick={() => setMode("competitor")}
            className={`px-4 py-1 flex items-center gap-1.5 text-[13px] font-semibold rounded-md transition-colors ${mode === "competitor" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            <span className="material-symbols-outlined text-[16px]">radar</span>
            Competitor
          </button>
        </div>

        <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
          <Link
            href="/content-curator/settings"
            title="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </Link>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
}
