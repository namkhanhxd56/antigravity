import { ReactNode } from "react";
import ContentCuratorNav from "../content-curator/components/ContentCuratorNav";
import { ModeProvider } from "../content-curator/lib/ModeContext";

export default function ContentCuratorV2Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ModeProvider>
      <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased overflow-hidden font-sans">
        <ContentCuratorNav />

        <main className="flex-1 overflow-auto bg-white dark:bg-zinc-950">
          <div className="mx-auto max-w-[1600px] h-full flex flex-col">
            {children}
          </div>
        </main>

        <footer className="shrink-0 border-t-4 border-[#EA580C] bg-[#111827] dark:bg-[#09090b] py-3 text-center text-xs font-medium tracking-wider text-zinc-400 dark:text-zinc-500">
          Created by Stephen 10K3D with AI assistance
        </footer>
      </div>
    </ModeProvider>
  );
}
