"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, SubmissionListItem } from "@/lib/api";
import { NewContractModal } from "@/components/NewContractModal";

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewContract, setShowNewContract] = useState(false);

  useEffect(() => {
    api.getAllSubmissions().then(setSubmissions).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const submitted = submissions.filter((s) => s.status === "submitted");
  const confirmed = submissions.filter((s) => s.status === "confirmed");
  const completed = submissions.filter((s) => s.status === "completed");

  const recent = submissions.slice(0, 6);

  function formatDate(iso: string) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return (
    <div className="p-8 max-w-5xl">
      {showNewContract && <NewContractModal onClose={() => setShowNewContract(false)} />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Apžvalga</h1>
          <p className="text-sm text-zinc-400">Jūsų sutarčių veikla iš pirmo žvilgsnio.</p>
        </div>
        <button
          onClick={() => setShowNewContract(true)}
          className="text-sm bg-white text-zinc-950 px-4 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors"
        >
          + Nauja sutartis
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard
          label="Laukia patvirtinimo"
          value={loading ? "—" : String(submitted.length)}
          accent="blue"
          href="/dashboard/contracts?filter=submitted"
        />
        <StatCard
          label="Patvirtinta"
          value={loading ? "—" : String(confirmed.length)}
          accent="emerald"
          href="/dashboard/contracts?filter=confirmed"
        />
        <StatCard
          label="Užbaigta"
          value={loading ? "—" : String(completed.length)}
          accent="zinc"
          href="/dashboard/contracts?filter=completed"
        />
      </div>

      {/* Unconfirmed — quick action */}
      {!loading && submitted.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-white">Laukia patvirtinimo</h2>
            </div>
            <Link
              href="/dashboard/contracts"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Rodyti visas →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {submitted.slice(0, 5).map((s) => (
              <SubmissionRow key={s.id} submission={s} formatDate={formatDate} urgent />
            ))}
            {submitted.length > 5 && (
              <Link
                href="/dashboard/contracts"
                className="text-xs text-zinc-500 hover:text-white transition-colors text-center py-2"
              >
                + dar {submitted.length - 5} laukia patvirtinimo
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Naujausia veikla</h2>
          <Link href="/dashboard/contracts" className="text-xs text-zinc-400 hover:text-white transition-colors">
            Rodyti visas →
          </Link>
        </div>

        {loading ? (
          <div className="text-sm text-zinc-500 py-8 text-center">Kraunama…</div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-sm text-zinc-500 mb-1">Sutarčių dar nėra</p>
            <p className="text-xs text-zinc-600">Sukurkite šabloną ir dalinkitės nuoroda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((s) => (
              <SubmissionRow key={s.id} submission={s} formatDate={formatDate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  submitted: "Laukia",
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

function SubmissionRow({
  submission: s,
  formatDate,
  urgent,
}: {
  submission: SubmissionListItem;
  formatDate: (iso: string) => string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={`/dashboard/templates/${s.template_id}`}
      className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors ${
        urgent
          ? "bg-zinc-900 border-blue-900/60 hover:border-blue-700/60"
          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <span className="text-xs text-zinc-600 font-mono w-8 shrink-0">#{s.id}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{s.template_name}</p>
        {s.submitter_email && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{s.submitter_email}</p>
        )}
      </div>

      <span className="text-xs text-zinc-500 shrink-0">{formatDate(s.submitted_at)}</span>

      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[s.status] ?? "bg-zinc-800 text-zinc-400"}`}>
        {STATUS_LABEL[s.status] ?? s.status}
      </span>
    </Link>
  );
}

function StatCard({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: string;
  accent: "blue" | "emerald" | "zinc";
  href: string;
}) {
  const bar: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    zinc: "bg-zinc-600",
  };

  return (
    <Link
      href={href}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group"
    >
      <div className={`w-8 h-0.5 rounded-full mb-3 ${bar[accent]}`} />
      <p className="text-3xl font-semibold text-white mb-1 tabular-nums">{value}</p>
      <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</p>
    </Link>
  );
}
