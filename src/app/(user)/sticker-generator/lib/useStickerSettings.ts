"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getStickerAnalysisModel, setStickerAnalysisModel, 
  getStickerImageModel, setStickerImageModel 
} from "./client-storage";

export interface StickerSettings {
  analysisModel: string;
  imageModel: string;
}

export function useStickerSettings() {
  const [settings, setSettings] = useState<StickerSettings>({
    analysisModel: "gemini-2.0-flash",
    imageModel: "gemini-2.0-flash",
  });

  useEffect(() => {
    setSettings({
      analysisModel: getStickerAnalysisModel(),
      imageModel: getStickerImageModel(),
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<StickerSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      if (updates.analysisModel) setStickerAnalysisModel(updates.analysisModel);
      if (updates.imageModel) setStickerImageModel(updates.imageModel);
      return next;
    });
  }, []);

  const refreshSettings = useCallback(() => {
    setSettings({
      analysisModel: getStickerAnalysisModel(),
      imageModel: getStickerImageModel(),
    });
  }, []);

  return {
    settings,
    updateSettings,
    refreshSettings,
  };
}
