"use client";

import { RefObject, useState, useRef, KeyboardEvent } from "react";
import { RichTextEditorHandle } from "./RichTextEditor";

type Item = { label: string; value: string };

const dotColor: Record<string, string> = {
  blue: "bg-blue-400",
  purple: "bg-purple-400",
  green: "bg-emerald-400",
  zinc: "bg-zinc-400",
};

const chipClass = "bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700";

function toSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function CustomAdder({
  prefix,
  existing,
  allBuiltin,
  onAdd,
  editorRef,
}: {
  prefix: string;
  existing: Item[];
  allBuiltin: string[];
  onAdd: (item: Item) => void;
  editorRef: RefObject<RichTextEditorHandle | null>;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startAdding() {
    setAdding(true);
    setDraft("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commit() {
    const slug = toSlug(draft);
    if (!slug) { setAdding(false); return; }
    const value = `${prefix}${slug}`;
    const duplicate = existing.some((f) => f.value === value) || allBuiltin.includes(value);
    if (!duplicate) onAdd({ label: draft.trim(), value });
    editorRef.current?.insertPlaceholder(value);
    setAdding(false);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") { setAdding(false); setDraft(""); }
  }

  return (
    <>
      {adding ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder="lauko pavadinimas"
          className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      ) : (
        <button
          type="button"
          onClick={startAdding}
          className="text-left text-xs px-2.5 py-1.5 rounded-md border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors w-full"
        >
          + Naujas laukas
        </button>
      )}
    </>
  );
}

const OWNER_BUILTIN: Item[] = [
  { label: "Jūsų vardas", value: "owner_name" },
  { label: "Įmonė", value: "owner_company" },
  { label: "Įmonės / IV kodas", value: "owner_company_code" },
  { label: "El. paštas", value: "owner_email" },
  { label: "Adresas", value: "owner_address" },
  { label: "Telefonas", value: "owner_phone" },
];

const DATE_BUILTIN: Item[] = [
  { label: "Pradžios data", value: "owner_start_date" },
  { label: "Pabaigos data", value: "owner_end_date" },
  { label: "Termino data", value: "owner_due_date" },
  { label: "Galutinis terminas", value: "owner_deadline_date" },
];

const CLIENT_BUILTIN: Item[] = [
  { label: "Kliento vardas", value: "client_name" },
  { label: "Kliento el. paštas", value: "client_email" },
  { label: "Kliento adresas", value: "client_address" },
  { label: "Kliento įmonė", value: "client_company" },
];

const SYS_BUILTIN: Item[] = [
  { label: "Šiandienos data", value: "sys_current_date" },
  { label: "Data ir laikas", value: "sys_current_datetime" },
];

const ALL_BUILTIN = [
  ...OWNER_BUILTIN,
  ...DATE_BUILTIN,
  ...CLIENT_BUILTIN,
  ...SYS_BUILTIN,
  { label: "Parašas", value: "signature" },
].map((i) => i.value);

export default function PlaceholderSidebar({ editorRef }: { editorRef: RefObject<RichTextEditorHandle | null> }) {
  const [ownerCustom, setOwnerCustom] = useState<Item[]>([]);
  const [clientCustom, setClientCustom] = useState<Item[]>([]);

  function removeOwner(value: string) { setOwnerCustom((p) => p.filter((f) => f.value !== value)); }
  function removeClient(value: string) { setClientCustom((p) => p.filter((f) => f.value !== value)); }

  function renderChips(items: Item[], onRemove?: (v: string) => void) {
    return items.map((item) => (
      <div key={item.value} className="flex items-center gap-1 group">
        <button
          type="button"
          onClick={() => editorRef.current?.insertPlaceholder(item.value)}
          className={`flex-1 text-left text-xs px-2.5 py-1.5 rounded-md border transition-colors truncate ${chipClass}`}
        >
          {item.label}
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.value)}
            className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs px-1"
          >
            ×
          </button>
        )}
      </div>
    ));
  }

  return (
    <aside className="w-52 shrink-0 sticky top-[57px] self-start flex flex-col gap-5 pt-1">
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Įterpti lauką</p>

      {/* Owner */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor.blue}`} />
          <p className="text-xs font-medium text-zinc-500">Jūsų informacija</p>
        </div>
        <div className="flex flex-col gap-1">
          {renderChips(OWNER_BUILTIN)}
          {renderChips(ownerCustom, removeOwner)}
          <CustomAdder
            prefix="owner_"
            existing={ownerCustom}
            allBuiltin={ALL_BUILTIN}
            onAdd={(item) => setOwnerCustom((p) => [...p, item])}
            editorRef={editorRef}
          />
        </div>
      </div>

      {/* Dates */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor.blue}`} />
          <p className="text-xs font-medium text-zinc-500">Datos (jūs nustatote)</p>
        </div>
        <div className="flex flex-col gap-1">
          {renderChips(DATE_BUILTIN)}
        </div>
      </div>

      {/* Client */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor.purple}`} />
          <p className="text-xs font-medium text-zinc-500">Klientas užpildo</p>
        </div>
        <div className="flex flex-col gap-1">
          {renderChips(CLIENT_BUILTIN)}
          {renderChips(clientCustom, removeClient)}
          <CustomAdder
            prefix="client_"
            existing={clientCustom}
            allBuiltin={ALL_BUILTIN}
            onAdd={(item) => setClientCustom((p) => [...p, item])}
            editorRef={editorRef}
          />
        </div>
      </div>

      {/* System */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor.green}`} />
          <p className="text-xs font-medium text-zinc-500">Automatiškai</p>
        </div>
        <div className="flex flex-col gap-1">
          {renderChips(SYS_BUILTIN)}
        </div>
      </div>

      {/* Signature */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor.zinc}`} />
          <p className="text-xs font-medium text-zinc-500">Parašas</p>
        </div>
        <div className="flex flex-col gap-1">
          {renderChips([{ label: "Parašas", value: "signature" }])}
        </div>
      </div>
    </aside>
  );
}
