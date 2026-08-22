"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api, SecureSubmissionMeta, SecureSubmissionPreview } from "@/lib/api";

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
    if (val) return `<mark style="background:#fef9c3;color:#713f12;padding:0 3px;border-radius:3px">${val}</mark>`;
    return `<mark style="background:#fee2e2;color:#991b1b;padding:0 3px;border-radius:3px">{{${key}}}</mark>`;
  });
}

type Step = "loading" | "not_found" | "code_entry" | "preview_loading" | "preview" | "fill_sign" | "signing" | "success" | "declined";

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export default function SignPage() {
  const params = useParams();
  const uuid = params.token as string;

  const [step, setStep] = useState<Step>("loading");
  const [meta, setMeta] = useState<SecureSubmissionMeta | null>(null);
  const [preview, setPreview] = useState<SecureSubmissionPreview | null>(null);

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

  const pageClass = "min-h-[100dvh] bg-zinc-950 flex flex-col";

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
      <div className={`${pageClass} items-center justify-center`}>
        <p className="text-sm text-zinc-500">Kraunama…</p>
      </div>
    );
  }

  if (step === "not_found") {
    return (
      <div className={`${pageClass} items-center justify-center px-4`}>
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">Nuoroda nepasiekiama</p>
          <p className="text-sm text-zinc-400">Nuoroda nerasta, baigė galioti arba jau panaudota.</p>
        </div>
      </div>
    );
  }

  if (step === "declined") {
    return (
      <div className={`${pageClass} items-center justify-center px-4`}>
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
      <div className={`${pageClass} items-center justify-center px-4`}>
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
      <div className={`${pageClass} items-center justify-center px-4`} style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="text-xs text-zinc-500 mb-2">Sutartis pasirašymui</p>
            <h1 className="text-2xl font-semibold text-white">{meta?.template_name}</h1>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-1">Patvirtinimo kodas</h2>
            <p className="text-xs text-zinc-500 mb-5">
              Įveskite 6 skaitmenų kodą, kurį gavote el. laiške arba iš sutarties siuntėjo.
            </p>

            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setCodeError(""); }}
                placeholder="000000"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center text-2xl font-mono text-white tracking-widest placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />

              {codeError && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2">
                  {codeError}
                </p>
              )}

              <button
                type="submit"
                disabled={codeLoading || code.length !== 6}
                className="w-full bg-white text-zinc-950 py-3 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {codeLoading ? "Tikrinama…" : "Tęsti →"}
              </button>
            </form>
          </div>

          {meta?.is_sensitive && (
            <div className="mt-4 bg-amber-950/30 border border-amber-800/40 rounded-lg px-4 py-3">
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
      <div className={`${pageClass} items-center justify-center`}>
        <p className="text-sm text-zinc-500">Kraunama sutartis…</p>
      </div>
    );
  }

  if (step === "signing") {
    return (
      <div className={`${pageClass} items-center justify-center`}>
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-2">Pasirašoma…</p>
          <p className="text-xs text-zinc-600">Prašome palaukti. Neuždarykite šio lango.</p>
        </div>
      </div>
    );
  }

  // preview and fill_sign share the page layout
  const publicFields = preview ? preview.fields.filter((f) => f !== "signature") : [];

  return (
    <>
      {showSignPad && (
        <SignaturePad
          onConfirm={(sig) => { setSignatureImage(sig); setShowSignPad(false); }}
          onCancel={() => setShowSignPad(false)}
        />
      )}

      <div
        className={pageClass}
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex-1 overflow-auto py-6 px-4">
          <div className="max-w-3xl mx-auto">

            {/* Header */}
            <div className="mb-5">
              <p className="text-xs text-zinc-500 mb-1">Sutartis pasirašymui</p>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">{meta?.template_name}</h1>
            </div>

            {/* Step tabs */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-5">
              <button
                type="button"
                onClick={() => step === "fill_sign" && setStep("preview")}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${step === "preview" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"}`}
              >
                Sutartis
              </button>
              <button
                type="button"
                onClick={() => step === "preview" && setStep("fill_sign")}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${step === "fill_sign" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"}`}
              >
                Pildyti ir pasirašyti
              </button>
            </div>

            {/* ── Preview tab ── */}
            {step === "preview" && preview && (
              <div>
                <p className="text-xs text-zinc-500 mb-3">
                  Nepildyti laukai pažymėti{" "}
                  <mark style={{ background: "#fee2e2", color: "#991b1b", padding: "0 3px", borderRadius: 3 }}>raudonai</mark>
                  , užpildyti —{" "}
                  <mark style={{ background: "#fef9c3", color: "#713f12", padding: "0 3px", borderRadius: 3 }}>geltonai</mark>.
                </p>

                {preview.is_sensitive && (
                  <div className="mb-4 bg-amber-950/30 border border-amber-800/40 rounded-lg px-4 py-3">
                    <p className="text-xs text-amber-400">
                      Ši sutartis naudoja jūsų asmens kodą. Jis bus panaudotas tik dokumento generavimui ir nebus saugomas jokiose duomenų bazėse.
                    </p>
                  </div>
                )}

                <div className="bg-[#c8c8c8] rounded-xl py-4 px-2 sm:py-10 sm:px-8 shadow-inner overflow-x-auto">
                  <div className="mx-auto bg-white shadow-[0_2px_12px_rgba(0,0,0,0.35)] w-full relative" style={{ maxWidth: 794 }}>
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
                      }}
                      dangerouslySetInnerHTML={{ __html: buildPreviewHtml(preview.content, fields) }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleDecline}
                    className="text-sm text-zinc-500 hover:text-red-400 transition-colors px-4 py-2.5"
                  >
                    Atmesti sutartį
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("fill_sign")}
                    className="bg-white text-zinc-950 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
                  >
                    Pildyti ir pasirašyti →
                  </button>
                </div>
              </div>
            )}

            {/* ── Fill + sign tab ── */}
            {step === "fill_sign" && preview && (
              <form onSubmit={handleSign} className="flex flex-col gap-4">

                {/* Form fields */}
                {publicFields.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 flex flex-col gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Užpildykite duomenis</h2>
                      {preview.is_sensitive && (
                        <p className="text-xs text-amber-400/80 mt-1">
                          Visi duomenys, įskaitant asmens kodą, bus naudojami tik dokumento generavimui ir nebus saugomi.
                        </p>
                      )}
                    </div>
                    {publicFields.map((field) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 capitalize">
                          {field.replace(/_/g, " ")}
                          {field === "client_ID" || field === "personal_code" || field === "identity_number" ? (
                            <span className="ml-1 text-amber-500 text-[10px]">(nesaugoma)</span>
                          ) : null}
                        </label>
                        {isDateField(field) ? (
                          <input
                            type="date"
                            required
                            value={fields[field] ?? ""}
                            onChange={(e) => setFields((prev) => ({ ...prev, [field]: formatDateForDisplay(e.target.value) }))}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-600 [color-scheme:dark]"
                          />
                        ) : (
                          <input
                            required
                            value={fields[field] ?? ""}
                            onChange={(e) => setFields((prev) => ({ ...prev, [field]: e.target.value }))}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Signer full name */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Vardas ir pavardė <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Vardas Pavardė"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                  />
                  <p className="text-xs text-zinc-600 mt-1.5">Jūsų teisinis vardas, įtraukiamas į sutarties auditą.</p>
                </div>

                {/* Signature */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                  <h2 className="text-sm font-semibold text-white mb-3">Parašas</h2>
                  {signatureImage ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-white rounded-lg p-2 flex-1">
                        <img
                          src={`data:image/png;base64,${signatureImage}`}
                          alt="Parašas"
                          className="h-16 w-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSignPad(true)}
                        className="text-xs text-zinc-400 hover:text-white transition-colors shrink-0"
                      >
                        Keisti
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSignPad(true)}
                      className="w-full border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl py-6 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      + Pridėti parašą
                    </button>
                  )}
                  <p className="text-xs text-zinc-600 mt-2">Parašas neprivalomas.</p>
                </div>

                {/* Consent checkboxes */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-white">Sutikimas</h2>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={confirmedRead}
                      onChange={(e) => setConfirmedRead(e.target.checked)}
                      className="mt-0.5 shrink-0 accent-white"
                    />
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                      Patvirtinu, kad perskaičiau šią sutartį ir suprantu jos turinį.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={confirmedEsign}
                      onChange={(e) => setConfirmedEsign(e.target.checked)}
                      className="mt-0.5 shrink-0 accent-white"
                    />
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                      Sutinku pasirašyti šį dokumentą elektroniniu būdu. Suprantu, kad elektroninis parašas turi tokią pat teisinę galią kaip ranka rašytas parašas.
                    </span>
                  </label>
                </div>

                {signError && (
                  <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2">
                    {signError}
                  </p>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 pb-4">
                  <button
                    type="button"
                    onClick={() => setStep("preview")}
                    className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2.5 text-center"
                  >
                    ← Peržiūrėti sutartį
                  </button>
                  <button
                    type="submit"
                    disabled={!confirmedRead || !confirmedEsign || !signerName.trim()}
                    className="flex-1 bg-white text-zinc-950 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Pasirašyti ir atsisiųsti →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
