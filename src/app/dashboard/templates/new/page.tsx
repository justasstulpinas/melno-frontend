"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

// ── Context menu ─────────────────────────────────────────────────
type ContextMenuState = { x: number; y: number; text: string } | null;

function PlaceholderContextMenu({
  menu,
  onSelect,
  onClose,
}: {
  menu: ContextMenuState;
  onSelect: (placeholder: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => { document.removeEventListener("keydown", handleKey); document.removeEventListener("mousedown", handleClick); };
  }, [onClose]);

  if (!menu) return null;

  // Flip near right/bottom edge
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = 240;
  const menuH = 380;
  const x = menu.x + menuW > vw ? menu.x - menuW : menu.x;
  const y = menu.y + menuH > vh ? menu.y - menuH : menu.y;

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1.5 overflow-y-auto"
      style={{ top: y, left: x, width: menuW, maxHeight: menuH }}
    >
      <p className="px-3 py-1.5 text-[10px] text-zinc-500 font-medium uppercase tracking-wide border-b border-zinc-800 mb-1">
        Pakeisti: <span className="text-zinc-300 normal-case tracking-normal font-normal">"{menu.text.slice(0, 30)}{menu.text.length > 30 ? "…" : ""}"</span>
      </p>
      {PLACEHOLDER_GROUPS.map((group, gi) => (
        <div key={group.label}>
          {gi > 0 && <div className="h-px bg-zinc-800 mx-2 my-1" />}
          <p className="px-3 pt-1 pb-0.5 text-[9px] text-zinc-600 uppercase tracking-wide">{group.label}</p>
          {group.items.map((item) => (
            <button
              key={item.key}
              onClick={() => { onSelect(item.key); onClose(); }}
              className="w-full text-left px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-between gap-3"
            >
              <span>{item.label}</span>
              <span className="text-zinc-600 font-mono text-[9px] shrink-0">{`{{${item.key}}}`}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Docx preview wrapper (client-only) ──────────────────────────
function DocxViewer({
  buffer,
  onSelectionChange,
  onContextMenu,
}: {
  buffer: ArrayBuffer;
  onSelectionChange: (text: string) => void;
  onContextMenu: (x: number, y: number, text: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !buffer.byteLength) return;
    import("docx-preview").then(({ renderAsync }) => {
      containerRef.current!.innerHTML = "";
      renderAsync(buffer, containerRef.current!, undefined, {
        className: "docx",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        useBase64URL: true,
      });
    });
  }, [buffer]);

  useEffect(() => {
    function handleMouseUp() {
      const sel = window.getSelection()?.toString().trim() ?? "";
      onSelectionChange(sel);
    }
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [onSelectionChange]);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const sel = window.getSelection()?.toString().trim() ?? "";
    if (sel) onContextMenu(e.clientX, e.clientY, sel);
  }

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      className="docx-preview bg-white rounded-lg shadow-lg overflow-auto"
      style={{ minHeight: "800px" }}
    />
  );
}

// ── Sidebar ──────────────────────────────────────────────────────
const PLACEHOLDER_GROUPS = [
  {
    label: "Jūs (savininkas)",
    items: [
      { key: "owner_name", label: "Jūsų vardas" },
      { key: "owner_company", label: "Jūsų įmonė" },
      { key: "owner_company_code", label: "Įmonės kodas" },
      { key: "owner_email", label: "Jūsų el. paštas" },
      { key: "owner_address", label: "Jūsų adresas" },
      { key: "owner_phone", label: "Jūsų telefonas" },
    ],
  },
  {
    label: "Klientas",
    items: [
      { key: "client_name", label: "Kliento vardas" },
      { key: "client_email", label: "Kliento el. paštas" },
      { key: "client_company", label: "Kliento įmonė" },
      { key: "client_address", label: "Kliento adresas" },
      { key: "client_phone", label: "Kliento telefonas" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { key: "sys_current_date", label: "Šiandienos data" },
      { key: "signature", label: "Kliento parašas" },
    ],
  },
];

// ── Page ──────────────────────────────────────────────────────────
type Phase = "upload" | "editing" | "saving";

export default function NewTemplatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const [phase, setPhase] = useState<Phase>("upload");

  // Pick up file_key if coming from the templates list upload card
  useEffect(() => {
    const fk = sessionStorage.getItem("docx_file_key");
    const fn = sessionStorage.getItem("docx_import_name");
    if (fk) {
      sessionStorage.removeItem("docx_file_key");
      sessionStorage.removeItem("docx_import_name");
      setFileKey(fk);
      setFileName(fn ?? "");
      setName(fn ?? "");
      api.getTmpDocx(fk).then((buf) => { setDocxBuffer(buf); setPhase("editing"); }).catch(() => {});
    }
  }, []);
  const [fileKey, setFileKey] = useState("");
  const [fileName, setFileName] = useState("");
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [replacing, setReplacing] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Tik .docx failai palaikomi");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const { file_key, placeholders: ph, filename } = await api.uploadDocx(file);
      setFileKey(file_key);
      setFileName(filename);
      setPlaceholders(ph);
      setName(filename);
      const buf = await api.getTmpDocx(file_key);
      setDocxBuffer(buf);
      setPhase("editing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Įkėlimas nepavyko");
    } finally {
      setUploading(false);
    }
  }

  async function handleReplaceText(placeholder: string, textOverride?: string) {
    const text = textOverride ?? selectedText;
    if (!text || !fileKey) return;
    setReplacing(placeholder);
    setError("");
    try {
      const { placeholders: ph } = await api.replaceText(fileKey, text, placeholder);
      setPlaceholders(ph);
      setSelectedText("");
      const buf = await api.getTmpDocx(fileKey);
      setDocxBuffer(buf);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nepavyko pakeisti teksto");
    } finally {
      setReplacing(null);
    }
  }

  async function handleCreate() {
    if (!name.trim()) { setError("Įveskite šablono pavadinimą"); return; }
    if (!fileKey) { setError("Įkelkite .docx failą"); return; }
    setPhase("saving");
    setError("");
    try {
      const template = await api.createTemplate({ name: name.trim(), file_key: fileKey });
      router.push(`/dashboard/templates/${template.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nepavyko sukurti šablono");
      setPhase("editing");
    }
  }

  function handleDragEnter(e: React.DragEvent) { e.preventDefault(); dragCounter.current++; if (dragCounter.current === 1) setDragOver(true); }
  function handleDragLeave(e: React.DragEvent) { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragOver(false); }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault(); dragCounter.current = 0; setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  }

  const handleSelection = useCallback((text: string) => setSelectedText(text), []);

  // ── Upload phase ──────────────────────────────────────────────
  if (phase === "upload") {
    return (
      <div
        className="flex flex-col h-full items-center justify-center p-8"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" accept=".docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
        <div className={`w-full max-w-lg border-2 border-dashed rounded-2xl py-20 flex flex-col items-center gap-4 transition-all duration-150 ${dragOver ? "border-white/50 bg-white/[0.02]" : "border-zinc-800"}`}>
          <svg className={`w-10 h-10 transition-colors ${dragOver ? "text-white/50" : "text-zinc-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-center">
            <p className={`text-sm transition-colors ${dragOver ? "text-white/60" : "text-zinc-400"}`}>
              {dragOver ? "Paleiskite norėdami įkelti" : "Nutempkite .docx failą čia"}
            </p>
            <p className={`text-xs text-zinc-600 mt-1 ${dragOver ? "invisible" : ""}`}>arba</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`text-sm bg-white text-zinc-950 px-5 py-2 rounded-full font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 ${dragOver ? "invisible" : ""}`}
          >
            {uploading && <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
            {uploading ? "Konvertuojama…" : "Pasirinkti failą"}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <p className="text-xs text-zinc-600 mt-6">
          <Link href="/dashboard/templates" className="hover:text-zinc-400 transition-colors">← Grįžti į šablonus</Link>
        </p>
      </div>
    );
  }

  // ── Editing phase ──────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-20 gap-4">
        <Link href="/dashboard/templates" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">← Šablonai</Link>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Šablono pavadinimas…"
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none min-w-0"
        />
        <div className="flex items-center gap-3 shrink-0">
          {error && <p className="text-xs text-red-400 max-w-xs truncate">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={phase === "saving"}
            className="bg-white text-zinc-950 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {phase === "saving" && <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
            {phase === "saving" ? "Išsaugoma…" : "Sukurti šabloną"}
          </button>
        </div>
      </div>

      {/* Helper bar */}
      <div className="px-6 py-2 border-b border-zinc-800/50 bg-zinc-950 flex items-center gap-3 text-xs text-zinc-500">
        {replacing ? (
          <span className="text-zinc-400 flex items-center gap-2"><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Keičiama…</span>
        ) : (
          <span>Pažymėkite tekstą ir dešiniuoju pelės mygtuku pasirinkite kintamąjį</span>
        )}
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document preview */}
        <div className="flex-1 overflow-auto p-6 bg-zinc-950">
          {docxBuffer && (
            <DocxViewer
              buffer={docxBuffer}
              onSelectionChange={handleSelection}
              onContextMenu={(x, y, text) => setContextMenu({ x, y, text })}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 border-l border-zinc-800 bg-zinc-950 overflow-y-auto p-4 flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Kintamieji dokumente</p>
            {placeholders.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {placeholders.map((p) => (
                  <span key={p} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">{`{{${p}}}`}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600">Kol kas nėra kintamųjų</p>
            )}
          </div>

          {PLACEHOLDER_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">{group.label}</p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleReplaceText(item.key)}
                    disabled={!selectedText || replacing !== null}
                    className="flex items-center justify-between text-xs text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <span className="text-zinc-300">{item.label}</span>
                    <span className="text-zinc-600 font-mono text-[10px] group-hover:text-zinc-400">{`{{${item.key}}}`}</span>
                    {replacing === item.key && <svg className="animate-spin w-3 h-3 text-zinc-400 ml-1 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PlaceholderContextMenu
        menu={contextMenu}
        onSelect={(placeholder) => {
          if (contextMenu) handleReplaceText(placeholder, contextMenu.text);
        }}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
}
