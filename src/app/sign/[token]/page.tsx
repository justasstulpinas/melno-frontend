"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api, SecureSubmissionMeta, SecureSubmissionPreview } from "@/lib/api";
import { MelnoLogo } from "@/components/MelnoLogo";
import { inputClass, inputDateClass } from "@/lib/design";

// ─────────────────────────────────────────────────────────────
// Signature pad
// ─────────────────────────────────────────────────────────────
function SignaturePad({
  onConfirm,
  onCancel,
}: {
  onConfirm: (dataUrl: string | null) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSig, setHasSig] = useState(false);

  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSig(true);
  }

  function stopDraw() {
    drawing.current = false;
  }

  function clear() {
    canvasRef.current!.getContext("2d")!.clearRect(0, 0, 700, 300);
    setHasSig(false);
  }

  function confirm() {
    if (!hasSig) { onConfirm(null); return; }
    const dataUrl = canvasRef.current!.toDataURL("image/png").split(",")[1];
    onConfirm(dataUrl);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950 flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
        <button onClick={onCancel} className="text-sm text-zinc-400 hover:text-white transition-colors">← Atgal</button>
        <p className="text-sm font-semibold text-white">Parašas</p>
        <button onClick={clear} disabled={!hasSig} className="text-sm text-zinc-400 hover:text-white disabled:opacity-30 transition-colors">Išvalyti</button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-xs text-zinc-500">Nubrėžkite parašą žemiau</p>
        <div className="w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={700}
            height={300}
            className="w-full touch-none cursor-crosshair block"
            style={{ touchAction: "none" }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
        {!hasSig && <p className="text-xs text-zinc-600">Parašas neprivalomas — galite praleisti</p>}
      </div>
      <div className="px-5 py-4 shrink-0 border-t border-zinc-800">
        <button
          onClick={confirm}
          className="w-full bg-white text-zinc-950 py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors"
        >
          {hasSig ? "Patvirtinti parašą →" : "Praleisti parašą →"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isDateField(name: string) {
  const n = name.toLowerCase();
  return n.includes("date") || n.includes("deadline") || n.includes("start") || n.includes("end");
}

function formatDateForDisplay(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildPreviewHtml(content: string, fields: Record<string, string>): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (_match, raw) => {
    const key = raw.trim();
    const val = fields[key];
    if (val) return `<mark data-field="${key}" style="background:#fef9c3;color:#713f12;padding:0 3px;border-radius:3px;transition:outline 0.15s">${val}</mark>`;
    return `<mark data-field="${key}" style="background:#fee2e2;color:#991b1b;padding:0 3px;border-radius:3px;transition:outline 0.15s">{{${key}}}</mark>`;
  });
}

// ─────────────────────────────────────────────────────────────
// Inline DOCX viewer for the signing preview
// ─────────────────────────────────────────────────────────────
function SignDocxViewer({ buffer }: { buffer: ArrayBuffer }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !buffer.byteLength) return;
    import("docx-preview").then(({ renderAsync }) => {
      ref.current!.innerHTML = "";
      renderAsync(buffer, ref.current!, undefined, {
        className: "docx",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        useBase64URL: true,
      });
    });
  }, [buffer]);
  return <div ref={ref} className="docx-preview w-full" />;
}

type Step = "loading" | "not_found" | "code_entry" | "preview_loading" | "preview" | "fill_sign" | "signing" | "success" | "declined";

// ─────────────────────────────────────────────────────────────
// 6-box OTP input — supports paste, auto-advance, backspace
// ─────────────────────────────────────────────────────────────
function OtpInput({
  value,
  onChange,
  hasError,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  function handleChange(i: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    onChange(next.join(""));
    if (char && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits]; next[i] = ""; onChange(next.join(""));
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted.padEnd(6, "").slice(0, 6));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  const base = "w-11 h-14 text-center text-xl font-mono rounded-lg border bg-zinc-800 text-white focus:outline-none transition-colors";
  const normal = "border-zinc-700 focus:border-zinc-400";
  const error = "border-red-500 focus:border-red-400";

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={d}
          disabled={disabled}
          autoFocus={i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`${base} ${hasError ? error : normal} disabled:opacity-50`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export default function SignPage() {
  const params = useParams();
  const uuid = params.token as string;

  const [step, setStep] = useState<Step>("loading");
  const [meta, setMeta] = useState<SecureSubmissionMeta | null>(null);
  const [preview, setPreview] = useState<SecureSubmissionPreview | null>(null);
  const [docxPreviewBuffer, setDocxPreviewBuffer] = useState<ArrayBuffer | null>(null);

  // Code entry state
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeVerifiedAt] = useState(() => new Date().toISOString());
  const codeVerifiedAtRef = useRef<string | null>(null);

  // Fill+sign state — all in React state, never in storage
  const [fields, setFields] = useState<Record<string, string>>({});
  const [signerName, setSignerName] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [confirmedRead, setConfirmedRead] = useState(false);
  const [confirmedEsign, setConfirmedEsign] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const [signError, setSignError] = useState("");
  const [contractViewedAt, setContractViewedAt] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const docPanelRef = useRef<HTMLDivElement>(null);
  const pageClass = "min-h-[100dvh] bg-zinc-950 flex flex-col";

  function highlightField(fieldName: string, on: boolean) {
    const panel = docPanelRef.current;
    if (!panel) return;
    const els = panel.querySelectorAll<HTMLElement>(`[data-field="${fieldName}"]`);
    els.forEach((el) => {
      if (on) {
        el.style.outline = "2px solid #3b82f6";
        el.style.outlineOffset = "2px";
      } else {
        el.style.outline = "";
        el.style.outlineOffset = "";
      }
    });
    if (on && els.length > 0) {
      els[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // Load metadata
  useEffect(() => {
    api.getSecureSubmissionMeta(uuid)
      .then((m) => {
        setMeta(m);
        setStep("code_entry");
      })
      .catch(() => setStep("not_found"));
  }, [uuid]);

  // Verify access code
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) { setCodeError("Įveskite 6 skaitmenų kodą."); return; }
    setCodeLoading(true);
    setCodeError("");
    try {
      const res = await api.verifySigningCode(uuid, code);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Neteisingas kodas" }));
        setCodeError(body.detail ?? "Neteisingas kodas");
        return;
      }
      // Code verified — load preview
      codeVerifiedAtRef.current = new Date().toISOString();
      setStep("preview_loading");
      const prev = await api.getSigningPreview(uuid);
      setPreview(prev);
      // Initialise field values
      const initial: Record<string, string> = {};
      prev.fields.filter((f) => f !== "signature").forEach((f) => { initial[f] = ""; });
      setFields(initial);
      // For DOCX templates, fetch the partially-filled DOCX for preview
      if (prev.is_docx) {
        api.getSigningPreviewDocx(uuid).then(setDocxPreviewBuffer).catch(() => {});
      }
      setStep("preview");
      // Notify backend that client opened preview
      api.markSigningViewed(uuid).catch(() => {});
      setContractViewedAt(new Date().toISOString());
    } catch {
      setStep("code_entry");
      setCodeError("Serverio klaida. Bandykite dar kartą.");
    } finally {
      setCodeLoading(false);
    }
  }

  // Decline
  async function handleDecline() {
    if (!confirm("Ar tikrai norite atmesti šią sutartį?")) return;
    await api.declineSigning(uuid).catch(() => {});
    setStep("declined");
  }

  // Sign + download
  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmedRead || !confirmedEsign) { setSignError("Pažymėkite abu sutikimo laukus."); return; }
    if (!signerName.trim()) { setSignError("Įveskite savo vardą ir pavardę."); return; }
    setStep("signing");
    setSignError("");

    const browserLanguage = typeof navigator !== "undefined" ? navigator.language : null;
    const timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
    const screenResolution = typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : null;

    try {
      const res = await api.signSubmission(uuid, {
        payload: fields,
        signature_image: signatureImage,
        signer_full_name: signerName.trim(),
        confirmed_read: confirmedRead,
        confirmed_esign: confirmedEsign,
        browser_language: browserLanguage,
        timezone,
        screen_resolution: screenResolution,
        contract_viewed_at: contractViewedAt,
        code_verified_at: codeVerifiedAtRef.current,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Klaida" }));
        setSignError(body.detail ?? "Pasirašymas nepavyko. Bandykite dar kartą.");
        setStep("fill_sign");
        return;
      }

      const blob = await res.blob();
      downloadBlob(blob, `sutartis-${uuid.slice(0, 8)}.pdf`);

      // Clear sensitive fields from memory
      setFields({});
      setSignerName("");
      setSignatureImage(null);

      setStep("success");
    } catch {
      setSignError("Serverio klaida. Bandykite dar kartą.");
      setStep("fill_sign");
    }
  }

  // ── Screens ──

  if (step === "loading") {
    return (
      <div className={`${pageClass} items-center justify-center relative`}>
        <div className="absolute top-6 left-6"><MelnoLogo /></div>
        <p className="text-sm text-zinc-500">Kraunama…</p>
      </div>
    );
  }

  if (step === "not_found") {
    return (
      <div className={`${pageClass} items-center justify-center px-4 relative`}>
        <div className="absolute top-6 left-6"><MelnoLogo /></div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">Nuoroda nepasiekiama</p>
          <p className="text-sm text-zinc-400">Nuoroda nerasta, baigė galioti arba jau panaudota.</p>
        </div>
      </div>
    );
  }

  if (step === "declined") {
    return (
      <div className={`${pageClass} items-center justify-center px-4 relative`}>
        <div className="absolute top-6 left-6"><MelnoLogo /></div>
        <div className="text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-red-950 border border-red-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Sutartis atmesta</h1>
          <p className="text-sm text-zinc-400">Sutarties savininkas buvo informuotas.</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className={`${pageClass} items-center justify-center px-4 relative`}>
        <div className="absolute top-6 left-6"><MelnoLogo /></div>
        <div className="text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Sutartis pasirašyta</h1>
          <p className="text-sm text-zinc-400">Jūsų kopija atsisiųsta į įrenginį. Išsaugokite ją saugiai.</p>
          <p className="text-xs text-zinc-600 mt-4">Sutarties savininkas gaus pranešimą ir savo kopiją.</p>
        </div>
      </div>
    );
  }

  if (step === "code_entry") {
    return (
      <div className={`${pageClass} items-center justify-center px-4 relative`} style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="absolute top-6 left-6"><MelnoLogo /></div>
        <div className="w-full max-w-sm flex flex-col gap-4">

          {/* Owner info card */}
          {meta && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-500 leading-tight">Sutartį siuntė</p>
                <p className="text-sm font-medium text-white truncate">{meta.template_name}</p>
              </div>
            </div>
          )}

          {/* Code entry card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-1 text-center">Patvirtinimo kodas</h2>
            <p className="text-xs text-zinc-500 mb-6 text-center">
              Įveskite 6 skaitmenų kodą iš el. laiško. Galite ir įklijuoti.
            </p>

            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <OtpInput
                value={code}
                onChange={(v) => { setCode(v); setCodeError(""); }}
                hasError={!!codeError}
                disabled={codeLoading}
              />

              {codeError && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2 text-center">
                  {codeError}
                </p>
              )}

              <button
                type="submit"
                disabled={codeLoading || code.length !== 6}
                className="w-full bg-white text-zinc-950 py-3 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {codeLoading && <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                {codeLoading ? "Tikrinama…" : "Tęsti →"}
              </button>
            </form>
          </div>

          {meta?.is_sensitive && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg px-4 py-3">
              <p className="text-xs text-amber-400">
                Ši sutartis naudos jūsų asmens kodą. Duomenys nebus saugomi serveryje.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "preview_loading") {
    return (
      <div className={`${pageClass} items-center justify-center relative`}>
        <div className="absolute top-6 left-6"><MelnoLogo /></div>
        <p className="text-sm text-zinc-500">Kraunama sutartis…</p>
      </div>
    );
  }

  if (step === "signing") {
    return (
      <div className={`${pageClass} items-center justify-center relative`}>
        <div className="absolute top-6 left-6"><MelnoLogo /></div>
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-2">Pasirašoma…</p>
          <p className="text-xs text-zinc-600">Prašome palaukti. Neuždarykite šio lango.</p>
        </div>
      </div>
    );
  }

  // both "preview" and "fill_sign" steps share this unified layout
  const publicFields = preview ? preview.fields.filter((f) => f !== "signature") : [];

  const ownerContacts = preview
    ? ([
        preview.owner_company && { label: "Įmonė", value: preview.owner_company },
        preview.owner_email && { label: "El. paštas", value: preview.owner_email },
        preview.owner_phone && { label: "Tel.", value: preview.owner_phone },
      ].filter(Boolean) as { label: string; value: string }[])
    : [];

  return (
    <>
      {showSignPad && (
        <SignaturePad
          onConfirm={(sig) => { setSignatureImage(sig); setShowSignPad(false); }}
          onCancel={() => setShowSignPad(false)}
        />
      )}

      <div
        className="h-[100dvh] flex flex-col overflow-hidden"
        style={{
          background: "#1e1e1e",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* ── Top bar ── */}
        <div className="shrink-0 h-14 flex items-center px-5" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <MelnoLogo />
        </div>

        {/* ── Sidebar + document row ── */}
        <form ref={formRef} onSubmit={handleSign} className="flex-1 min-h-0 flex">

          {/* ── Left sidebar (scrolls internally) ── */}
          <div className="w-[264px] shrink-0 overflow-y-auto flex flex-col gap-2 p-3" style={{ background: "#1e1e1e", borderRight: "1px solid #2a2a2a" }}>

            {/* Card 1: Owner identity */}
            <div className="rounded-xl p-3" style={{ background: "#2a2a2a" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-zinc-100 truncate leading-tight">
                  {preview?.owner_name ?? meta?.template_name}
                </p>
              </div>
              {ownerContacts.length > 0 && (
                <div className="space-y-1.5">
                  {ownerContacts.map(({ label, value }) => (
                    <div key={label} className="flex items-baseline gap-1.5">
                      <span className="text-[10px] shrink-0 w-16" style={{ color: "#888" }}>{label}</span>
                      <span className="text-[11px] truncate" style={{ color: "#d4d4d4" }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 2: Client placeholder fields */}
            {publicFields.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: "#2a2a2a" }}>
                <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "#666" }}>Kliento laukai</p>
                <div className="space-y-3">
                  {publicFields.map((field) => (
                    <div key={field}>
                      <div
                        onMouseEnter={() => highlightField(field, true)}
                        onMouseLeave={() => highlightField(field, false)}
                        className="flex items-center gap-2 px-1.5 py-1 rounded-md cursor-default transition-colors group mb-1.5"
                        onMouseOver={(e) => (e.currentTarget.style.background = "#363636")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "")}
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors group-hover:bg-blue-400" style={{ background: "#555" }} />
                        <span className="text-[11px] capitalize transition-colors group-hover:text-white" style={{ color: "#d4d4d4" }}>
                          {field.replace(/_/g, " ")}
                        </span>
                        {(field === "client_ID" || field === "personal_code" || field === "identity_number") && (
                          <span className="ml-auto text-[9px] text-amber-600 shrink-0">nesaugoma</span>
                        )}
                      </div>
                      {isDateField(field) ? (
                        <input
                          type="date"
                          required
                          value={fields[field] ?? ""}
                          onChange={(e) => setFields((prev) => ({ ...prev, [field]: formatDateForDisplay(e.target.value) }))}
                          className={inputDateClass}
                        />
                      ) : (
                        <input
                          required
                          value={fields[field] ?? ""}
                          onChange={(e) => setFields((prev) => ({ ...prev, [field]: e.target.value }))}
                          className={inputClass}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card 4: Signer name */}
            <div className="rounded-xl p-3" style={{ background: "#2a2a2a" }}>
              <label className="block text-[9px] uppercase tracking-widest mb-2" style={{ color: "#666" }}>
                Jūsų vardas ir pavardė
              </label>
              <input
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Vardas Pavardė"
                className={inputClass}
              />
              <p className="text-[9px] mt-1.5" style={{ color: "#555" }}>Įtraukiamas į sutarties auditą.</p>
            </div>

            {/* Card 5: Signature */}
            <div className="rounded-xl p-3" style={{ background: "#2a2a2a" }}>
              <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "#666" }}>
                Parašas <span className="normal-case" style={{ color: "#555" }}>(neprivalomas)</span>
              </p>
              {signatureImage ? (
                <div className="flex items-center gap-2">
                  <div className="bg-white rounded-md p-1.5 flex-1">
                    <img src={`data:image/png;base64,${signatureImage}`} alt="Parašas" className="h-8 w-full object-contain" />
                  </div>
                  <button type="button" onClick={() => setShowSignPad(true)} className="text-[11px] hover:text-white transition-colors shrink-0" style={{ color: "#888" }}>
                    Keisti
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSignPad(true)}
                  className="w-full rounded-lg py-2.5 text-[11px] hover:text-zinc-300 transition-colors"
                  style={{ border: "1px dashed #444", color: "#777" }}
                >
                  + Pridėti parašą
                </button>
              )}
            </div>

            {/* Sensitive warning */}
            {preview?.is_sensitive && (
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(120,80,0,0.15)", border: "1px solid rgba(180,120,0,0.25)" }}>
                <p className="text-[10px] leading-relaxed" style={{ color: "#c09040" }}>
                  Ši sutartis naudoja jūsų asmens kodą. Jis bus panaudotas tik dokumento generavimui ir nebus saugomas.
                </p>
              </div>
            )}

            {/* Error */}
            {signError && (
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(80,0,0,0.4)", border: "1px solid rgba(120,0,0,0.5)" }}>
                <p className="text-[11px] text-red-400">{signError}</p>
              </div>
            )}
          </div>

          {/* ── Document panel — ONLY this scrolls ── */}
          <div ref={docPanelRef} className="flex-1 min-h-0 overflow-y-auto" style={{ background: "#2a2a2a" }}>
            <div style={{ padding: "24px" }}>
              {preview && (
                <div className="mx-auto rounded-xl overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.5)] relative" style={{ maxWidth: 794 }}>
                  {preview.is_docx ? (
                    docxPreviewBuffer
                      ? <SignDocxViewer buffer={docxPreviewBuffer} />
                      : <div className="bg-white min-h-[300px] flex items-center justify-center"><p className="text-sm text-zinc-400">Kraunama…</p></div>
                  ) : (
                    <>
                      {preview.logo_image && (
                        <img
                          src={`data:image/png;base64,${preview.logo_image}`}
                          alt="Logo"
                          style={{
                            position: "absolute",
                            left: `${preview.logo_x}%`,
                            top: `${preview.logo_y}%`,
                            width: `${preview.logo_w}%`,
                            height: "auto",
                            objectFit: "contain",
                            zIndex: 10,
                            pointerEvents: "none",
                          }}
                        />
                      )}
                      <div
                        style={{
                          padding: "clamp(16px,5vw,91px) clamp(12px,4vw,61px) clamp(16px,4vw,76px)",
                          fontFamily: "'Times New Roman', Times, serif",
                          fontSize: "clamp(11px,2vw,16px)",
                          lineHeight: 1.6,
                          color: "#18181b",
                          background: "#fff",
                        }}
                        dangerouslySetInnerHTML={{ __html: buildPreviewHtml(preview.content, fields) }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        </form>

        {/* ── Bottom bar — shrink-0 so it NEVER scrolls away ── */}
        <div className="shrink-0 px-5 py-3 flex items-center gap-5" style={{ background: "#1e1e1e", borderTop: "1px solid #2a2a2a" }}>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={confirmedRead} onChange={(e) => setConfirmedRead(e.target.checked)} className="shrink-0 accent-white" />
            <span className="text-[11px] group-hover:text-zinc-200 transition-colors select-none" style={{ color: "#aaa" }}>
              Perskaičiau ir suprantu sutarties turinį
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={confirmedEsign} onChange={(e) => setConfirmedEsign(e.target.checked)} className="shrink-0 accent-white" />
            <span className="text-[11px] group-hover:text-zinc-200 transition-colors select-none" style={{ color: "#aaa" }}>
              Sutinku pasirašyti elektroniniu būdu
            </span>
          </label>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleDecline}
              className="text-xs hover:text-red-400 transition-colors px-4 py-2 rounded-full"
              style={{ color: "#888", border: "1px solid #333" }}
            >
              Atmesti sutartį
            </button>
            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={!confirmedRead || !confirmedEsign}
              className="bg-white text-zinc-950 px-5 py-2 rounded-full text-xs font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Pasirašyti
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
