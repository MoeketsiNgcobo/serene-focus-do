export const CATEGORY_OPTIONS = [
  "Design",
  "Development",
  "Research",
  "Planning",
  "Marketing",
  "Testing",
  "General",
] as const;

export const EXPERIENCE_OPTIONS = ["Junior", "Mid", "Senior", "Lead", "Principal"] as const;

// Maps a category to a chart color token index (1-5).
export function categoryColorVar(category: string): string {
  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start + "T00:00:00").getTime();
  const e = new Date(end + "T00:00:00").getTime();
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

export function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
