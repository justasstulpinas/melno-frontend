"use client";

import { useEffect, useRef, useState } from "react";
import { api, Contact } from "@/lib/api";

export function ContactEmailPicker({
  value,
  onChange,
  placeholder = "kliento@pastas.lt",
}: {
  value: string;
  onChange: (email: string) => void;
  placeholder?: string;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getContacts().then(setContacts).catch(() => {});
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = contacts.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }).filter((c) => c.email);

  function select(contact: Contact) {
    onChange(contact.email!);
    setQuery(contact.email!);
    setOpen(false);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        type="email"
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
      />

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl z-50 max-h-48 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c)}
              className="w-full text-left px-3 py-2 hover:bg-zinc-700 transition-colors flex items-center gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] text-zinc-300 font-medium">
                  {(c.name ?? c.email ?? "?")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                {c.name && <p className="text-xs font-medium text-white truncate">{c.name}</p>}
                <p className="text-xs text-zinc-400 truncate">{c.email}</p>
              </div>
            </button>
          ))}
          {query && !filtered.some((c) => c.email === query) && (
            <button
              type="button"
              onClick={() => { onChange(query); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-zinc-700 transition-colors border-t border-zinc-700"
            >
              <p className="text-xs text-zinc-400">Naudoti: <span className="text-white">{query}</span></p>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
