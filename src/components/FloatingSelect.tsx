"use client";

interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  errorMessage?: string;
}

export function FloatingSelect({ label, value, onChange, options, errorMessage }: FloatingSelectProps) {
  const hasValue = Boolean(value);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="peer w-full bg-zinc-900 border border-zinc-800 rounded-full px-4 pt-5 pb-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors appearance-none cursor-pointer"
          style={{ colorScheme: "dark" }}
        >
          <option value="" disabled hidden />
          {options.map((opt) => (
            <option key={opt} value={opt} style={{ background: "#18181b", color: "#f4f4f4" }}>
              {opt}
            </option>
          ))}
        </select>

        {/* Floating label */}
        <label
          className={`pointer-events-none absolute left-4 transition-all duration-150 select-none ${
            hasValue ? "top-1.5 text-[10px] text-zinc-500" : "top-3.5 text-sm text-zinc-500"
          }`}
        >
          {label}
        </label>

        {/* Chevron */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {errorMessage && (
        <p className="text-xs text-red-400 px-4">{errorMessage}</p>
      )}
    </div>
  );
}
