"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCuratorModel, setCuratorModel } from "../lib/client-storage";
import { useContentLimits, type ContentLimits } from "../lib/useContentLimits";
import { useTheme } from "next-themes";
import { GEMINI_MODELS } from "./ContentCuratorNav";

interface ProviderInfo {
  key: string;
  name: string;
  icon: string;
  description: string;
  docsUrl: string;
  placeholder: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    key: "CURATOR_GEMINI_API_KEY",
    name: "Google Gemini (AI Studio)",
    icon: "diamond",
    description: "Powers content generation via AI Studio API Key",
    docsUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIzaSy...",
  },
  {
    key: "CURATOR_VERTEX_API_KEY",
    name: "Vertex AI (API Key)",
    icon: "vpn_key",
    description: "Vertex AI Express — API Key từ Google Cloud Console → Vertex AI Studio → API Keys",
    docsUrl: "https://console.cloud.google.com/vertex-ai/studio/settings/api-keys",
    placeholder: "AIzaSy...",
  },
  {
    key: "CURATOR_VERTEX_AI_JSON",
    name: "Vertex AI (Service Account JSON)",
    icon: "cloud",
    description: "Enterprise access via Service Account JSON — dành cho GCP production",
    docsUrl: "https://console.cloud.google.com/vertex-ai",
    placeholder: '{ "type": "service_account", ... }',
  }
];

interface KeyStatus {
  configured: boolean;
  source: "env" | "stored" | null;
  preview: string;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [keyStatus, setKeyStatus] = useState<Record<string, KeyStatus>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { limits, save: saveLimits } = useContentLimits();
  const [draftRaw, setDraftRaw] = useState<Record<keyof ContentLimits, string>>({
    title: String(limits.title),
    bulletItem: String(limits.bulletItem),
    description: String(limits.description),
    searchTerms: String(limits.searchTerms),
  });

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Sync draftRaw when limits load
  useEffect(() => {
    setDraftRaw({
      title: String(limits.title),
      bulletItem: String(limits.bulletItem),
      description: String(limits.description),
      searchTerms: String(limits.searchTerms),
    });
  }, [limits]);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.status) setKeyStatus(data.status);
        });
      setSelectedModel(getCuratorModel());
    }
  }, [isOpen]);

  const handleSaveModel = (model: string) => {
    setSelectedModel(model);
    setCuratorModel(model);
    setMessage({ type: "success", text: "Model preference saved." });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleSaveKey = async (providerKey: string) => {
    const value = inputs[providerKey];
    if (!value?.trim()) return;

    setSaving(providerKey);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: providerKey, value: value.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setKeyStatus(data.status);
        setInputs((prev) => ({ ...prev, [providerKey]: "" }));
        setMessage({ type: "success", text: "API key saved!" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save key." });
    } finally {
      setSaving(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteKey = async (providerKey: string) => {
    if (!confirm("Remove this API key?")) return;
    setSaving(providerKey);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: providerKey, value: "" }),
      });
      const data = await res.json();
      if (data.success) {
        setKeyStatus(data.status);
        setMessage({ type: "success", text: "API key removed." });
      }
    } finally {
      setSaving(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSaveLimits = () => {
    saveLimits({
      title: parseInt(draftRaw.title, 10) || 200,
      bulletItem: parseInt(draftRaw.bulletItem, 10) || 500,
      description: parseInt(draftRaw.description, 10) || 2000,
      searchTerms: parseInt(draftRaw.searchTerms, 10) || 250,
    });
    setMessage({ type: "success", text: "Limits saved!" });
    setTimeout(() => setMessage(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300">
        <header className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">settings</span>
              Curator Settings
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Configure your Amazon tool preferences</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {message && (
            <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-200 ${
              message.type === "success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}>
              <span className="material-symbols-outlined text-sm">{message.type === "success" ? "check_circle" : "error"}</span>
              {message.text}
            </div>
          )}

          {/* 1. Content Limits (Reordered to top) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">straighten</span>
                Content Limits
              </h3>
              <button 
                onClick={() => {
                  saveLimits({ title: 200, bulletItem: 500, description: 2000, searchTerms: 250 });
                  setMessage({ type: "success", text: "Reset to defaults." });
                }}
                className="text-[10px] font-bold text-zinc-400 hover:text-primary transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(draftRaw) as Array<keyof ContentLimits>).map((key) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type="number"
                    value={draftRaw[key]}
                    onChange={(e) => setDraftRaw(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={handleSaveLimits}
              className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/20"
            >
              Save Limits
            </button>
          </section>

          {/* 2. AI Model (Reordered) */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              AI Model
            </h3>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => handleSaveModel(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-zinc-900 dark:text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer"
              >
                {GEMINI_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-[18px]">unfold_more</span>
            </div>
          </section>

          {/* 3. API Keys */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">vpn_key</span>
              Credentials
            </h3>
            <div className="space-y-3">
              {PROVIDERS.map((provider) => {
                const status = keyStatus[provider.key];
                const isConfigured = status?.configured;
                const isSaving = saving === provider.key;

                return (
                  <div key={provider.key} className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-zinc-400">{provider.icon}</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{provider.name}</span>
                      </div>
                      {isConfigured && (
                        <button 
                          onClick={() => handleDeleteKey(provider.key)}
                          className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {isConfigured ? (
                      <div className="flex justify-between items-center bg-white dark:bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <code className="text-[10px] text-emerald-500 font-mono">{status.preview}</code>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">via {status.source}</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={inputs[provider.key] || ""}
                          onChange={(e) => setInputs(v => ({ ...v, [provider.key]: e.target.value }))}
                          placeholder="Paste key here..."
                          className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-[10px] outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => handleSaveKey(provider.key)}
                          disabled={!inputs[provider.key] || isSaving}
                          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-[10px] font-bold disabled:opacity-50"
                        >
                          {isSaving ? "..." : "Save"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. Appearance */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">palette</span>
              Appearance
            </h3>
            <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-zinc-400">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Dark Mode</span>
              </div>
              {mounted && (
                <button
                  role="switch"
                  aria-checked={theme === "dark"}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${theme === "dark" ? "bg-primary" : "bg-zinc-300"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-5.5" : "translate-x-1"}`} />
                </button>
              )}
            </div>
          </section>
        </div>

        <footer className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <button 
            onClick={onClose}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
          >
            Close Settings
          </button>
        </footer>
      </div>
    </div>
  );
}
