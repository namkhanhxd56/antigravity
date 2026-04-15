/**
 * KeywordPool — thuật toán quản lý keyword giữa các bước pipeline.
 * Chạy hoàn toàn trên client-side (không cần API).
 */

export interface KeywordPool {
  /** Keywords được user assign cho từng section */
  assigned: {
    title: string[];
    bullets: string[];
    description: string[];
  };
  /** Keywords chưa được assign, hoặc đã được trả lại sau khi step không dùng */
  available_pool: string[];
  /** Keywords đã được dùng (xác nhận bằng scan output) */
  used: {
    title: string[];
    bullets: string[];
    description: string[];
  };
}

/** Parse raw keyword textarea thành array (bỏ volume suffix) */
function parseRawKeywords(raw: string): string[] {
  const lines = raw.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const kw = line.replace(/\s+(\d+|-)\s*$/, "").trim();
    if (kw && !seen.has(kw.toLowerCase())) {
      seen.add(kw.toLowerCase());
      result.push(kw);
    }
  }
  return result;
}

/**
 * Khởi tạo KeywordPool từ raw keyword string + user assignments.
 * Keywords đã assigned vào section sẽ không có trong available_pool.
 */
export function initPool(
  rawKeywords: string,
  assignments: { title: string[]; bullets: string[]; description: string[] }
): KeywordPool {
  const all = parseRawKeywords(rawKeywords);
  const assignedSet = new Set([
    ...assignments.title,
    ...assignments.bullets,
    ...assignments.description,
  ].map((k) => k.toLowerCase()));

  const available_pool = all.filter((kw) => !assignedSet.has(kw.toLowerCase()));

  return {
    assigned: {
      title: [...assignments.title],
      bullets: [...assignments.bullets],
      description: [...assignments.description],
    },
    available_pool,
    used: { title: [], bullets: [], description: [] },
  };
}

/**
 * Scan text output và xác định keyword nào đã xuất hiện.
 * Dùng whole-phrase match (case insensitive).
 */
export function scanUsed(text: string, allKeywords: string[]): string[] {
  if (!text || !allKeywords.length) return [];
  const lower = text.toLowerCase();
  return allKeywords.filter((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "i");
    return regex.test(lower);
  });
}

/**
 * Sau mỗi step: consume keywords đã dùng, trả lại assigned-but-unused về pool.
 *
 * Logic:
 * 1. Keywords đã dùng (usedInStep) → chuyển vào used[section], xóa khỏi mọi pool
 * 2. Keywords còn trong assigned[section] nhưng không dùng → trả về available_pool
 */
export function consumeStep(
  pool: KeywordPool,
  usedInStep: string[],
  section: "title" | "bullets" | "description"
): KeywordPool {
  const usedSet = new Set(usedInStep.map((k) => k.toLowerCase()));

  // Build sets of all currently tracked keywords (to remove consumed ones)
  const removeFromPool = (arr: string[]) =>
    arr.filter((k) => !usedSet.has(k.toLowerCase()));

  // Assigned keywords for this section that were NOT used → return to available_pool
  const unusedAssigned = pool.assigned[section].filter(
    (k) => !usedSet.has(k.toLowerCase())
  );

  const next: KeywordPool = {
    assigned: {
      ...pool.assigned,
      [section]: [], // clear assigned for this section after consumption
    },
    available_pool: [
      ...removeFromPool(pool.available_pool),
      ...unusedAssigned,
    ],
    used: {
      ...pool.used,
      [section]: [...pool.used[section], ...usedInStep],
    },
  };

  return next;
}

/** Lấy tất cả keywords chưa dùng (remaining after pipeline) */
export function getRemainingKeywords(pool: KeywordPool): string[] {
  return [...pool.available_pool];
}

/** Lấy tất cả keywords đã dùng (across all sections) */
export function getAllUsed(pool: KeywordPool): string[] {
  return [
    ...pool.used.title,
    ...pool.used.bullets,
    ...pool.used.description,
  ];
}
