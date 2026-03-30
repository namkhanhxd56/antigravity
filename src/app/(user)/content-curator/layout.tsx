import Link from "next/link";
import { ReactNode } from "react";

export default function ContentCuratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F3F4F6] text-zinc-900 antialiased overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 shadow-sm z-10 w-full">
        <div className="flex items-center gap-2">
          <Link
            href="/content-curator"
            className="text-xl font-bold tracking-tight text-[#EA580C] hover:opacity-90 transition-opacity"
          >
            AMZ Content Curator
          </Link>
        </div>
        
        <div className="flex items-center gap-5 text-zinc-500">
          <button className="hover:text-zinc-800 transition-colors">
            <span className="material-symbols-outlined text-2xl">notifications</span>
          </button>
          <button className="hover:text-zinc-800 transition-colors">
            <span className="material-symbols-outlined text-2xl">settings</span>
          </button>
          <button className="hover:text-zinc-800 transition-colors">
            <span className="material-symbols-outlined text-2xl">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="mx-auto max-w-[1600px] h-full">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t-4 border-[#EA580C] bg-[#111827] py-3 text-center text-xs font-medium tracking-wider text-zinc-400">
        DEVELOPED BY AI STEPHEN 10K3D
      </footer>
    </div>
  );
}
