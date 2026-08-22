"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, Submission } from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Pateikta",
  confirmed: "Patvirtinta",
  completed: "Užbaigta",
  cancelled: "Atšaukta",
};

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-blue-950 text-blue-400",
  confirmed: "bg-emerald-950 text-emerald-400",
  completed: "bg-zinc-800 text-zinc-300",
  cancelled: "bg-red-950 text-red-400",
};

function formatDate(iso: string) {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const submissionId = Number(id);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.getSubmission(submissionId)
      .then(setSubmission)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [submissionId]);

  async function handleConfirm() {
    setConfirming(true);
    try {
      const updated = await api.confirmSubmission(submissionId);
      setSubmission(updated);
    } finally {
      setConfirming(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Ar tikrai norite atšaukti šią sutartį?")) return;
    setCancelling(true);
    try {
      const updated = await api.cancelSubmission(submissionId);
      setSubmission(updated);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <p className="text-sm text-zinc-500">Kraunama…</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-400">{error || "Sutartis nerasta."}</p>
        <Link href="/dashboard/contracts" className="text-xs text-zinc-500 hover:text-white mt-2 inline-block">
          ← Grįžti į sutartis
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/dashboard/contracts"
        className="text-xs text-zinc-500 hover:text-white mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Sutartys
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-600 font-mono">#{submission.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[submission.status]}`}>
              {STATUS_LABEL[submission.status]}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white">{(submission as unknown as { template_name?: string }).template_name ?? `Sutartis #${submission.id}`}</h1>
          {submission.submitter_email && (
            <p className="text-sm text-zinc-500 mt-1">{submission.submitter_email} · {formatDate(submission.submitted_at)}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          {submission.status === "submitted" && (
            <>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs text-zinc-400 border border-zinc-700 hover:border-red-800 hover:text-red-400 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {cancelling ? "Atšaukiama…" : "Atšaukti"}
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {confirming ? "Tvirtinama…" : "Patvirtinti"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 mb-6">
        <p className="text-xs text-zinc-400">
          Ši sutartis pateikta naudojant senąjį srautą. Kliento duomenys ir dokumento turinys nebesaugomi dėl GDPR reikalavimų.
          Naujos sutartys pasiekiamos per saugų atsisiuntimo srautą el. paštu.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800/60 rounded-lg px-3 py-2.5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Pateikta</p>
          <p className="text-sm text-white">{formatDate(submission.submitted_at)}</p>
        </div>
        {submission.confirmed_at && (
          <div className="bg-zinc-800/60 rounded-lg px-3 py-2.5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Patvirtinta</p>
            <p className="text-sm text-white">{formatDate(submission.confirmed_at)}</p>
          </div>
        )}
        {submission.submission_hash && (
          <div className="bg-zinc-800/60 rounded-lg px-3 py-2.5 col-span-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Dokumento kontrolinė suma</p>
            <p className="text-xs text-zinc-400 font-mono break-all">{submission.submission_hash}</p>
          </div>
        )}
      </div>
    </div>
  );
}
