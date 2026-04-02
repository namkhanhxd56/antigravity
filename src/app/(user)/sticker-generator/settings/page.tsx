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
    key: "STICKER_GEMINI_API_KEY",
    name: "Google Gemini",
    icon: "diamond",
    description: "Powers sticker analysis and generation via Gemini Flash Image",
    docsUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIzaSy...",
  },
  {
    key: "STICKER_VERTEX_AI_JSON",
    name: "Vertex AI (GCP)",
    icon: "cloud",
    description: "Enterprise access via Service Account JSON content",
    docsUrl: "https://console.cloud.google.com/vertex-ai",
    placeholder: '{ "type": "service_account", ... }',
  },
  {
    key: "IDEOGRAM_API_KEY",
    name: "Ideogram 2.0",
    icon: "text_fields",
    description: "Best-in-class typography and text-heavy sticker designs",
    docsUrl: "https://ideogram.ai/manage-api",
    placeholder: "ig-...",
  },
  {
    key: "OPENAI_API_KEY",
    name: "OpenAI (DALL·E 3)",
    icon: "auto_awesome",
    description: "Creative and artistic sticker compositions",
    docsUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-...",
  },
];

interface KeyStatus {
  configured: boolean;
  source: "env" | "stored" | null;
  preview: string;
}

export default function StickerSettingsPage() {
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

  const handleSave = useCallback(
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

  const handleDelete = useCallback(async (providerKey: string) => {
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-300 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/sticker-generator"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  key
                </span>
                Sticker Generator — API Keys
              </h1>
              <p className="text-sm text-slate-500">
                Manage AI provider keys for Sticker Generator
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-4">
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

        {/* Info Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary mt-0.5">
              info
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                How API Keys Work
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Keys saved here are stored securely on the server and take
                effect immediately — no restart needed. Keys from{" "}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">
                  .env.local
                </code>{" "}
                take priority over keys added here. Only models with configured
                keys will be available for sticker generation.
              </p>
            </div>
          </div>
        </div>

        {/* Provider Cards */}
        {PROVIDERS.map((provider) => {
          const status = keyStatus[provider.key];
          const isConfigured = status?.configured;
          const isSaving = saving === provider.key;
          const inputValue = inputs[provider.key] || "";

          return (
            <div
              key={provider.key}
              className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden"
            >
              {/* Provider Header */}
              <div className="p-5 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isConfigured
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {provider.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      {provider.name}
                      {isConfigured && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {provider.description}
                    </p>
                  </div>
                </div>

                {isConfigured && (
                  <button
                    onClick={() => handleDelete(provider.key)}
                    disabled={isSaving || status?.source === "env"}
                    title={
                      status?.source === "env"
                        ? "Key is set in .env.local — remove it there"
                        : "Remove this key"
                    }
                    className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                    Remove
                  </button>
                )}
              </div>

              {/* Key Status / Input */}
              <div className="px-5 pb-5">
                {isConfigured ? (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <code className="text-sm text-slate-600 font-mono flex-1">
                      {status.preview}
                    </code>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      via {status.source === "env" ? ".env.local" : "Settings"}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={inputValue}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            [provider.key]: e.target.value,
                          }))
                        }
                        placeholder={provider.placeholder}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-mono outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-slate-400"
                      />
                      <button
                        onClick={() => handleSave(provider.key)}
                        disabled={!inputValue.trim() || isSaving}
                        className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <span className="material-symbols-outlined text-sm animate-spin">
                              progress_activity
                            </span>
                            Saving
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">
                              save
                            </span>
                            Save
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Get your key at{" "}
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-semibold hover:underline"
                      >
                        {provider.docsUrl.replace("https://", "")}
                      </a>
                    </p>
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
