import type { ReactNode } from "react";

export const metadata = { title: "FBA Label Tool" };

export default function FbaLabelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#daf0fb] text-[#0d2d3a]">
      {children}
    </div>
  );
}
