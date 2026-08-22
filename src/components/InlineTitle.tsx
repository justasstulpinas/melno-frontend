"use client";

import { useRef, useState } from "react";

interface Props {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  inputClassName?: string;
}

export function InlineTitle({ value, onSave, className = "", inputClassName = "" }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDraft(value);
    setEditing(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0);
  }

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setEditing(false); setDraft(value); }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        onClick={(e) => e.stopPropagation()}
        className={`bg-transparent border-b border-zinc-600 focus:border-white outline-none text-white w-full ${inputClassName}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className={`group/title flex items-center gap-1.5 text-left hover:text-zinc-300 transition-colors ${className}`}
    >
      <span>{value}</span>
      <svg
        className="w-3 h-3 text-zinc-600 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}
