"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, AdminStats, AdminUser, AdminTemplate, AdminSubmission } from "@/lib/api";
import { useSortable } from "@/hooks/useSortable";
import { SortableHeader } from "@/components/SortableHeader";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-blue-950 text-blue-400",
  confirmed: "bg-emerald-950 text-emerald-400",
  completed: "bg-zinc-800 text-zinc-300",
  cancelled: "bg-red-950 text-red-400",
  draft: "bg-zinc-800 text-zinc-400",
  active: "bg-emerald-950 text-emerald-400",
  archived: "bg-zinc-800 text-zinc-500",
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [tab, setTab] = useState<"users" | "templates" | "submissions">("users");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.adminStats(),
      api.adminUsers(),
      api.adminTemplates(),
      api.adminSubmissions(),
    ])
      .then(([s, u, t, sub]) => {
        setStats(s);
        setUsers(u);
        setTemplates(t);
        setSubmissions(sub);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const { sorted: sortedUsers, sortKey: uKey, sortDir: uDir, toggleSort: toggleU } = useSortable(users as unknown as Record<string, unknown>[], "email");
  const { sorted: sortedTemplates, sortKey: tKey, sortDir: tDir, toggleSort: toggleT } = useSortable(templates as unknown as Record<string, unknown>[], "name");
  const { sorted: sortedSubmissions, sortKey: sKey, sortDir: sDir, toggleSort: toggleS } = useSortable(submissions as unknown as Record<string, unknown>[], "submitted_at", "desc");

  if (loading) return <div className="p-8 text-sm text-zinc-500">Kraunama…</div>;
  if (error) return <div className="p-8 text-sm text-red-400">{error}</div>;

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      tab === t ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
    }`;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-1">Admin</h1>
        <p className="text-sm text-zinc-400">Visos sistemos apžvalga.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Vartotojai" value={stats.total_users} color="blue" />
          <StatCard label="Šablonai" value={stats.total_templates} color="purple" />
          <StatCard label="Sutartys" value={stats.total_submissions} color="zinc" />
          <StatCard label="Patvirtintos" value={stats.confirmed_submissions} color="emerald" />
        </div>
      )}

      {/* Analytics link */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin/analytics"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Peržiūrėti analitiką →
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <button className={tabClass("users")} onClick={() => setTab("users")}>
          Vartotojai ({users.length})
        </button>
        <button className={tabClass("templates")} onClick={() => setTab("templates")}>
          Šablonai ({templates.length})
        </button>
        <button className={tabClass("submissions")} onClick={() => setTab("submissions")}>
          Sutartys ({submissions.length})
        </button>
      </div>

      {/* Users table */}
      {tab === "users" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <SortableHeader label="ID" colKey="id" sortKey={uKey as string} sortDir={uDir} onSort={(k) => toggleU(k as keyof Record<string, unknown>)} className="w-16" />
                <SortableHeader label="El. paštas" colKey="email" sortKey={uKey as string} sortDir={uDir} onSort={(k) => toggleU(k as keyof Record<string, unknown>)} />
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Rolės</th>
                <SortableHeader label="Šablonai" colKey="template_count" sortKey={uKey as string} sortDir={uDir} onSort={(k) => toggleU(k as keyof Record<string, unknown>)} />
                <SortableHeader label="Pask. prisij." colKey="last_login" sortKey={uKey as string} sortDir={uDir} onSort={(k) => toggleU(k as keyof Record<string, unknown>)} />
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Būsena</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Veiksmai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(sortedUsers as unknown as AdminUser[]).map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  onSuspend={async (id) => {
                    const updated = await api.adminToggleSuspend(id);
                    setUsers((prev) => prev.map((x) => x.id === id ? { ...x, is_suspended: updated.is_suspended } : x));
                  }}
                  onDelete={async (id) => {
                    if (!confirm("Ištrinti šį vartotoją? Visi jo duomenys bus prarasti.")) return;
                    await api.adminDeleteUser(id);
                    setUsers((prev) => prev.filter((x) => x.id !== id));
                  }}
                  onVerify={async (id) => {
                    await api.adminVerifyUser(id);
                    setUsers((prev) => prev.map((x) => x.id === id ? { ...x, is_verified: true, is_suspended: false } : x));
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Templates table */}
      {tab === "templates" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <SortableHeader label="ID" colKey="id" sortKey={tKey as string} sortDir={tDir} onSort={(k) => toggleT(k as keyof Record<string, unknown>)} className="w-16" />
                <SortableHeader label="Pavadinimas" colKey="name" sortKey={tKey as string} sortDir={tDir} onSort={(k) => toggleT(k as keyof Record<string, unknown>)} />
                <SortableHeader label="Savininkas" colKey="owner_email" sortKey={tKey as string} sortDir={tDir} onSort={(k) => toggleT(k as keyof Record<string, unknown>)} />
                <SortableHeader label="Būsena" colKey="status" sortKey={tKey as string} sortDir={tDir} onSort={(k) => toggleT(k as keyof Record<string, unknown>)} />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(sortedTemplates as unknown as AdminTemplate[]).map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-zinc-600 font-mono">#{t.id}</td>
                  <td className="px-4 py-3 text-white">{t.name}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{t.owner_email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[t.status] ?? "bg-zinc-800 text-zinc-400"}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submissions table */}
      {tab === "submissions" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <SortableHeader label="ID" colKey="id" sortKey={sKey as string} sortDir={sDir} onSort={(k) => toggleS(k as keyof Record<string, unknown>)} className="w-16" />
                <SortableHeader label="Šablonas" colKey="template_name" sortKey={sKey as string} sortDir={sDir} onSort={(k) => toggleS(k as keyof Record<string, unknown>)} />
                <SortableHeader label="Pateikė" colKey="submitter_email" sortKey={sKey as string} sortDir={sDir} onSort={(k) => toggleS(k as keyof Record<string, unknown>)} />
                <SortableHeader label="Savininkas" colKey="owner_email" sortKey={sKey as string} sortDir={sDir} onSort={(k) => toggleS(k as keyof Record<string, unknown>)} />
                <SortableHeader label="Data" colKey="submitted_at" sortKey={sKey as string} sortDir={sDir} onSort={(k) => toggleS(k as keyof Record<string, unknown>)} />
                <SortableHeader label="Būsena" colKey="status" sortKey={sKey as string} sortDir={sDir} onSort={(k) => toggleS(k as keyof Record<string, unknown>)} />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(sortedSubmissions as unknown as AdminSubmission[]).map((s) => (
                <tr key={s.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-zinc-600 font-mono">#{s.id}</td>
                  <td className="px-4 py-3 text-white text-xs">{s.template_name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{s.submitter_email ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{s.owner_email ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{fmtDate(s.submitted_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[s.status] ?? "bg-zinc-800 text-zinc-400"}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserRow({
  user: u,
  onSuspend,
  onDelete,
  onVerify,
}: {
  user: AdminUser;
  onSuspend: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onVerify: (id: number) => Promise<void>;
}) {
  const [loadingSuspend, setLoadingSuspend] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(u.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <tr className={`hover:bg-zinc-800/50 transition-colors ${u.is_suspended ? "opacity-60" : ""}`}>
      <td className="px-4 py-3 text-xs text-zinc-600 font-mono">#{u.id}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-white text-sm">{u.email}</p>
            <p className="text-xs text-zinc-600 font-mono">#{u.id} · reg. {u.created_at ? fmtDate(u.created_at) : "—"}</p>
          </div>
          <button onClick={copyEmail} className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0" title="Kopijuoti el. paštą">
            {copied
              ? <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            }
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1 flex-wrap">
          {u.roles.map((r) => (
            <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">{r}</span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-400">{u.template_count}</td>
      <td className="px-4 py-3 text-xs text-zinc-500">{u.last_login ? fmtDate(u.last_login) : "—"}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          {u.is_suspended
            ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-400 w-fit">Sustabdytas</span>
            : <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 w-fit">Aktyvus</span>}
          {!u.is_verified && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-950 text-yellow-400 w-fit">Nepatvirtintas</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {!u.is_verified && (
            <button
              onClick={async () => { setLoadingVerify(true); try { await onVerify(u.id); } finally { setLoadingVerify(false); } }}
              disabled={loadingVerify}
              className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
            >
              {loadingVerify ? "…" : "Patvirtinti"}
            </button>
          )}
          <button
            onClick={async () => { setLoadingSuspend(true); try { await onSuspend(u.id); } finally { setLoadingSuspend(false); } }}
            disabled={loadingSuspend}
            className="text-xs text-zinc-400 hover:text-yellow-400 transition-colors disabled:opacity-50"
          >
            {loadingSuspend ? "…" : u.is_suspended ? "Atblokuoti" : "Sustabdyti"}
          </button>
          <button
            onClick={async () => { setLoadingDelete(true); try { await onDelete(u.id); } finally { setLoadingDelete(false); } }}
            disabled={loadingDelete}
            className="text-xs text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {loadingDelete ? "…" : "Ištrinti"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "blue" | "emerald" | "purple" | "zinc" }) {
  const bar: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
    zinc: "bg-zinc-600",
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className={`w-8 h-0.5 rounded-full mb-3 ${bar[color]}`} />
      <p className="text-3xl font-semibold text-white mb-1 tabular-nums">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
