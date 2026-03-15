"use client";

import Link from "next/link";

export default function TopNav() {
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
        <Link
          href="/settings"
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          title="API Key Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </Link>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-violet-500 ml-2 border border-slate-300 flex items-center justify-center text-white text-xs font-bold">
          U
        </div>
      </div>
    </header>
  );
}

