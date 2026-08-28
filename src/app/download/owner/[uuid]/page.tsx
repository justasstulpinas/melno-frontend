"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { api, SecureSubmissionMeta } from "@/lib/api";
import { MelnoLogo } from "@/components/MelnoLogo";

type Step = "loading" | "not_auth" | "not_found" | "unavailable" | "code_entry" | "downloading" | "success";

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

function OwnerDownloadInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const uuid = params.uuid as string;
  const keyB64 = searchParams.get("k") ?? "";

  const [step, setStep] = useState<Step>("loading");
  const [meta, setMeta] = useState<SecureSubmissionMeta | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check auth first
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      const returnUrl = `/download/owner/${uuid}?k=${encodeURIComponent(keyB64)}`;
      router.replace(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!keyB64) {
      setStep("not_found");
      return;
    }

    // Load submission metadata
    api.getSecureSubmissionMeta(uuid)
      .then((m) => {
        setMeta(m);
        if (m.status === "completed") {
          setStep("unavailable");
        } else if (m.status !== "signed") {
          setStep("unavailable");
        } else {
          setStep("code_entry");
        }
      })
      .catch(() => setStep("not_found"));
  }, [uuid, keyB64, router]);

  async function handleDownload(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) { setError("Įveskite 6 skaitmenų kodą."); return; }
    setLoading(true);
    setError("");
    setStep("downloading");

    try {
      const res = await api.ownerDownloadSubmission(uuid, code, keyB64);

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Klaida" }));
        setError(body.detail ?? "Nepavyko atsisiųsti.");
        setStep("code_entry");
        return;
      }

      const blob = await res.blob();
      const templateName = meta?.template_name ?? "sutartis";
      downloadBlob(blob, `${templateName.replace(/\s+/g, "-")}-signed.pdf`);
      setStep("success");
    } catch {
      setError("Serverio klaida. Bandykite dar kartą.");
      setStep("code_entry");
    } finally {
      setLoading(false);
    }
  }

  const pageClass = "min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative";
  const logo = <div className="absolute top-6 left-6"><MelnoLogo /></div>;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className={pageClass}>
        {logo}
        <p className="text-sm text-zinc-500">Kraunama…</p>
      </div>
    );
  }

  // ── Not found / invalid link ─────────────────────────────────────────────
  if (step === "not_found") {
    return (
      <div className={pageClass}>
        {logo}
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-950 border border-red-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Nuoroda nerasta</h1>
          <p className="text-sm text-zinc-400">Ši atsisiuntimo nuoroda negalioja arba pasibaigė jos galiojimas.</p>
        </div>
      </div>
    );
  }

  // ── Already downloaded / expired ─────────────────────────────────────────
  if (step === "unavailable") {
    return (
      <div className={pageClass}>
        {logo}
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Sutartis jau atsisiųsta</h1>
          <p className="text-sm text-zinc-400">
            {meta?.status === "completed"
              ? "Ši vienkartinė atsisiuntimo nuoroda jau panaudota. Sutartis saugoma jūsų įrenginyje."
              : "Sutartis dar nepasirašyta arba nuoroda nebegalioja."}
          </p>
        </div>
      </div>
    );
  }

  // ── Downloading spinner ──────────────────────────────────────────────────
  if (step === "downloading") {
    return (
      <div className={pageClass}>
        {logo}
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-2">Atsisiunčiama…</p>
          <p className="text-xs text-zinc-600">Prašome palaukti. Neuždarykite šio lango.</p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className={pageClass}>
        {logo}
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Sutartis atsisiųsta</h1>
          <p className="text-sm text-zinc-400 mb-6">
            Pasirašyta sutartis išsaugota jūsų įrenginyje. Ši atsisiuntimo nuoroda panaikinta.
          </p>
          <a
            href="/dashboard/contracts"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Grįžti į sutartis
          </a>
        </div>
      </div>
    );
  }

  // ── Code entry ───────────────────────────────────────────────────────────
  return (
    <div className={pageClass}>
      {logo}
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs text-zinc-500 mb-2">Pasirašyta sutartis</p>
          <h1 className="text-2xl font-semibold text-white">{meta?.template_name}</h1>
          <p className="text-xs text-zinc-600 mt-1">Vienkartinis atsisiuntimas</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Patvirtinimo kodas</h2>
          <p className="text-xs text-zinc-500 mb-5">
            Įveskite 6 skaitmenų kodą, kurį gavote el. laiške apie pasirašytą sutartį.
          </p>

          <form onSubmit={handleDownload} className="flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
              placeholder="000000"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center text-2xl font-mono text-white tracking-widest placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-white text-zinc-950 py-3 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Atsisiunčiama…" : "Atsisiųsti sutartį →"}
            </button>
          </form>
        </div>

        <div className="mt-4 bg-amber-950/30 border border-amber-800/40 rounded-lg px-4 py-3">
          <p className="text-xs text-amber-400">
            Ši nuoroda vienkartinė. Po sėkmingo atsisiuntimo ji bus panaikinta ir nebegalios.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDownloadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Kraunama…</p>
      </div>
    }>
      <OwnerDownloadInner />
    </Suspense>
  );
}
