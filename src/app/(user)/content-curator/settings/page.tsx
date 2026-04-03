"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getCuratorModel, setCuratorModel } from "../lib/client-storage";
import { useContentLimits, type ContentLimits } from "../lib/useContentLimits";
import { useTheme } from "next-themes";
import { GEMINI_MODELS, type GeminiModel } from "../components/ContentCuratorNav";

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
    description: "Powers Amazon product analysis and content generation via AI Studio",
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

export default function CuratorSettingsPage() {
  const [keyStatus, setKeyStatus] = useState<Record<string, KeyStatus>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { limits, save: saveLimits } = useContentLimits();
  const [draftRaw, setDraftRaw] = useState<Record<keyof ContentLimits, string>>({
    title: String(limits.title),
    bulletItem: String(limits.bulletItem),
    description: String(limits.description),
    searchTerms: String(limits.searchTerms),
  });

  // Sync draftRaw whenever limits load/change
  useEffect(() => {
    setDraftRaw({
      title: String(limits.title),
      bulletItem: String(limits.bulletItem),
      description: String(limits.description),
      searchTerms: String(limits.searchTerms),
    });
  }, [limits]);

  useEffect(() => {
    // Load key status from server
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setKeyStatus(data.status);
      })
      .catch((err) => console.error("Failed to load settings:", err));
    
    // Load local model preference
    setSelectedModel(getCuratorModel());
  }, []);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSaveModel = (model: string) => {
    setSelectedModel(model);
    setCuratorModel(model);
    setMessage({ type: "success", text: "Model preference saved locally." });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleSaveKey = useCallback(
    async (providerKey: string) => {
      const value = inputs[providerKey];
      if (!value?.trim()) return;

      setSaving(providerKey);
      setMessage(null);

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
          setMessage({ type: "success", text: "API key saved successfully!" });
        } else {
          setMessage({
            type: "error",
            text: data.error || "Failed to save key",
          });
        }
      } catch {
        setMessage({ type: "error", text: "Network error. Please try again." });
      } finally {
        setSaving(null);
        setTimeout(() => setMessage(null), 3000);
      }
    },
    [inputs]
  );

  const handleDeleteKey = useCallback(async (providerKey: string) => {
    if (!confirm("Remove this API key from server?")) return;

    setSaving(providerKey);
    setMessage(null);

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
    } catch {
      setMessage({ type: "error", text: "Failed to remove key." });
    } finally {
      setSaving(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }, []);

  const handleLimitChange = (field: keyof ContentLimits, raw: string) => {
    setDraftRaw((prev) => ({ ...prev, [field]: raw }));
  };

  const handleSaveLimits = () => {
    const next: ContentLimits = {
      title: parseInt(draftRaw.title, 10) || 200,
      bulletItem: parseInt(draftRaw.bulletItem, 10) || 500,
      description: parseInt(draftRaw.description, 10) || 2000,
      searchTerms: parseInt(draftRaw.searchTerms, 10) || 250,
    };
    saveLimits(next);
    setMessage({ type: "success", text: "Content limits saved successfully!" });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleResetLimits = () => {
    const defaults = { title: 200, bulletItem: 500, description: 2000, searchTerms: 250 };
    saveLimits(defaults);
    setMessage({ type: "success", text: "Content limits reset to defaults." });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-300 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/content-curator"
              className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  settings
                </span>
                Content Curator Settings
              </h1>
              <p className="text-sm text-slate-500">
                Configure AI models and API credentials for Amazon tools
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Status Message */}
        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {message.type === "success" ? "check_circle" : "error"}
            </span>
            {message.text}
          </div>
        )}

        {/* Appearance Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-300 dark:border-zinc-800 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">palette</span>
            Appearance
          </h3>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">Dark Mode</div>
              <div className="text-xs text-slate-500 text-pretty">Toggle between light and dark theme for the interface</div>
            </div>
            {mounted && (
              <button
                role="switch"
                aria-checked={theme === "dark"}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${theme === "dark" ? "bg-primary" : "bg-slate-300"}`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Model Selection Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-300 dark:border-zinc-800 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">psychology</span>
            Preferred AI Model
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => handleSaveModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer"
              >
                {GEMINI_MODELS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-white dark:bg-zinc-900">
                    {m.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                unfold_more
              </span>
            </div>
            <p className="text-xs text-slate-500 px-1 italic">
              Changes reflect across all AI generation and rewriting features.
            </p>
          </div>
        </div>

        {/* Content Limits Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-300 dark:border-zinc-800 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">straighten</span>
              Content Limits (Chars)
            </div>
            <button
              onClick={handleResetLimits}
              className="text-xs font-semibold text-slate-400 hover:text-primary transition-colors"
            >
              Reset to Defaults
            </button>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(
              [
                { key: "title", label: "Product Title", desc: "Max length for the main title" },
                { key: "bulletItem", label: "Bullet Point", desc: "Max length for each feature bullet" },
                { key: "description", label: "Description", desc: "Max length for product description" },
                { key: "searchTerms", label: "Search Terms", desc: "Max length for backend keywords" },
              ] as const
            ).map(({ key, label, desc }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">{label}</label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key}</span>
                </div>
                <input
                  type="number"
                  value={draftRaw[key]}
                  onChange={(e) => handleLimitChange(key, e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-[11px] text-slate-400">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveLimits}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Save Limits
            </button>
          </div>
        </div>

        {/* Provider Cards */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white px-1">API Credentials</h3>
          {PROVIDERS.map((provider) => {
            const status = keyStatus[provider.key];
            const isConfigured = status?.configured;
            const isSaving = saving === provider.key;
            const inputValue = inputs[provider.key] || "";

            return (
              <div
                key={provider.key}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-300 dark:border-zinc-800 shadow-sm overflow-hidden"
              >
                <div className="p-5 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isConfigured ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                      <span className="material-symbols-outlined">{provider.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {provider.name}
                        {isConfigured && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase border border-emerald-200">Active</span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{provider.description}</p>
                    </div>
                  </div>

                  {isConfigured && (
                    <button
                      onClick={() => handleDeleteKey(provider.key)}
                      disabled={isSaving || status?.source === "env"}
                      className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Remove
                    </button>
                  )}
                </div>

                <div className="px-5 pb-5">
                  {isConfigured ? (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800 rounded-lg p-3 border border-slate-200 dark:border-zinc-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <code className="text-sm text-slate-600 dark:text-zinc-400 font-mono flex-1">{status.preview}</code>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">via {status.source}</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={inputValue}
                        onChange={(e) => setInputs(prev => ({ ...prev, [provider.key]: e.target.value }))}
                        placeholder={provider.placeholder}
                        className="flex-1 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => handleSaveKey(provider.key)}
                        disabled={!inputValue.trim() || isSaving}
                        className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-40"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
