"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

function DownloadBtn({
  submissionId,
  format,
  label,
}: {
  submissionId: number;
  format: "pdf" | "docx";
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(
        `${BASE_URL}/contracts/submissions/${submissionId}/${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Nepavyko atsisiųsti");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sutartis-${submissionId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={download}
      disabled={loading}
      className="text-xs text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white px-3 py-2 rounded-md transition-colors disabled:opacity-50"
    >
      {loading ? "Kraunama…" : label}
    </button>
  );
}

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const submissionId = Number(id);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"info" | "preview">("info");
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.getSubmission(submissionId), api.getSubmissionHtml(submissionId)])
      .then(([sub, { html }]) => {
        setSubmission(sub);
        setHtml(html);
      })
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

  async function handleComplete() {
    setCompleting(true);
    try {
      const updated = await api.completeSubmission(submissionId);
      setSubmission(updated);
    } finally {
      setCompleting(false);
    }
  }

  function extractContact(data: Record<string, string>, email: string | null) {
    const find = (...keys: string[]) =>
      keys
        .map((k) => Object.entries(data).find(([key]) => key.toLowerCase().includes(k))?.[1])
        .find(Boolean) ?? null;
    return {
      name: find("name", "vardas", "pavadinimas"),
      email: find("email", "pastas", "mail") ?? email,
      phone: find("phone", "tel", "mob", "gsm"),
      address: find("address", "adresas", "addr"),
    };
  }

  async function handleSaveContact() {
    if (!submission) return;
    const contact = extractContact(submission.submitted_data, submission.submitter_email);
    if (!contact.name && !contact.email && !contact.phone && !contact.address) {
      alert("Nerasta kontaktinės informacijos šioje sutartyje.");
      return;
    }
    setSavingContact(true);
    try {
      await api.createContact({
        name: contact.name ?? undefined,
        email: contact.email ?? undefined,
        phone: contact.phone ?? undefined,
        address: contact.address ?? undefined,
      });
      setContactSaved(true);
    } catch {
      alert("Nepavyko išsaugoti kontakto.");
    } finally {
      setSavingContact(false);
    }
  }

  const tabClass = (t: "info" | "preview") =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      tab === t ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
    }`;

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

  const dataEntries = Object.entries(submission.submitted_data).filter(
    ([k]) => k !== "signature" && !k.startsWith("sys_")
  );

  return (
    <div className="p-8 max-w-4xl">
      {/* Back */}
      <Link
        href="/dashboard/contracts"
        className="text-xs text-zinc-500 hover:text-white mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Sutartys
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-600 font-mono">#{submission.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[submission.status]}`}>
              {STATUS_LABEL[submission.status]}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white">{submission.template_name}</h1>
          {submission.submitter_email && (
            <p className="text-sm text-zinc-500 mt-1">
              {submission.submitter_email} · {formatDate(submission.submitted_at)}
            </p>
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
          {submission.status === "confirmed" && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {completing ? "Baigiama…" : "Baigti sutartį"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <button className={tabClass("info")} onClick={() => setTab("info")}>Kliento duomenys</button>
        <button className={tabClass("preview")} onClick={() => setTab("preview")}>Sutarties peržiūra</button>
      </div>

      {/* Body */}
      {tab === "info" ? (
        <div className="flex flex-col gap-6">
          {dataEntries.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Užpildyti laukai</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {dataEntries.map(([k, v]) => (
                  <div key={k} className="bg-zinc-800/60 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                      {k.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-white break-words">{v || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Klientas nepateikė papildomų duomenų.</p>
          )}

          {submission.signature_image && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Parašas</p>
              <div className="bg-white rounded-lg p-4 inline-block">
                <img
                  src={`data:image/png;base64,${submission.signature_image}`}
                  alt="Parašas"
                  className="max-w-[280px] h-auto"
                />
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Meta</p>
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
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(submission.status === "confirmed" || submission.status === "completed") && (
              <>
                <DownloadBtn submissionId={submission.id} format="pdf" label="Atsisiųsti PDF" />
                <DownloadBtn submissionId={submission.id} format="docx" label="Atsisiųsti DOCX" />
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#c8c8c8] rounded-xl py-8 px-6">
          <div className="mx-auto bg-white shadow-[0_2px_12px_rgba(0,0,0,0.3)]" style={{ maxWidth: 794 }}>
            {html ? (
              <iframe
                srcDoc={html}
                className="w-full border-0 rounded"
                style={{ minHeight: 900 }}
                onLoad={(e) => {
                  const iframe = e.currentTarget;
                  const body = iframe.contentDocument?.body;
                  if (body) iframe.style.height = body.scrollHeight + 40 + "px";
                }}
              />
            ) : (
              <p className="p-8 text-sm text-zinc-500">Nepavyko užkrauti peržiūros.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
