"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useContentLimits, type ContentLimits } from "../lib/useContentLimits";
import { getCuratorApiKey, setCuratorApiKey, removeCuratorApiKey, getCuratorModel, setCuratorModel } from "@/lib/client-key-storage";
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
    <>
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
            <button
              onClick={handleOpen}
              title="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
              <span className="material-symbols-outlined text-[22px]">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Settings Panel ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />

          {/* Slide-in Panel */}
          <div className="fixed right-0 top-0 z-50 flex h-full w-[320px] flex-col bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800">

            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
              <h2 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">Settings</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

              {/* ── Appearance ── */}
              <div className="space-y-3">
                <Section title="Appearance" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">Dark mode</p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Toggle dark theme for the app</p>
                  </div>
                  <Toggle checked={mounted ? theme === "dark" : false} onChange={handleDarkMode} />
                </div>
              </div>

              <hr className="border-zinc-100 dark:border-zinc-800" />

              {/* ── AI Model ── */}
              <div className="space-y-3">
                <Section title="AI Model" />
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Gemini model
                  </label>
                  <div className="relative">
                    <select
                      value={model}
                      onChange={(e) => handleModelChange(e.target.value as GeminiModel)}
                      className="w-full appearance-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-2.5 pl-3 pr-8 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 focus:border-[#EA580C] dark:focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    >
                      {GEMINI_MODELS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                      <span className="material-symbols-outlined text-zinc-400 text-[18px]">expand_more</span>
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-zinc-100 dark:border-zinc-800" />

              {/* ── API Key ── */}
              <div className="space-y-3">
                <Section title="API Key" />

                {apiKeyStatus === "saved" && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
                      <span className="text-[12px] font-medium text-emerald-700">
                        Key saved: {maskKey(getCuratorApiKey() ?? "")}
                      </span>
                    </div>
                    <button
                      onClick={handleClearKey}
                      className="text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {apiKeyStatus === "saved" ? "Replace key" : "Gemini API Key"}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? "text" : "password"}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="AIza..."
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-2.5 pl-3 pr-9 text-[13px] text-zinc-700 dark:text-zinc-200 focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((v) => !v)}
                        className="absolute inset-y-0 right-2 flex items-center text-zinc-400 hover:text-zinc-600"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {showKey ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <button
                      onClick={handleSaveKey}
                      disabled={!apiKeyInput.trim()}
                      className="rounded-lg bg-zinc-800 px-4 text-[13px] font-semibold text-white hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-zinc-100 dark:border-zinc-800" />

              {/* ── Content Limits ── */}
              <div className="space-y-3">
                <Section title="Content Limits" />

                {(
                  [
                    { key: "title", label: "Title" },
                    { key: "bulletItem", label: "Bullet point" },
                    { key: "description", label: "Description" },
                    { key: "searchTerms", label: "Search terms" },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
                    </div>
                    <input
                      type="number"
                      min={10}
                      value={draftRaw[key]}
                      onChange={(e) => handleLimitChange(key, e.target.value)}
                      className="w-20 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-center text-[13px] font-semibold text-zinc-700 dark:text-zinc-200 focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    />
                  </div>
                ))}
              </div>

            </div>

            {/* Panel Footer */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4 flex gap-3">
              <button
                onClick={handleResetLimits}
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 py-2.5 text-[13px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Reset limits
              </button>
              <button
                onClick={handleSaveLimits}
                className="flex-1 rounded-lg bg-[#EA580C] py-2.5 text-[13px] font-semibold text-white hover:bg-[#c2440a] transition-colors"
              >
                Save limits
              </button>
            </div>

          </div>
        </>
      )}
    </>
  );
}
