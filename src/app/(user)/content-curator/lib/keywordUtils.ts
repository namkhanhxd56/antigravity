/**
 * Keyword parsing utilities — shared across Content Curator components.
 *
 * Convention: keyword lines may end with a volume suffix —
 *   "cute sticker 12000"   → keyword "cute sticker", volume 12000
 *   "cute sticker -"       → keyword "cute sticker", volume null
 *   "cute sticker"         → keyword "cute sticker", volume null
 */

export interface ParsedKeyword {
  kw: string;
  volume: number | null;
}

/** Strip trailing volume number or "-" from a keyword line */
export function stripVolume(line: string): string {
  return line.replace(/\s+(\d+|-)\s*$/, "").trim();
}

/** Parse raw keyword textarea → deduplicated array of keyword strings (no volume) */
export function parseKeywords(raw: string): string[] {
  const lines = raw.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const kw = stripVolume(line);
    if (kw && !seen.has(kw.toLowerCase())) {
      seen.add(kw.toLowerCase());
      result.push(kw);
    }
  }
  return result;
}

/** Parse raw keyword lines, extracting keyword string + optional volume */
export function parseKeywordsWithVolume(raw: string): ParsedKeyword[] {
  const lines = raw.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const result: ParsedKeyword[] = [];
  for (const line of lines) {
    const volumeMatch = line.match(/\s+([\d,]+|-)\s*$/);
    const kw = volumeMatch
      ? line.slice(0, line.length - volumeMatch[0].length).trim()
      : line.trim();
    let volume: number | null = null;
    if (volumeMatch && volumeMatch[1] !== "-") {
      const n = parseInt(volumeMatch[1].replace(/,/g, ""), 10);
      if (!isNaN(n)) volume = n;
    }
    if (kw && !seen.has(kw.toLowerCase())) {
      seen.add(kw.toLowerCase());
      result.push({ kw, volume });
    }
  }
  return result;
}

/** Format volume number compactly: 12000 → "12K", 1500000 → "1.5M" */
export function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}
