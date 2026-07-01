"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type PublicTemplate = {
  name: string;
  description: string | null;
  content: string;
  fields: string[];
};

function buildPreviewHtml(content: string, fields: Record<string, string>): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (_match, raw) => {
    const key = raw.trim();
    const val = fields[key];
    if (val) {
      return `<mark style="background:#fef9c3;color:#713f12;padding:0 3px;border-radius:3px;font-style:normal">${val}</mark>`;
    }
    return `<mark style="background:#fee2e2;color:#991b1b;padding:0 3px;border-radius:3px;font-style:normal">{{${key}}}</mark>`;
  });
}

// ---- Full-screen signature pad ----
function SignaturePad({ onConfirm, onCancel }: {
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
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
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

  function stopDraw() { drawing.current = false; }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  }

  function confirm() {
    if (!hasSig) { onConfirm(null); return; }
    const dataUrl = canvasRef.current!.toDataURL("image/png").split(",")[1];
    onConfirm(dataUrl);
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
        <button onClick={onCancel} className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Atgal
        </button>
        <p className="text-sm font-semibold text-white">Parašas</p>
        <button onClick={clear} disabled={!hasSig} className="text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-30">
          Išvalyti
        </button>
      </div>

      {/* Canvas area */}
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
        {!hasSig && (
          <p className="text-xs text-zinc-600">Parašas neprivalomas — galite praleisti</p>
        )}
      </div>

      {/* Confirm button */}
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

// ---- Main page ----
export default function SignPage() {
  const params = useParams();
  const token = params.token as string;

  const [template, setTemplate] = useState<PublicTemplate | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState<"preview" | "fill">("preview");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState("");
  const [showSignPad, setShowSignPad] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/links/public/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Nuoroda nerasta arba pasibaigė jos galiojimas");
        return r.json();
      })
      .then((data: PublicTemplate) => {
        setTemplate(data);
        const initial: Record<string, string> = {};
        data.fields
          .filter((f) => !f.startsWith("owner_") && !f.startsWith("sys_") && f !== "signature")
          .forEach((f) => { initial[f] = ""; });
        setFields(initial);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleDecline() {
    if (!confirm("Ar tikrai norite atmesti šią sutartį? Savininkas gaus pranešimą.")) return;
    setDeclining(true);
    try {
      await fetch(`${BASE_URL}/links/public/${token}/decline`, { method: "POST" });
      setDeclined(true);
    } catch {
      setDeclined(true);
    } finally {
      setDeclining(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/links/public/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: fields, signature_image: signatureImage, submitter_email: email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Submission failed" }));
        throw new Error(body.detail ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const pageClass = "min-h-[100dvh] bg-zinc-950 flex flex-col";

  if (loading) {
    return (
      <div className={`${pageClass} items-center justify-center`}>
        <p className="text-sm text-zinc-500">Kraunama…</p>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className={`${pageClass} items-center justify-center px-4`}>
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">Nuoroda nepasiekiama</p>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`${pageClass} items-center justify-center px-4`}>
        <div className="text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Pateikta!</h1>
          <p className="text-sm text-zinc-400">Jūsų sutartis pateikta. Patikrinkite el. paštą dėl patvirtinimo.</p>
        </div>
      </div>
    );
  }

  if (declined) {
    return (
      <div className={`${pageClass} items-center justify-center px-4`}>
        <div className="text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-red-950 border border-red-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Sutartis atmesta</h1>
          <p className="text-sm text-zinc-400">Sutarties savininkas buvo informuotas apie jūsų sprendimą.</p>
        </div>
      </div>
    );
  }

  const publicFields = Object.keys(fields);

  function isDateField(name: string) {
    const n = name.toLowerCase();
    return n.includes("date") || n.includes("deadline") || n.includes("start") || n.includes("end");
  }

  function formatDateForDisplay(iso: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const tabClass = (t: "preview" | "fill") =>
    `flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      tab === t ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
    }`;

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
              <h1 className="text-xl sm:text-2xl font-semibold text-white">{template!.name}</h1>
              {template!.description && <p className="text-sm text-zinc-400 mt-1">{template!.description}</p>}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-5">
              <button type="button" className={tabClass("preview")} onClick={() => setTab("preview")}>
                Sutartis
              </button>
              <button type="button" className={tabClass("fill")} onClick={() => setTab("fill")}>
                Pildyti ir pasirašyti
              </button>
            </div>

            {/* Contract preview tab */}
            {tab === "preview" && (
              <div>
                <p className="text-xs text-zinc-500 mb-3">
                  Nepildyti laukai pažymėti{" "}
                  <mark style={{ background: "#fee2e2", color: "#991b1b", padding: "0 3px", borderRadius: 3 }}>raudonai</mark>
                  , užpildyti —{" "}
                  <mark style={{ background: "#fef9c3", color: "#713f12", padding: "0 3px", borderRadius: 3 }}>geltonai</mark>.
                </p>
                <div className="bg-[#c8c8c8] rounded-xl py-4 px-2 sm:py-10 sm:px-8 shadow-inner overflow-x-auto">
                  <div className="mx-auto bg-white shadow-[0_2px_12px_rgba(0,0,0,0.35)]" style={{ maxWidth: 794 }}>
                    <div
                      style={{
                        padding: "clamp(24px, 6vw, 91px) clamp(16px, 5vw, 61px) clamp(20px, 5vw, 76px)",
                        fontFamily: "'Times New Roman', Times, serif",
                        fontSize: "clamp(13px, 2.5vw, 16px)",
                        lineHeight: 1.6,
                        color: "#18181b",
                      }}
                      dangerouslySetInnerHTML={{ __html: buildPreviewHtml(template!.content, fields) }}
                    />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={declining}
                    className="text-sm text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50 px-4 py-2.5"
                  >
                    {declining ? "Atmetama…" : "Atmesti sutartį"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("fill")}
                    className="bg-white text-zinc-950 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
                  >
                    Pildyti ir pasirašyti →
                  </button>
                </div>
              </div>
            )}

            {/* Fill + sign tab */}
            {tab === "fill" && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {publicFields.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 flex flex-col gap-4">
                    <h2 className="text-sm font-semibold text-white">Užpildykite duomenis</h2>
                    {publicFields.map((field) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 capitalize">
                          {field.replace(/_/g, " ")}
                        </label>
                        {isDateField(field) ? (
                          <input
                            type="date"
                            required
                            value={fields[field]}
                            onChange={(e) => setFields({ ...fields, [field]: formatDateForDisplay(e.target.value) })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-600 [color-scheme:dark]"
                          />
                        ) : (
                          <input
                            required
                            value={fields[field]}
                            onChange={(e) => setFields({ ...fields, [field]: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Signature button */}
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
                  <p className="text-xs text-zinc-600 mt-2">Parašas neprivalomas</p>
                </div>

                {/* Email */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Jūsų el. paštas</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jusu@pastas.lt"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                  />
                  <p className="text-xs text-zinc-600 mt-1.5">Gausite patvirtinimo el. laišką.</p>
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 pb-4">
                  <button
                    type="button"
                    onClick={() => setTab("preview")}
                    className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2.5 text-center"
                  >
                    ← Peržiūrėti sutartį
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-white text-zinc-950 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Teikiama…" : "Pateikti ir pasirašyti"}
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
