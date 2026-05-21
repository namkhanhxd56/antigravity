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

/**
 * Count how many times a keyword appears in text as a WHOLE PHRASE.
 *
 * Word boundaries prevent prefix/suffix matches:
 *   "mechanic sticker" does NOT match "mechanic stickers"  (singular ≠ plural)
 *   "cat" does NOT match "category"
 *
 * Lookbehind/lookahead is used (not consuming `\W`) so back-to-back
 * occurrences are still counted, e.g. "sticker sticker" → 2.
 */
export function countKeywordOccurrences(text: string, keyword: string): number {
  if (!text || !keyword) return 0;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?<=^|\\W)${escaped}(?=$|\\W)`, "gi");
  return text.match(regex)?.length ?? 0;
}

/**
 * Compute per-keyword occurrence counts in text.
 * Returns a map of lowercase keyword → count (entries with 0 are omitted).
 * Uses whole-phrase matching — see `countKeywordOccurrences`.
 */
export function computeKeywordCounts(text: string, keywords: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const kw of keywords) {
    const n = countKeywordOccurrences(text, kw);
    if (n > 0) counts[kw.toLowerCase()] = n;
  }
  return counts;
}

/**
 * Pick the most important keywords for the title pool.
 *
 * Ranking rule:
 *   1. Higher search volume wins (keywords without volume are treated as 0).
 *   2. Tie-breaker: earlier position in the user's keyword list wins
 *      — the user typically pastes the most relevant keyword first.
 *
 * Keywords already in `excludeSet` (e.g. assigned to bullets/description)
 * are skipped.
 *
 * @param parsed Keyword list in original input order (with volume metadata)
 * @param needed How many more keywords are needed
 * @param excludeSet Lowercase keyword strings that must be skipped
 * @returns Up to `needed` keyword strings, ranked by importance
 */
export function pickTitleSeeds(
  parsed: ParsedKeyword[],
  needed: number,
  excludeSet: Set<string>
): string[] {
  if (needed <= 0) return [];

  const candidates = parsed
    .map((p, i) => ({ ...p, pos: i }))
    .filter((p) => !excludeSet.has(p.kw.toLowerCase()));

  candidates.sort((a, b) => {
    const va = a.volume ?? 0;
    const vb = b.volume ?? 0;
    if (vb !== va) return vb - va;          // volume desc
    return a.pos - b.pos;                    // position asc (tie-break)
  });

  return candidates.slice(0, needed).map((c) => c.kw);
}
