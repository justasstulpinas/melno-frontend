"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, SubmissionListItem, Submission } from "@/lib/api";
import { useSortable } from "@/hooks/useSortable";
import { SortBar } from "@/components/SortableHeader";
import { NewContractModal } from "@/components/NewContractModal";

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

type Filter = "all" | "submitted" | "confirmed" | "completed";

function formatDate(iso: string) {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

// ---- Modal ----------------------------------------------------------------

function ContractModal({
  item,
  onClose,
  onConfirm,
  onCancel,
  onComplete,
}: {
  item: SubmissionListItem;
  onClose: () => void;
  onConfirm: (id: number) => void;
  onCancel: (id: number) => void;
  onComplete: (id: number) => void;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [full, setFull] = useState<Submission | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [tab, setTab] = useState<"info" | "preview">("info");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.getSubmissionHtml(item.id),
      api.getSubmission(item.id),
    ]).then(([{ html }, sub]) => {
      setHtml(html);
      setFull(sub);
    }).finally(() => setLoadingDoc(false));
  }, [item.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleConfirm() {
    setConfirming(true);
    try {
      await api.confirmSubmission(item.id);
      onConfirm(item.id);
      onClose();
    } finally {
      setConfirming(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Ar tikrai norite atšaukti šią sutartį?")) return;
    setCancelling(true);
    try {
      await api.cancelSubmission(item.id);
      onCancel(item.id);
      onClose();
    } finally {
      setCancelling(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await api.completeSubmission(item.id);
      onComplete(item.id);
      onClose();
    } finally {
      setCompleting(false);
    }
  }

  function extractContact(data: Record<string, string>, email: string | null) {
    const find = (...keys: string[]) =>
      keys.map((k) => Object.entries(data).find(([key]) => key.toLowerCase().includes(k))?.[1]).find(Boolean) ?? null;
    return {
      name: find("name", "vardas", "pavadinimas"),
      email: find("email", "pastas", "mail") ?? email,
      phone: find("phone", "tel", "mob", "gsm"),
      address: find("address", "adresas", "addr"),
    };
  }

  async function handleSaveContact() {
    const contact = extractContact(item.submitted_data, item.submitter_email ?? null);
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

  const dataEntries = Object.entries(item.submitted_data).filter(
    ([k]) => k !== "signature" && !k.startsWith("sys_")
  );

  const tabClass = (t: "info" | "preview") =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      tab === t ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
    }`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-zinc-600 font-mono">#{item.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[item.status]}`}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
            <h2 className="text-base font-semibold text-white truncate">{item.template_name}</h2>
            {item.submitter_email && (
              <p className="text-xs text-zinc-500 mt-0.5">{item.submitter_email} · {formatDate(item.submitted_at)}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            {item.status === "submitted" && (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {confirming ? "Tvirtinama…" : "Patvirtinti"}
              </button>
            )}
            {item.status === "confirmed" && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {completing ? "Baigiama…" : "Baigti sutartį"}
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 shrink-0">
          <button className={tabClass("info")} onClick={() => setTab("info")}>Kliento duomenys</button>
          <button className={tabClass("preview")} onClick={() => setTab("preview")}>Sutarties peržiūra</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
          {loadingDoc ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-zinc-500">Kraunama…</p>
            </div>
          ) : tab === "info" ? (
            <div className="flex flex-col gap-6">
              {/* Submitted fields */}
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

              {/* Signature */}
              {full?.signature_image && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Parašas</p>
                  <div className="bg-white rounded-lg p-4 inline-block">
                    <img
                      src={`data:image/png;base64,${full.signature_image}`}
                      alt="Parašas"
                      className="max-w-[280px] h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Meta */}
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Meta</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800/60 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Pateikta</p>
                    <p className="text-sm text-white">{formatDate(item.submitted_at)}</p>
                  </div>
                  {item.confirmed_at && (
                    <div className="bg-zinc-800/60 rounded-lg px-3 py-2.5">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Patvirtinta</p>
                      <p className="text-sm text-white">{formatDate(item.confirmed_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Downloads */}
              <div className="flex gap-2">
                <DownloadBtn submissionId={item.id} format="pdf" label="Atsisiųsti PDF" />
                <DownloadBtn submissionId={item.id} format="docx" label="Atsisiųsti DOCX" />
                <button
                  onClick={handleSaveContact}
                  disabled={savingContact || contactSaved}
                  className="text-xs text-zinc-400 hover:text-emerald-400 border border-zinc-700 hover:border-emerald-800 px-3 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {contactSaved ? "✓ Kontaktas išsaugotas" : savingContact ? "Išsaugoma…" : "+ Išsaugoti kaip kontaktą"}
                </button>
              </div>
            </div>
          ) : (
            /* Contract preview */
            <div className="bg-[#c8c8c8] rounded-xl py-8 px-6">
              <div
                className="mx-auto bg-white shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
                style={{ maxWidth: 794 }}
              >
                {html ? (
                  <iframe
                    srcDoc={html}
                    className="w-full border-0 rounded"
                    style={{ minHeight: 900 }}
                    onLoad={(e) => {
                      const iframe = e.currentTarget;
                      const body = iframe.contentDocument?.body;
                      if (body) {
                        iframe.style.height = body.scrollHeight + 40 + "px";
                      }
                    }}
                  />
                ) : (
                  <p className="p-8 text-sm text-zinc-500">Nepavyko užkrauti peržiūros.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadBtn({ submissionId, format, label }: { submissionId: number; format: "pdf" | "docx"; label: string }) {
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${BASE_URL}/contracts/submissions/${submissionId}/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

// ---- Row ------------------------------------------------------------------

function ContractRow({
  submission: s,
  onOpen,
}: {
  submission: SubmissionListItem;
  onOpen: (s: SubmissionListItem) => void;
}) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors cursor-pointer"
      onClick={() => onOpen(s)}
    >
      <span className="text-xs text-zinc-600 font-mono w-8 shrink-0">#{s.id}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{s.template_name}</p>
        {s.submitter_email && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{s.submitter_email}</p>
        )}
      </div>

      <span className="text-xs text-zinc-500 shrink-0 hidden sm:block">{formatDate(s.submitted_at)}</span>

      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[s.status] ?? "bg-zinc-800 text-zinc-400"}`}>
        {STATUS_LABEL[s.status] ?? s.status}
      </span>

      <svg className="w-4 h-4 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

// ---- Page -----------------------------------------------------------------

function ContractsPageInner() {
  const searchParams = useSearchParams();
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>((searchParams.get("filter") as Filter) ?? "all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<SubmissionListItem | null>(null);
  const [showNewContract, setShowNewContract] = useState(false);

  useEffect(() => {
    api.getAllSubmissions()
      .then(setSubmissions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleConfirm(id: number) {
    setSubmissions((prev) =>
      prev.map((s) => s.id === id ? { ...s, status: "confirmed" as const, confirmed_at: new Date().toISOString() } : s)
    );
  }

  function handleCancel(id: number) {
    setSubmissions((prev) =>
      prev.map((s) => s.id === id ? { ...s, status: "cancelled" as const } : s)
    );
  }

  function handleComplete(id: number) {
    setSubmissions((prev) =>
      prev.map((s) => s.id === id ? { ...s, status: "completed" as const } : s)
    );
  }

  const { sorted: sortedSubmissions, sortKey: subSortKey, sortDir: subSortDir, toggleSort: toggleSubSort } = useSortable(
    submissions as unknown as Record<string, unknown>[],
    "submitted_at",
    "desc"
  );

  const filtered = (sortedSubmissions as unknown as SubmissionListItem[]).filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.template_name.toLowerCase().includes(q) ||
        (s.submitter_email ?? "").toLowerCase().includes(q) ||
        Object.values(s.submitted_data).some((v) => v.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const counts = {
    all: submissions.length,
    submitted: submissions.filter((s) => s.status === "submitted").length,
    confirmed: submissions.filter((s) => s.status === "confirmed").length,
    completed: submissions.filter((s) => s.status === "completed").length,
  };

  return (
    <>
      {modal && (
        <ContractModal
          item={modal}
          onClose={() => setModal(null)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onComplete={handleComplete}
        />
      )}

      {showNewContract && <NewContractModal onClose={() => setShowNewContract(false)} />}
      <div className="p-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Sutartys</h1>
            <p className="text-sm text-zinc-400">Visos pateiktos sutartys ir jų būsenos.</p>
          </div>
          <button
            onClick={() => setShowNewContract(true)}
            className="text-sm bg-white text-zinc-950 px-4 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors"
          >
            + Nauja sutartis
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex-wrap">
            {(["all", "submitted", "confirmed", "completed"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === f ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
                }`}
              >
                {f === "all" ? "Visos" : STATUS_LABEL[f]}
                <span className={`ml-1.5 text-[10px] ${filter === f ? "text-zinc-500" : "text-zinc-600"}`}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ieškoti pagal šabloną, el. paštą ar duomenis…"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700"
          />
        </div>

        <div className="mb-4">
          <SortBar
            options={[
              { key: "submitted_at", label: "Data" },
              { key: "template_name", label: "Šablonas" },
              { key: "status", label: "Būsena" },
              { key: "submitter_email", label: "El. paštas" },
            ]}
            sortKey={subSortKey as string}
            sortDir={subSortDir}
            onSort={(k) => toggleSubSort(k as keyof Record<string, unknown>)}
          />
        </div>

        {loading && <p className="text-sm text-zinc-500">Kraunama…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-sm text-zinc-500">Sutarčių nerasta</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-2">
            {filtered.map((s) => (
              <ContractRow key={s.id} submission={s} onOpen={setModal} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Kraunama…</div>}>
      <ContractsPageInner />
    </Suspense>
  );
}
