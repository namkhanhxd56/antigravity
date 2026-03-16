import { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredApiKey, setStoredApiKey } from "@/lib/client-key-storage";

export default function TopNav() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  useEffect(() => {
    // Load existing key from localStorage when the component mounts
    const savedKey = getStoredApiKey();
    if (savedKey) {
      setApiKeyInput(savedKey);
    }
  }, []);

  const handleSaveKey = () => {
    setStoredApiKey(apiKeyInput);
    setIsSettingsOpen(false);
    // Optionally trigger a reload or toast here
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
            <h2 className="text-xl font-bold text-slate-900 mb-2">API Settings</h2>
            <p className="text-sm text-slate-500 mb-6">
              Enter your Gemini API Key to use this app. Your key is stored locally in your browser and never saved on our servers.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <button
                onClick={handleSaveKey}
                className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

