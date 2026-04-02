"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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
    key: "GEMINI_API_KEY",
    name: "Google Gemini (AI Studio)",
    icon: "diamond",
    description: "Powers barcode analysis and label generation logic",
    docsUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIzaSy...",
  }
];

interface KeyStatus {
  configured: boolean;
  source: "env" | "stored" | null;
  preview: string;
}

export default function FbaSettingsPage() {
  const [keyStatus, setKeyStatus] = useState<Record<string, KeyStatus>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setKeyStatus(data.status);
      })
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

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
    if (!confirm("Remove this API key?")) return;

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-300 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/fba-label"
              className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">label</span>
                FBA Label Tool Settings
              </h1>
              <p className="text-sm text-slate-500">
                Configure API credentials for barcode processing
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-4">
        {message && (
          <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            <span className="material-symbols-outlined text-sm">{message.type === "success" ? "check_circle" : "error"}</span>
            {message.text}
          </div>
        )}

        {PROVIDERS.map((provider) => {
          const status = keyStatus[provider.key];
          const isConfigured = status?.configured;
          const isSaving = saving === provider.key;
          const inputValue = inputs[provider.key] || "";

          return (
            <div key={provider.key} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-300 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isConfigured ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                    <span className="material-symbols-outlined">{provider.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{provider.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{provider.description}</p>
                  </div>
                </div>
                {isConfigured && (
                  <button onClick={() => handleDeleteKey(provider.key)} disabled={isSaving || status?.source === "env"} className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
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
                    <button onClick={() => handleSaveKey(provider.key)} disabled={!inputValue.trim() || isSaving} className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-40">
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
