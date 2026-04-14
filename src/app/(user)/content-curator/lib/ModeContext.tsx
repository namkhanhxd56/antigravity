"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type CuratorMode = "create" | "compare";

interface ModeContextType {
  mode: CuratorMode;
  setMode: (mode: CuratorMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CuratorMode>("create");

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useCuratorMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useCuratorMode must be used within a ModeProvider");
  }
  return context;
}
