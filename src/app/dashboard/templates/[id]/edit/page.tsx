"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, Profile } from "@/lib/api";
import RichTextEditor, { RichTextEditorHandle } from "@/components/RichTextEditor";
import PlaceholderSidebar from "@/components/PlaceholderSidebar";

function Modal({ title, message, confirmLabel, onConfirm, onCancel, danger }: {
  title: string; message: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
        <p className="text-sm text-zinc-400 mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="text-sm text-zinc-400 border border-zinc-700 px-4 py-2 rounded-md hover:border-zinc-500 hover:text-white transition-colors">Atšaukti</button>
          <button onClick={onConfirm} className={`text-sm px-4 py-2 rounded-md font-medium transition-colors ${danger ? "bg-red-600 hover:bg-red-500 text-white" : "bg-white text-zinc-950 hover:bg-zinc-200"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Context menu for DOCX placeholder replacement ----
type ContextMenuState = { x: number; y: number; text: string } | null;

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

function PlaceholderContextMenu({
  menu, onSelect, onClose,
}: {
  menu: ContextMenuState; onSelect: (p: string) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [onClose]);
  if (!menu) return null;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const menuW = 240; const menuH = 380;
  const x = menu.x + menuW > vw ? menu.x - menuW : menu.x;
  const y = menu.y + menuH > vh ? menu.y - menuH : menu.y;
  return (
    <div ref={ref} className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1.5 overflow-y-auto"
      style={{ top: y, left: x, width: menuW, maxHeight: menuH }}>
      <p className="px-3 py-1.5 text-[10px] text-zinc-500 font-medium uppercase tracking-wide border-b border-zinc-800 mb-1">
        Pakeisti: <span className="text-zinc-300 normal-case tracking-normal font-normal">"{menu.text.slice(0, 30)}{menu.text.length > 30 ? "…" : ""}"</span>
      </p>
      {PLACEHOLDER_GROUPS.map((group, gi) => (
        <div key={group.label}>
          {gi > 0 && <div className="h-px bg-zinc-800 mx-2 my-1" />}
          <p className="px-3 pt-1 pb-0.5 text-[9px] text-zinc-600 uppercase tracking-wide">{group.label}</p>
          {group.items.map((item) => (
            <button key={item.key} onClick={() => { onSelect(item.key); onClose(); }}
              className="w-full text-left px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-between gap-3">
              <span>{item.label}</span>
              <span className="text-zinc-600 font-mono text-[9px] shrink-0">{`{{${item.key}}}`}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function DocxViewer({ buffer, onSelectionChange, onContextMenu }: {
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
        className: "docx", inWrapper: true, ignoreWidth: false, ignoreHeight: false,
        breakPages: true, useBase64URL: true,
      });
    });
  }, [buffer]);
  useEffect(() => {
    function onUp() { const sel = window.getSelection()?.toString().trim() ?? ""; onSelectionChange(sel); }
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, [onSelectionChange]);
  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const sel = window.getSelection()?.toString().trim() ?? "";
    if (sel) onContextMenu(e.clientX, e.clientY, sel);
  }
  return (
    <div ref={containerRef} onContextMenu={handleContextMenu}
      className="docx-preview bg-white rounded-lg shadow-lg overflow-auto" style={{ minHeight: "800px" }} />
  );
}

// ---- Draggable + resizable overlay element (HTML templates) ----
type OverlayItem = { x: number; y: number; w: number };
type Guide = { axis: "h" | "v"; pct: number };
const SNAP = 2.5;

function useOverlayDrag(containerRef: React.RefObject<HTMLDivElement | null>, onDirty: () => void) {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState<OverlayItem>({ x: 5, y: 5, w: 18 });
  const posRef = useRef<OverlayItem>({ x: 5, y: 5, w: 18 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [guides, setGuides] = useState<Guide[]>([]);

  function init(x: number, y: number, w: number) {
    const item = { x, y, w };
    setPos(item); posRef.current = item;
  }

  function getDocEl(): HTMLElement | null {
    return (containerRef.current?.querySelector('.tiptap-page') as HTMLElement) || containerRef.current;
  }

  function computeSnap(rawX: number, rawY: number): { x: number; y: number; guides: Guide[] } {
    const docEl = getDocEl();
    const wrapper = wrapperRef.current;
    if (!docEl || !wrapper) return { x: rawX, y: rawY, guides: [] };
    const cr = docEl.getBoundingClientRect();
    const wr = wrapper.getBoundingClientRect();
    const logoWpct = (wr.width / cr.width) * 100;
    const logoHpct = (wr.height / cr.height) * 100;
    let x = rawX; let y = rawY;
    const g: Guide[] = [];
    for (const s of [{ val: 0, guide: 0 }, { val: (100 - logoWpct) / 2, guide: 50 }, { val: 100 - logoWpct, guide: 100 }]) {
      if (Math.abs(rawX - s.val) < SNAP) { x = s.val; g.push({ axis: "v", pct: s.guide }); break; }
    }
    for (const s of [{ val: 0, guide: 0 }, { val: (100 - logoHpct) / 2, guide: 50 }, { val: 100 - logoHpct, guide: 100 }]) {
      if (Math.abs(rawY - s.val) < SNAP) { y = s.val; g.push({ axis: "h", pct: s.guide }); break; }
    }
    return { x, y, guides: g };
  }

  const startMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const docEl = getDocEl();
    if (!docEl) return;
    setDragging(true);
    function onMove(ev: MouseEvent) {
      const rect = docEl!.getBoundingClientRect();
      const rawX = Math.max(0, Math.min(88, ((ev.clientX - rect.left) / rect.width) * 100));
      const rawY = Math.max(0, Math.min(93, ((ev.clientY - rect.top) / rect.height) * 100));
      const { x, y, guides: g } = computeSnap(rawX, rawY);
      const next = { ...posRef.current, x, y };
      posRef.current = next; setPos(next); setGuides(g); onDirty();
    }
    function onUp() { setDragging(false); setGuides([]); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [containerRef, onDirty]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const docEl = getDocEl();
    if (!docEl) return;
    setResizing(true);
    const startX = e.clientX;
    const startW = posRef.current.w;
    function onMove(ev: MouseEvent) {
      const rect = docEl!.getBoundingClientRect();
      const delta = ((ev.clientX - startX) / rect.width) * 100;
      const newW = Math.max(5, Math.min(55, startW + delta));
      const next = { ...posRef.current, w: newW };
      posRef.current = next; setPos(next); onDirty();
    }
    function onUp() { setResizing(false); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [containerRef, onDirty]);

  return { active, setActive, pos, init, wrapperRef, dragging, resizing, guides, startMove, startResize };
}

function DraggableOverlay({ hook, children, isDraggingAny }: {
  hook: ReturnType<typeof useOverlayDrag>; children: React.ReactNode; isDraggingAny: boolean;
}) {
  const { pos, wrapperRef, dragging, resizing, guides, startMove, startResize } = hook;
  const active = dragging || resizing;
  return (
    <>
      {guides.map((g, i) =>
        g.axis === "v"
          ? <div key={i} style={{ position: "absolute", left: `${g.pct}%`, top: 0, bottom: 0, width: 1, background: "#f43f5e", pointerEvents: "none", zIndex: 12 }} />
          : <div key={i} style={{ position: "absolute", top: `${g.pct}%`, left: 0, right: 0, height: 1, background: "#f43f5e", pointerEvents: "none", zIndex: 12 }} />
      )}
      <div ref={wrapperRef}
        style={{
          position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, width: `${pos.w}%`,
          display: "inline-block",
          border: active ? "1.5px solid #f43f5e" : "1.5px dashed #3b82f6",
          borderRadius: 3, padding: 3,
          cursor: dragging ? "grabbing" : "grab",
          pointerEvents: isDraggingAny && !active ? "none" : "all",
          userSelect: "none", boxSizing: "border-box",
        }}
        onMouseDown={startMove} onDragStart={e => e.preventDefault()}>
        <div style={{ width: "100%", pointerEvents: "none" }}>{children}</div>
        <div style={{ position: "absolute", right: -5, bottom: -5, width: 10, height: 10,
          background: active ? "#f43f5e" : "#3b82f6", border: "1.5px solid white",
          borderRadius: 2, cursor: "se-resize", zIndex: 2 }}
          onMouseDown={startResize} />
      </div>
    </>
  );
}

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ready, setReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const dirty = useCallback(() => setIsDirty(true), []);

  // ---- HTML-mode state ----
  const [isDocx, setIsDocx] = useState(false);
  const [content, setContent] = useState("");
  const editorRef = useRef<RichTextEditorHandle>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [docOverlay, setDocOverlay] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const logo = useOverlayDrag(editorContainerRef, dirty);
  const clientSig = useOverlayDrag(editorContainerRef, dirty);
  const userSig = useOverlayDrag(editorContainerRef, dirty);

  useEffect(() => {
    if (!ready || isDocx) return;
    function measure() {
      const container = editorContainerRef.current;
      const docEl = container?.querySelector('.tiptap-page') as HTMLElement | null;
      if (!container || !docEl) return;
      const cr = container.getBoundingClientRect();
      const dr = docEl.getBoundingClientRect();
      setDocOverlay({ top: dr.top - cr.top, left: dr.left - cr.left, width: dr.width, height: dr.height });
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (editorContainerRef.current) ro.observe(editorContainerRef.current);
    return () => ro.disconnect();
  }, [ready, isDocx]);

  // ---- DOCX-mode state ----
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [fileKey, setFileKey] = useState("");
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [replacing, setReplacing] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const fileReplaceRef = useRef<HTMLInputElement>(null);
  const [replacingFile, setReplacingFile] = useState(false);

  // ---- Load template ----
  useEffect(() => {
    Promise.all([api.getTemplate(id), api.getProfile()])
      .then(async ([t, p]) => {
        setName(t.name);
        setDescription(t.description ?? "");
        setProfile(p);
        logo.init(t.logo_x ?? 5, t.logo_y ?? 5, t.logo_w ?? 18);
        if (p.logo_image && t.logo_x !== null) logo.setActive(true);
        if (t.client_sig_x != null) { clientSig.init(t.client_sig_x, t.client_sig_y ?? 70, clientSig.pos.w); clientSig.setActive(true); }
        if (t.user_sig_x != null) { userSig.init(t.user_sig_x, t.user_sig_y ?? 70, userSig.pos.w); userSig.setActive(true); }

        if (t.docx_path) {
          setIsDocx(true);
          const buf = await api.getTemplateDocx(id);
          setDocxBuffer(buf);
        } else {
          setContent(t.content ?? "");
        }
        setReady(true);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  // ---- DOCX helpers ----
  async function checkoutDocx(): Promise<string> {
    if (fileKey) return fileKey;
    if (!docxBuffer) throw new Error("No DOCX buffer");
    const blob = new Blob([docxBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const file = new File([blob], "template.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const { file_key, placeholders: ph } = await api.uploadDocx(file);
    setFileKey(file_key);
    setPlaceholders(ph);
    setIsDirty(true);
    return file_key;
  }

  async function handleReplaceText(placeholder: string, textOverride?: string) {
    const text = textOverride ?? selectedText;
    if (!text) return;
    setReplacing(placeholder);
    setError("");
    try {
      const fk = await checkoutDocx();
      const { placeholders: ph } = await api.replaceText(fk, text, placeholder);
      setPlaceholders(ph);
      setSelectedText("");
      const buf = await api.getTmpDocx(fk);
      setDocxBuffer(buf);
      setIsDirty(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nepavyko pakeisti teksto");
    } finally {
      setReplacing(null);
    }
  }

  async function handleReplaceFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) { setError("Tik .docx failai palaikomi"); return; }
    setReplacingFile(true);
    setError("");
    try {
      const { file_key, placeholders: ph } = await api.uploadDocx(file);
      setFileKey(file_key);
      setPlaceholders(ph);
      const buf = await api.getTmpDocx(file_key);
      setDocxBuffer(buf);
      setIsDirty(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Įkėlimas nepavyko");
    } finally {
      setReplacingFile(false);
    }
  }

  // ---- HTML helpers ----
  function handleLogoToggle() {
    if (profile?.logo_image) {
      logo.setActive((v: boolean) => !v);
    } else {
      logoFileRef.current?.click();
    }
  }

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setSavingLogo(true);
      try {
        const updated = await api.saveUserLogo(base64);
        setProfile(updated);
        logo.setActive(true);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Nepavyko įkelti logotipo");
      } finally {
        setSavingLogo(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleCancelClick(e: React.MouseEvent) {
    if (isDirty) { e.preventDefault(); setShowCancelModal(true); }
  }

  // ---- Save ----
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setShowNameModal(true); return; }
    setError(""); setSaving(true);
    try {
      await api.updateTemplate(id, {
        name,
        description: description || undefined,
        ...(isDocx
          ? fileKey ? { file_key: fileKey } : {}
          : { content }),
        logo_x: logo.active ? logo.pos.x : null,
        logo_y: logo.active ? logo.pos.y : null,
        logo_w: logo.active ? logo.pos.w : null,
        client_sig_x: clientSig.active ? clientSig.pos.x : null,
        client_sig_y: clientSig.active ? clientSig.pos.y : null,
        user_sig_x: userSig.active ? userSig.pos.x : null,
        user_sig_y: userSig.active ? userSig.pos.y : null,
      });
      router.push(`/dashboard/templates/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Nepavyko išsaugoti");
    } finally {
      setSaving(false);
    }
  }

  const anyDragging = logo.dragging || logo.resizing || clientSig.dragging || clientSig.resizing || userSig.dragging || userSig.resizing;
  const handleSelection = useCallback((text: string) => setSelectedText(text), []);

  if (!ready && !error) return <div className="p-8 text-sm text-zinc-500">Kraunama…</div>;
  if (error && !ready) return <div className="p-8 text-sm text-red-400">{error}</div>;

  return (
    <>
      {showNameModal && <Modal title="Įveskite šablono pavadinimą" message="Šablono pavadinimas yra privalomas." confirmLabel="Supratau" onConfirm={() => setShowNameModal(false)} onCancel={() => setShowNameModal(false)} />}
      {showCancelModal && <Modal title="Atšaukti neišsaugojus?" message="Pakeitimai nebus išsaugoti. Ar tikrai norite išeiti?" confirmLabel="Išeiti" onConfirm={() => router.push(`/dashboard/templates/${id}`)} onCancel={() => setShowCancelModal(false)} danger />}

      {/* Hidden file inputs */}
      {!isDocx && <input ref={logoFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoFileChange} />}
      {isDocx && <input ref={fileReplaceRef} type="file" accept=".docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplaceFile(f); e.target.value = ""; }} />}

      <form onSubmit={handleSave} className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-20 gap-6">
          <div className="flex items-center gap-3 text-xs text-zinc-500 shrink-0">
            <Link href="/dashboard/templates" className="hover:text-zinc-300 transition-colors">Šablonai</Link>
            <span>/</span>
          </div>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
            placeholder="Šablono pavadinimas…"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none min-w-0"
          />
          <div className="flex items-center gap-3 shrink-0">
            {error && <p className="text-xs text-red-400 max-w-xs truncate">{error}</p>}
            <Link href={`/dashboard/templates/${id}`} onClick={handleCancelClick} className="text-sm text-zinc-500 hover:text-white transition-colors">Atšaukti</Link>
            <button type="submit" disabled={saving} className="bg-white text-zinc-950 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {saving ? "Išsaugoma…" : "Išsaugoti pakeitimus"}
            </button>
          </div>
        </div>

        {/* DOCX mode */}
        {isDocx && ready && (
          <>
            {/* Helper bar */}
            <div className="px-6 py-2 border-b border-zinc-800/50 bg-zinc-950 flex items-center justify-between gap-3 text-xs text-zinc-500">
              {replacing ? (
                <span className="text-zinc-400 flex items-center gap-2">
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  Keičiama…
                </span>
              ) : (
                <span>Pažymėkite tekstą ir dešiniuoju pelės mygtuku pasirinkite kintamąjį</span>
              )}
              <button
                type="button"
                onClick={() => fileReplaceRef.current?.click()}
                disabled={replacingFile}
                className="text-xs text-zinc-400 border border-zinc-700 px-3 py-1 rounded-md hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
              >
                {replacingFile && <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                {replacingFile ? "Įkeliama…" : "Keisti failą"}
              </button>
            </div>

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
                        <button key={item.key} type="button"
                          onClick={() => handleReplaceText(item.key)}
                          disabled={!selectedText || replacing !== null}
                          className="flex items-center justify-between text-xs text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed group">
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
              onSelect={(placeholder) => { if (contextMenu) handleReplaceText(placeholder, contextMenu.text); }}
              onClose={() => setContextMenu(null)}
            />
          </>
        )}

        {/* HTML mode */}
        {!isDocx && ready && (
          <div className="flex-1 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-8 py-10">
              <div className="flex gap-8 items-start">
                {/* Editor with overlays */}
                <div ref={editorContainerRef} className="flex-1 min-w-0 relative">
                  <RichTextEditor
                    ref={editorRef}
                    value={content}
                    onChange={(html) => { setContent(html); setIsDirty(true); }}
                  />
                  <div className="absolute pointer-events-none"
                    style={{ top: docOverlay.top, left: docOverlay.left, width: docOverlay.width || "100%", height: docOverlay.height || "100%", zIndex: 10 }}>
                    {logo.active && profile?.logo_image && (
                      <DraggableOverlay hook={logo} isDraggingAny={anyDragging}>
                        <img src={`data:image/png;base64,${profile.logo_image}`} alt="Logo" draggable={false} onDragStart={e => e.preventDefault()}
                          style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }} />
                      </DraggableOverlay>
                    )}
                    {clientSig.active && (
                      <DraggableOverlay hook={clientSig} isDraggingAny={anyDragging}>
                        <div style={{ padding: "8px 0", borderTop: "1.5px solid #aaa", minWidth: 80 }}>
                          <div style={{ fontSize: 11, color: "#888", paddingTop: 4 }}>Kliento parašas</div>
                        </div>
                      </DraggableOverlay>
                    )}
                    {userSig.active && (
                      <DraggableOverlay hook={userSig} isDraggingAny={anyDragging}>
                        {profile?.signature_image ? (
                          <img src={`data:image/png;base64,${profile.signature_image}`} alt="Jūsų parašas" draggable={false} onDragStart={e => e.preventDefault()}
                            style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }} />
                        ) : (
                          <div style={{ padding: "8px 0", borderTop: "1.5px solid #aaa", minWidth: 80 }}>
                            <div style={{ fontSize: 11, color: "#888", paddingTop: 4 }}>Jūsų parašas</div>
                          </div>
                        )}
                      </DraggableOverlay>
                    )}
                  </div>
                </div>

                <PlaceholderSidebar
                  editorRef={editorRef}
                  overlays={{
                    logoActive: logo.active,
                    onLogoToggle: handleLogoToggle,
                    clientSigActive: clientSig.active,
                    onClientSigToggle: () => clientSig.setActive((v: boolean) => !v),
                    userSigActive: userSig.active,
                    onUserSigToggle: () => userSig.setActive((v: boolean) => !v),
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </>
  );
}
