"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, SubmissionListItem, SecureSubmissionListItem } from "@/lib/api";
import { useSortable } from "@/hooks/useSortable";
import { SortBar } from "@/components/SortableHeader";
import { NewContractModal } from "@/components/NewContractModal";

// ── Status helpers ──────────────────────────────────────────────────────────

const LEGACY_STATUS_LABEL: Record<string, string> = {
  submitted: "Pateikta",
  confirmed: "Patvirtinta",
  completed: "Užbaigta",
  cancelled: "Atšaukta",
};

const SECURE_STATUS_LABEL: Record<string, string> = {
  pending: "Laukiama",
  signed: "Pasirašyta",
  completed: "Užbaigta",
  declined: "Atmesta",
  expired: "Pasibaigė",
  cancelled: "Atšaukta",
};

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-blue-950 text-blue-400",
  confirmed: "bg-emerald-950 text-emerald-400",
  completed: "bg-zinc-800 text-zinc-300",
  cancelled: "bg-red-950 text-red-400",
  pending: "bg-amber-950 text-amber-400",
  signed: "bg-emerald-950 text-emerald-400",
  declined: "bg-red-950 text-red-400",
  expired: "bg-zinc-800 text-zinc-500",
};

function formatDate(iso: string) {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── Secure submissions section ──────────────────────────────────────────────

function SecureSubmissionRow({ s }: { s: SecureSubmissionListItem }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-white truncate">{s.template_name}</p>
          {s.is_sensitive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/40 shrink-0">
              asmens kodas
            </span>
          )}
        </div>
        {s.recipient_email && (
          <p className="text-xs text-zinc-500 truncate">{s.recipient_email}</p>
        )}
      </div>

      <span className="text-xs text-zinc-500 shrink-0 hidden sm:block">
        {formatDate(s.created_at)}
      </span>

      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[s.status] ?? "bg-zinc-800 text-zinc-400"}`}>
        {SECURE_STATUS_LABEL[s.status] ?? s.status}
      </span>

      {s.status === "signed" && (
        <span className="text-xs text-emerald-400 shrink-0">Patikrinkite el. paštą →</span>
      )}
    </div>
  );
}

function SecureSubmissionsSection() {
  const [subs, setSubs] = useState<SecureSubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listSecureSubmissions()
      .then(setSubs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-zinc-500">Kraunama…</p>;
  if (subs.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-sm font-semibold text-white mb-1">Saugios sutartys</h2>
      <p className="text-xs text-zinc-500 mb-4">
        Sutartys su patvirtinimo kodu. Pasirašytos kopijos pristatomos el. paštu.
      </p>
      <div className="flex flex-col gap-2">
        {subs.map((s) => (
          <SecureSubmissionRow key={s.uuid} s={s} />
        ))}
      </div>
    </div>
  );
}

// ── Legacy submission row ───────────────────────────────────────────────────

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
        {LEGACY_STATUS_LABEL[s.status] ?? s.status}
      </span>

      <svg className="w-4 h-4 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

// ── Legacy detail modal ─────────────────────────────────────────────────────

function LegacyModal({
  item,
  onClose,
  onConfirm,
  onCancel,
}: {
  item: SubmissionListItem;
  onClose: () => void;
  onConfirm: (id: number) => void;
  onCancel: (id: number) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-zinc-600 font-mono">#{item.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[item.status]}`}>
                {LEGACY_STATUS_LABEL[item.status]}
              </span>
            </div>
            <h2 className="text-base font-semibold text-white">{item.template_name}</h2>
            {item.submitter_email && (
              <p className="text-xs text-zinc-500 mt-0.5">{item.submitter_email} · {formatDate(item.submitted_at)}</p>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1 ml-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3">
            <p className="text-xs text-zinc-500">
              Ši sutartis pateikta naudojant senąjį srautą. Kliento duomenys ir dokumento turinys nebesaugomi dėl GDPR reikalavimų.
            </p>
          </div>

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

          {item.status === "submitted" && (
            <div className="flex gap-2 pt-1">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

type Filter = "all" | "submitted" | "confirmed" | "completed";

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
        (s.submitter_email ?? "").toLowerCase().includes(q)
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
        <LegacyModal
          item={modal}
          onClose={() => setModal(null)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
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

        {/* Secure submissions — new flow */}
        <SecureSubmissionsSection />

        {/* Legacy submissions */}
        {submissions.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-white mb-1">Senos sutartys</h2>
            <p className="text-xs text-zinc-500 mb-4">Pateiktos naudojant senąjį srautą.</p>

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
                    {f === "all" ? "Visos" : LEGACY_STATUS_LABEL[f]}
                    <span className={`ml-1.5 text-[10px] ${filter === f ? "text-zinc-500" : "text-zinc-600"}`}>
                      {counts[f]}
                    </span>
                  </button>
                ))}
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ieškoti pagal šabloną ar el. paštą…"
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

            <div className="flex flex-col gap-2">
              {filtered.map((s) => (
                <ContractRow key={s.id} submission={s} onOpen={setModal} />
              ))}
            </div>
          </>
        )}

        {!loading && submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-sm text-zinc-500">Sutarčių nerasta</p>
            <p className="text-xs text-zinc-600 mt-1">Sukurkite nuorodą iš šablono, kad pradėtumėte.</p>
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
