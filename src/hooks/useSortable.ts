import { useState, useMemo } from "react";

type SortDir = "asc" | "desc";

export function useSortable<T extends Record<string, unknown>>(
  items: T[],
  defaultKey: keyof T | null = null,
  defaultDir: SortDir = "asc"
) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, toggleSort };
}
