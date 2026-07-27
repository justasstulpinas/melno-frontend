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

// ---- Draggable + resizable overlay element ----
type OverlayItem = {
  x: number; y: number; w: number; // x, y as % of container, w as % of container width
};

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
    function onUp() {
      setDragging(false); setGuides([]);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
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
    function onUp() {
      setResizing(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [containerRef, onDirty]);

  return { active, setActive, pos, init, wrapperRef, dragging, resizing, guides, startMove, startResize };
}

// ---- Overlay renderer ----
function DraggableOverlay({
  hook,
  children,
  isDraggingAny,
}: {
  hook: ReturnType<typeof useOverlayDrag>;
  children: React.ReactNode;
  isDraggingAny: boolean;
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
      <div
        ref={wrapperRef}
        style={{
          position: "absolute",
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          width: `${pos.w}%`,
          display: "inline-block",
          border: active ? "1.5px solid #f43f5e" : "1.5px dashed #3b82f6",
          borderRadius: 3,
          padding: 3,
          cursor: dragging ? "grabbing" : "grab",
          pointerEvents: isDraggingAny && !active ? "none" : "all",
          userSelect: "none",
          boxSizing: "border-box",
        }}
        onMouseDown={startMove}
        onDragStart={e => e.preventDefault()}
      >
        <div style={{ width: "100%", pointerEvents: "none" }}>
          {children}
        </div>
        {/* Resize handle — bottom-right corner */}
        <div
          style={{
            position: "absolute",
            right: -5,
            bottom: -5,
            width: 10,
            height: 10,
            background: active ? "#f43f5e" : "#3b82f6",
            border: "1.5px solid white",
            borderRadius: 2,
            cursor: "se-resize",
            zIndex: 2,
          }}
          onMouseDown={startResize}
        />
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
  const [content, setContent] = useState("");
  const [ready, setReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const dirty = useCallback(() => setIsDirty(true), []);

  const logo = useOverlayDrag(editorContainerRef, dirty);
  const clientSig = useOverlayDrag(editorContainerRef, dirty);
  const userSig = useOverlayDrag(editorContainerRef, dirty);

  // Track .tiptap-page position so overlay sits exactly on the document content
  const [docOverlay, setDocOverlay] = useState({ top: 0, left: 0, width: 0, height: 0 });
  useEffect(() => {
    if (!ready) return;
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
    ro.observe(editorContainerRef.current!);
    return () => ro.disconnect();
  }, [ready]);

  useEffect(() => {
    Promise.all([api.getTemplate(id), api.getProfile()])
      .then(([t, p]) => {
        setName(t.name);
        setDescription(t.description ?? "");
        setContent(t.content);
        setProfile(p);
        logo.init(t.logo_x ?? 5, t.logo_y ?? 5, t.logo_w ?? 18);
        if (p.logo_image && t.logo_x !== null) logo.setActive(true);
        if (t.client_sig_x != null) { clientSig.init(t.client_sig_x, t.client_sig_y ?? 70, clientSig.pos.w); clientSig.setActive(true); }
        if (t.user_sig_x != null) { userSig.init(t.user_sig_x, t.user_sig_y ?? 70, userSig.pos.w); userSig.setActive(true); }
        setReady(true);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  function handleCancelClick(e: React.MouseEvent) {
    if (isDirty) { e.preventDefault(); setShowCancelModal(true); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setShowNameModal(true); return; }
    setError(""); setSaving(true);
    try {
      await api.updateTemplate(id, {
        name,
        description: description || undefined,
        content,
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

  const anyDragging = logo.dragging || logo.resizing || clientSig.dragging || clientSig.resizing || userSig.dragging || userSig.resizing;

  if (!ready && !error) return <div className="p-8 text-sm text-zinc-500">Kraunama…</div>;
  if (error && !ready) return <div className="p-8 text-sm text-red-400">{error}</div>;

  return (
    <>
      {showNameModal && <Modal title="Įveskite šablono pavadinimą" message="Šablono pavadinimas yra privalomas." confirmLabel="Supratau" onConfirm={() => setShowNameModal(false)} onCancel={() => setShowNameModal(false)} />}
      {showCancelModal && <Modal title="Atšaukti neišsaugojus?" message="Pakeitimai nebus išsaugoti. Ar tikrai norite išeiti?" confirmLabel="Išeiti" onConfirm={() => router.push(`/dashboard/templates/${id}`)} onCancel={() => setShowCancelModal(false)} danger />}

      <input ref={logoFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoFileChange} />

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
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Link href={`/dashboard/templates/${id}`} onClick={handleCancelClick} className="text-sm text-zinc-500 hover:text-white transition-colors">Atšaukti</Link>
            <button type="submit" disabled={saving} className="bg-white text-zinc-950 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {saving ? "Išsaugoma…" : "Išsaugoti pakeitimus"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto px-8 py-10">
            {ready && (
              <div className="flex gap-8 items-start">
                {/* Editor with overlays */}
                <div ref={editorContainerRef} className="flex-1 min-w-0 relative">
                  <RichTextEditor
                    ref={editorRef}
                    value={content}
                    onChange={(html) => { setContent(html); setIsDirty(true); }}
                  />

                  {/* Overlays layer — positioned exactly over the .tiptap-page content area */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: docOverlay.top,
                      left: docOverlay.left,
                      width: docOverlay.width || "100%",
                      height: docOverlay.height || "100%",
                      zIndex: 10,
                    }}
                  >
                    {/* Logo overlay */}
                    {logo.active && profile?.logo_image && (
                      <DraggableOverlay hook={logo} isDraggingAny={anyDragging}>
                        <img
                          src={`data:image/png;base64,${profile.logo_image}`}
                          alt="Logo"
                          draggable={false}
                          onDragStart={e => e.preventDefault()}
                          style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
                        />
                      </DraggableOverlay>
                    )}

                    {/* Client signature overlay */}
                    {clientSig.active && (
                      <DraggableOverlay hook={clientSig} isDraggingAny={anyDragging}>
                        <div style={{ padding: "8px 0", borderTop: "1.5px solid #aaa", minWidth: 80 }}>
                          <div style={{ fontSize: 11, color: "#888", paddingTop: 4 }}>Kliento parašas</div>
                        </div>
                      </DraggableOverlay>
                    )}

                    {/* User signature overlay */}
                    {userSig.active && (
                      <DraggableOverlay hook={userSig} isDraggingAny={anyDragging}>
                        {profile?.signature_image ? (
                          <img
                            src={`data:image/png;base64,${profile.signature_image}`}
                            alt="Jūsų parašas"
                            draggable={false}
                            onDragStart={e => e.preventDefault()}
                            style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
                          />
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
            )}
          </div>
        </div>
      </form>
    </>
  );
}
