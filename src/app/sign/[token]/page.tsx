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
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSig, setHasSig] = useState(false);

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
          .filter((f) => !f.startsWith("owner_") && !f.startsWith("sys_"))
          .forEach((f) => { initial[f] = ""; });
        setFields(initial);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
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

  function clearSig() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const signature_image = hasSig
      ? canvasRef.current!.toDataURL("image/png").split(",")[1]
      : null;
    try {
      const res = await fetch(`${BASE_URL}/links/public/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: fields, signature_image, submitter_email: email }),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Kraunama…</p>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">Nuoroda nepasiekiama</p>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Pateikta!</h1>
          <p className="text-sm text-zinc-400">Jūsų sutartis pateikta. Patikrinkite el. paštą dėl patvirtinimo.</p>
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
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const tabClass = (t: "preview" | "fill") =>
    `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      tab === t
        ? "bg-white text-zinc-950"
        : "text-zinc-400 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-zinc-500 mb-1">Sutartis pasirašymui</p>
          <h1 className="text-2xl font-semibold text-white">{template!.name}</h1>
          {template!.description && <p className="text-sm text-zinc-400 mt-1">{template!.description}</p>}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-6 w-fit">
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
            <p className="text-xs text-zinc-500 mb-4">
              Nepildyti laukai pažymėti{" "}
              <mark style={{ background: "#fee2e2", color: "#991b1b", padding: "0 3px", borderRadius: 3 }}>raudonai</mark>
              , užpildyti —{" "}
              <mark style={{ background: "#fef9c3", color: "#713f12", padding: "0 3px", borderRadius: 3 }}>geltonai</mark>.
            </p>
            <div className="bg-[#c8c8c8] rounded-xl py-10 px-8 shadow-inner">
              <div
                className="mx-auto bg-white shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
                style={{ maxWidth: 794, minHeight: 1123 }}
              >
                <div
                  style={{
                    padding: "91px 61px 76px 61px",
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "#18181b",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: buildPreviewHtml(template!.content, fields),
                  }}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {publicFields.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
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
                        onChange={(e) =>
                          setFields({ ...fields, [field]: formatDateForDisplay(e.target.value) })
                        }
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-600 [color-scheme:dark]"
                      />
                    ) : (
                      <input
                        required
                        value={fields[field]}
                        onChange={(e) => setFields({ ...fields, [field]: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Signature */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Parašas</h2>
                {hasSig && (
                  <button type="button" onClick={clearSig} className="text-xs text-zinc-400 hover:text-white transition-colors">
                    Išvalyti
                  </button>
                )}
              </div>
              <canvas
                ref={canvasRef}
                width={560}
                height={140}
                className="w-full border border-zinc-700 rounded-md bg-white touch-none cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
              <p className="text-xs text-zinc-600 mt-2">Nubrėžkite parašą viršuje (neprivaloma)</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Jūsų el. paštas</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jusu@pastas.lt"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
              <p className="text-xs text-zinc-600 mt-1.5">Gausite patvirtinimo el. laišką.</p>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTab("preview")}
                className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2.5"
              >
                ← Peržiūrėti sutartį
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-white text-zinc-950 px-6 py-2.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {submitting ? "Teikiama…" : "Pateikti ir pasirašyti"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
