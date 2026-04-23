"use client";

import Link from "next/link";
import { useState } from "react";
import SettingsPanel from "./SettingsPanel";

export default function StickerNav() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 z-40 w-full font-sans">
        <Link
          href="/sticker-generator"
          className="text-[17px] font-bold tracking-tight text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">brush</span>
          AI Sticker Generator
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="px-4 py-1.5 flex items-center gap-1.5 text-[13px] font-semibold rounded-md transition-colors text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            Home
          </Link>

          <Link
            href="/sticker-generator/library"
            className="px-4 py-1.5 flex items-center gap-1.5 text-[13px] font-semibold rounded-md transition-colors text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">photo_library</span>
            Library
          </Link>

          <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-6 ml-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 border border-white/20 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              SG
            </div>
          </div>
        </div>
      </header>

      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
