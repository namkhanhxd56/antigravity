"use client";

import { useState, useEffect, useCallback } from "react";

export interface ContentLimits {
  title: number;
  bulletItem: number;
  description: number;
  searchTerms: number;
}

const DEFAULTS: ContentLimits = {
  title: 200,
  bulletItem: 500,
  description: 2000,
  searchTerms: 250,
};

const STORAGE_KEY = "amz_content_limits";

function load(): ContentLimits {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function useContentLimits() {
  const [limits, setLimits] = useState<ContentLimits>(DEFAULTS);

  useEffect(() => {
    setTimeout(() => setLimits(load()), 0);
  }, []);

  const save = useCallback((next: ContentLimits) => {
    setLimits(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // Dispatch event so other components on the same page update
    window.dispatchEvent(new CustomEvent("amz-limits-updated", { detail: next }));
  }, []);

  // Listen for updates from other components (e.g. Settings modal)
  useEffect(() => {
    const handler = (e: Event) => {
      setLimits((e as CustomEvent<ContentLimits>).detail);
    };
    window.addEventListener("amz-limits-updated", handler);
    return () => window.removeEventListener("amz-limits-updated", handler);
  }, []);

  return { limits, save };
}
