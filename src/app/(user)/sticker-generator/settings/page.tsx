"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getStickerKey,
  setStickerKey,
  removeStickerKey,
  type StickerKeyType,
} from "../lib/sticker-keys";

interface ProviderConfig {
  type: StickerKeyType;
  name: string;
  icon: string;
  description: string;
  docsUrl: string;
  placeholder: string;
  isJson?: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  {
    type: "gemini",
    name: "Google Gemini (AI Studio)",
    icon: "diamond",
    description: "Powers sticker analysis and generation via AI Studio API Key",
    docsUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIzaSy...",
  },
  {
    type: "vertex",
    name: "Vertex AI (API Key)",
    icon: "vpn_key",
    description: "Vertex AI Express — API Key from Google Cloud → Vertex AI Studio → API Keys",
    docsUrl: "https://console.cloud.google.com/vertex-ai/studio/settings/api-keys",
    placeholder: "AIzaSy...",
  },
  {
    type: "vertex-json",
    name: "Vertex AI (Service Account JSON)",
    icon: "cloud",
    description: "Enterprise access via Service Account JSON — for GCP production",
    docsUrl: "https://console.cloud.google.com/vertex-ai",
    placeholder: '{ "type": "service_account", ... }',
    isJson: true,
  },
  {
    type: "piapi",
    name: "PiAPI (Super Resolution & Flux)",
    icon: "api",
    description: "API Key from piapi.ai used for Upscaling and Flux Generation",
    docsUrl: "https://piapi.ai/workspace/api-key",
    placeholder: "piapi_...",
  },
];

const maskKey = (key: string): string => {
  if (key.startsWith("{")) return "{ Service Account JSON }";
  return key.length > 8 ? `${key.slice(0, 8)}...${key.slice(-4)}` : "****";
};

export default function StickerSettingsPage() {
  const [configuredKeys, setConfiguredKeys] = useState<Record<StickerKeyType, string | undefined>>({
    "vertex-json": undefined,
    vertex: undefined,
    gemini: undefined,
    piapi: undefined,
  });
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setConfiguredKeys({
      "vertex-json": getStickerKey("vertex-json"),
      vertex: getStickerKey("vertex"),
      gemini: getStickerKey("gemini"),
      piapi: getStickerKey("piapi"),
    });
  }, []);

  const handleSave = (type: StickerKeyType, isJson?: boolean) => {
    const value = inputs[type]?.trim();
    if (!value) return;

    if (isJson) {
      try {
        JSON.parse(value);
      } catch {
        setMessage({ type: "error", text: "Invalid JSON format. Paste the entire Service Account JSON file." });
        setTimeout(() => setMessage(null), 5000);
        return;
      }
    }

    setStickerKey(type, value);
    setConfiguredKeys((prev) => ({ ...prev, [type]: value }));
    setInputs((prev) => ({ ...prev, [type]: "" }));
    setMessage({ type: "success", text: "API key saved to your browser!" });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = (type: StickerKeyType) => {
    if (!confirm("Remove this API key from your browser?")) return;
    removeStickerKey(type);
    setConfiguredKeys((prev) => ({ ...prev, [type]: undefined }));
    setMessage({ type: "success", text: "API key removed." });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
                <span className="material-symbols-outlined text-primary">key</span>
                Sticker Generator — API Keys
              </h1>
              <p className="text-sm text-slate-500">Manage AI provider keys for Sticker Generator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-4">
        {message && (
          <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            <span className="material-symbols-outlined text-sm">
              {message.type === "success" ? "check_circle" : "error"}
            </span>
            {message.text}
          </div>
        )}

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary mt-0.5">info</span>
            <div>
              <p className="text-sm font-semibold text-slate-700">How API Keys Work</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Keys are saved in <strong>your browser only</strong> (localStorage) and are never
                shared with other users or browser sessions. Each browser stores its own keys
                independently. Keys from{" "}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">.env.local</code>{" "}
                are always active on the server and take priority.
              </p>
            </div>
          </div>
        </div>

        {PROVIDERS.map((provider) => {
          const currentKey = configuredKeys[provider.type];
          const isConfigured = !!currentKey;
          const inputValue = inputs[provider.type] || "";

          return (
            <div key={provider.type} className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isConfigured ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                    <span className="material-symbols-outlined">{provider.icon}</span>
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
                    <p className="text-xs text-slate-500 mt-0.5">{provider.description}</p>
                  </div>
                </div>

                {isConfigured && (
                  <button
                    onClick={() => handleDelete(provider.type)}
                    className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Remove
                  </button>
                )}
              </div>

              <div className="px-5 pb-5">
                {isConfigured ? (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <code className="text-sm text-slate-600 font-mono flex-1">{maskKey(currentKey)}</code>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">browser</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {provider.isJson ? (
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputs((prev) => ({ ...prev, [provider.type]: e.target.value }))}
                        placeholder={provider.placeholder}
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-mono outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-slate-400 resize-none"
                      />
                    ) : (
                      <input
                        type="password"
                        value={inputValue}
                        onChange={(e) => setInputs((prev) => ({ ...prev, [provider.type]: e.target.value }))}
                        placeholder={provider.placeholder}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-mono outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-slate-400"
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSave(provider.type, provider.isJson)}
                        disabled={!inputValue.trim()}
                        className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">save</span>
                        Save
                      </button>
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
