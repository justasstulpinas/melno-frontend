export function SortableHeader({
  label,
  colKey,
  sortKey,
  sortDir,
  onSort,
  className = "",
}: {
  label: string;
  colKey: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = sortKey === colKey;
  return (
    <th
      className={`text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer select-none hover:text-zinc-300 transition-colors ${className}`}
      onClick={() => onSort(colKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className="flex flex-col gap-[1px]">
          <svg className={`w-2 h-2 ${active && sortDir === "asc" ? "text-white" : "text-zinc-700"}`} viewBox="0 0 8 8" fill="currentColor">
            <path d="M4 1L7 5H1L4 1Z" />
          </svg>
          <svg className={`w-2 h-2 ${active && sortDir === "desc" ? "text-white" : "text-zinc-700"}`} viewBox="0 0 8 8" fill="currentColor">
            <path d="M4 7L1 3H7L4 7Z" />
          </svg>
        </span>
      </span>
    </th>
  );
}

export function SortBar<T extends string>({
  options,
  sortKey,
  sortDir,
  onSort,
}: {
  options: { key: T; label: string }[];
  sortKey: T | null;
  sortDir: "asc" | "desc";
  onSort: (key: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-zinc-600 mr-1">Rikiuoti:</span>
      {options.map((o) => {
        const active = sortKey === o.key;
        return (
          <button
            key={o.key}
            onClick={() => onSort(o.key)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors ${
              active
                ? "border-zinc-600 text-white bg-zinc-800"
                : "border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600"
            }`}
          >
            {o.label}
            {active && (
              <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor">
                {sortDir === "asc"
                  ? <path d="M5 2L8 7H2L5 2Z" />
                  : <path d="M5 8L2 3H8L5 8Z" />}
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
