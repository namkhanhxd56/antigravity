"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Determine current app settings path
  const getSettingsPath = () => {
    if (pathname.startsWith("/sticker-generator")) return "/sticker-generator/settings";
    if (pathname.startsWith("/content-curator")) return "/content-curator/settings";
    if (pathname.startsWith("/fba-label")) return "/fba-label/settings";
    return "/settings";
  };

  // Determine app-specific title/logo
  const getAppInfo = () => {
    if (pathname.startsWith("/sticker-generator")) return { title: "StickerGen AI", href: "/sticker-generator" };
    if (pathname.startsWith("/content-curator")) return { title: "Content Curator", href: "/content-curator" };
    if (pathname.startsWith("/fba-label")) return { title: "FBA Label Tool", href: "/fba-label" };
    return { title: "AI Studio", href: "/" };
  };

  const appInfo = getAppInfo();

  return (
    <header className="flex items-center justify-between border-b border-slate-300 dark:border-zinc-800 px-6 py-3 bg-white dark:bg-zinc-950 shrink-0 h-[64px]">
      {/* Logo */}
      <Link href={appInfo.href} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
        <div className="bg-primary p-1.5 rounded-lg text-white">
          <span className="material-symbols-outlined block">auto_awesome</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {appInfo.title}
        </h2>
      </Link>

      {/* Search */}
      <div className="flex flex-1 justify-center max-w-xl px-8">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary text-sm text-slate-800 dark:text-zinc-200 outline-none placeholder-slate-500"
            placeholder="Search your library..."
            type="text"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleDarkMode}
          className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg text-slate-600 dark:text-zinc-400 transition-colors"
          title="Toggle Dark Mode"
        >
          <span className="material-symbols-outlined">
            {mounted && theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>
        
        <Link
          href={getSettingsPath()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg text-slate-600 dark:text-zinc-400 transition-colors"
          title="App Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </Link>

        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-violet-500 ml-2 border border-slate-300 dark:border-zinc-700 flex items-center justify-center text-white text-xs font-bold">
          U
        </div>
      </div>
    </header>
  );
}
