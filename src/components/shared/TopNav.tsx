import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { getStoredApiKey, setStoredApiKey } from "@/lib/client-key-storage";
import { useContentLimits } from "@/app/(user)/content-curator/lib/useContentLimits";

export default function TopNav() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
  const { limits, save: saveLimits } = useContentLimits();
  const [limitInputs, setLimitInputs] = useState({ title: "", bulletItem: "", description: "", searchTerms: "" });

  // Sync displayed limit inputs when limits load
  useEffect(() => {
    setTimeout(() => {
      setLimitInputs({
        title: String(limits.title),
        bulletItem: String(limits.bulletItem),
        description: String(limits.description),
        searchTerms: String(limits.searchTerms),
      });
    }, 0);
  }, [limits]);

  useEffect(() => {
    // Load existing key from localStorage when the component mounts
    const savedKey = getStoredApiKey();
    if (savedKey) {
      setTimeout(() => setApiKeyInput(savedKey), 0);
    }
    setTimeout(() => {
      setMounted(true);
      
      const savedModel = localStorage.getItem("selectedModel");
      if (savedModel) setSelectedModel(savedModel);
    }, 0);
  }, []);

  const handleSaveKey = () => {
    setStoredApiKey(apiKeyInput);
    localStorage.setItem("selectedModel", selectedModel);
    // Save content limits
    saveLimits({
      title: Number(limitInputs.title) || limits.title,
      bulletItem: Number(limitInputs.bulletItem) || limits.bulletItem,
      description: Number(limitInputs.description) || limits.description,
      searchTerms: Number(limitInputs.searchTerms) || limits.searchTerms,
    });
    setIsSettingsOpen(false);
  };

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  return (
    <header className="flex items-center justify-between border-b border-slate-300 px-6 py-3 bg-white shrink-0">
      {/* Logo */}
      <Link href="/sticker-generator" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
        <div className="bg-primary p-1.5 rounded-lg text-white">
          <span className="material-symbols-outlined block">auto_awesome</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          StickerGen AI
        </h2>
      </Link>

      {/* Search */}
      <div className="flex flex-1 justify-center max-w-xl px-8">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            className="w-full bg-slate-100 border border-slate-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary text-sm text-slate-800 outline-none placeholder-slate-500"
            placeholder="Search your library..."
            type="text"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          title="API Key Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-violet-500 ml-2 border border-slate-300 flex items-center justify-center text-white text-xs font-bold">
          U
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-2">App Settings</h2>
            <p className="text-sm text-slate-500 mb-6">
              Configure your AI models, API keys, and app preferences. Keys are stored locally.
            </p>

            <div className="space-y-4">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Dark Mode</label>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${mounted && theme === "dark" ? 'bg-[#EA580C]' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mounted && theme === "dark" ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Model Select */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  AI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#EA580C] outline-none text-sm text-slate-800"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced)</option>
                </select>
              </div>

              {/* Content Limits */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Amazon Character Limits</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "title", label: "Title" },
                    { key: "bulletItem", label: "Each Bullet" },
                    { key: "description", label: "Description" },
                    { key: "searchTerms", label: "Keywords" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-slate-500 mb-0.5">{label}</label>
                      <input
                        type="number"
                        min={1}
                        value={limitInputs[key as keyof typeof limitInputs]}
                        onChange={(e) => setLimitInputs(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#EA580C] outline-none text-sm text-slate-800"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#EA580C] outline-none text-sm text-slate-800"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveKey}
                  className="w-full bg-[#111827] text-white font-bold py-2.5 rounded-lg hover:bg-black transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

