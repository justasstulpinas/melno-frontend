"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, Template, Submission, PublicLink } from "@/lib/api";

// ---- Helpers ----

const FIELD_LABELS: Record<string, string> = {
  owner_name: "Jūsų vardas",
  owner_company: "Jūsų įmonė",
  owner_company_code: "Įmonės / IV kodas",
  owner_email: "Jūsų el. paštas",
  owner_address: "Jūsų adresas",
  owner_phone: "Jūsų telefonas",
  sys_current_date: "Šiandienos data (automatiškai)",
  sys_current_datetime: "Data ir laikas (automatiškai)",
  signature: "Parašas (kliento nubrėžtas)",
};

function humanize(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  return field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractFields(content: string) {
  const matches = [...content.matchAll(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g)];
  const all = [...new Set(matches.map((m) => m[1]))];
  return {
    owner: all.filter((f) => f.startsWith("owner_")),
    system: all.filter((f) => f.startsWith("sys_")),
    client: all.filter((f) => !f.startsWith("owner_") && !f.startsWith("sys_")),
  };
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

async function downloadFile(submissionId: number, type: "pdf" | "docx") {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/contracts/submissions/${submissionId}/${type}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) { alert("Atsisiuntimas nepavyko"); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `submission-${submissionId}.${type}`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Page ----

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [template, setTemplate] = useState<Template | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [tab, setTab] = useState<"info" | "links" | "confirmed" | "pending">("info");

  useEffect(() => {
    Promise.all([api.getTemplate(id), api.getSubmissions(id), api.getLinks(id)])
      .then(([t, s, l]) => { setTemplate(t); setSubmissions(s); setLinks(l); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDuplicate() {
    try {
      const copy = await api.duplicateTemplate(id);
      router.push(`/dashboard/templates/${copy.id}/edit`);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleActivate() {
    try { setTemplate(await api.activateTemplate(id)); } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed"); }
  }
  async function handleArchive() {
    try { setTemplate(await api.archiveTemplate(id)); } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed"); }
  }
  async function handleDelete() {
    if (!confirm("Ištrinti šį šabloną?")) return;
    try { await api.deleteTemplate(id); router.push("/dashboard/templates"); } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed"); }
  }
  async function handleRevoke(linkId: number) {
    try {
      await api.revokeLink(linkId);
      setLinks((prev) => prev.map((l) => l.id === linkId ? { ...l, is_revoked: true } : l));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed"); }
  }
  async function handleConfirm(submissionId: number) {
    try {
      const updated = await api.confirmSubmission(submissionId);
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updated : s)));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed"); }
  }

  if (loading) return <div className="p-8 text-sm text-zinc-500">Kraunama…</div>;
  if (error) return <div className="p-8 text-sm text-red-400">{error}</div>;
  if (!template) return null;

  const fields = extractFields(template.content);
  const activeLinks = links.filter((l) => !l.is_revoked && new Date(l.expires_at) > new Date());
  const confirmedSubmissions = submissions.filter((s) => s.status === "confirmed" || s.status === "completed");
  const pendingSubmissions = submissions.filter((s) => s.status === "submitted");

  const statusBadge: Record<string, string> = {
    draft: "bg-zinc-800 text-zinc-400",
    active: "bg-emerald-950 text-emerald-400",
    archived: "bg-zinc-800 text-zinc-500",
  };
  const statusLabel: Record<string, string> = {
    draft: "Juodraštis", active: "Aktyvus", archived: "Archyvuotas",
  };

  return (
    <div className="p-8 max-w-5xl flex flex-col gap-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/dashboard/templates" className="hover:text-zinc-300 transition-colors">Šablonai</Link>
        <span>/</span>
        <span className="text-zinc-300">{template.name}</span>
      </div>

      {/* ── Header card ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-xl font-semibold text-white">{template.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[template.status]}`}>
                {statusLabel[template.status]}
              </span>
            </div>
            {template.description && <p className="text-sm text-zinc-400">{template.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
            <button onClick={handleDuplicate}
              className="text-xs border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md hover:border-zinc-500 hover:text-white transition-colors">
              Kopijuoti
            </button>
            {template.status !== "archived" && (
              <Link href={`/dashboard/templates/${id}/edit`}
                className="text-xs border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md hover:border-zinc-500 hover:text-white transition-colors">
                Redaguoti
              </Link>
            )}
            {template.status === "draft" && (
              <button onClick={handleActivate}
                className="text-xs bg-emerald-900 text-emerald-300 px-3 py-1.5 rounded-md hover:bg-emerald-800 transition-colors">
                Aktyvuoti
              </button>
            )}
            {template.status === "active" && (
              <Link href={`/dashboard/templates/${id}/link`}
                className="text-xs bg-white text-zinc-950 px-3 py-1.5 rounded-md font-medium hover:bg-zinc-200 transition-colors">
                + Nauja nuoroda
              </Link>
            )}
            {template.status === "active" && (
              <button onClick={handleArchive}
                className="text-xs text-zinc-400 hover:text-yellow-400 px-3 py-1.5 rounded-md transition-colors">
                Archyvuoti
              </button>
            )}
            {(template.status === "draft" || template.status === "archived") && (
              <button onClick={handleDelete}
                className="text-xs text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-md transition-colors">
                Ištrinti
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab cards ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: "info", label: "Šablono informacija", value: null },
          { key: "links", label: "Aktyvios nuorodos", value: activeLinks.length },
          { key: "confirmed", label: "Patvirtintos", value: confirmedSubmissions.length },
          { key: "pending", label: "Laukia patvirtinimo", value: pendingSubmissions.length },
        ].map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setTab(card.key as typeof tab)}
            className={`text-left rounded-xl p-5 border transition-colors ${
              tab === card.key
                ? "bg-white text-zinc-950 border-white"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-600 text-white"
            }`}
          >
            <p className={`text-xs mb-2 ${tab === card.key ? "text-zinc-500" : "text-zinc-500"}`}>
              {card.label}
            </p>
            {card.value !== null ? (
              <p className={`text-2xl font-semibold tabular-nums ${tab === card.key ? "text-zinc-950" : "text-white"}`}>
                {card.value}
              </p>
            ) : (
              <svg className={`w-5 h-5 ${tab === card.key ? "text-zinc-400" : "text-zinc-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}

      {/* Info tab */}
      {tab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Laukai</p>
            {fields.owner.length === 0 && fields.client.length === 0 && fields.system.length === 0 ? (
              <p className="text-xs text-zinc-600">Laukų nerasta. Pridėkite <code className="text-zinc-400">{"{{laukas}}"}</code> į turinį.</p>
            ) : (
              <>
                {fields.owner.length > 0 && <FieldGroup title="Jūs užpildote" color="blue" fields={fields.owner} />}
                {fields.client.length > 0 && <FieldGroup title="Klientas užpildo" color="purple" fields={fields.client} />}
                {fields.system.length > 0 && <FieldGroup title="Automatiškai" color="green" fields={fields.system} />}
              </>
            )}
          </div>

          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Peržiūra</p>
              <div className="flex gap-1">
                <button onClick={() => setShowPreview(false)} className={`text-xs px-2.5 py-1 rounded-md transition-colors ${!showPreview ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}>Šaltinis</button>
                <button onClick={() => setShowPreview(true)} className={`text-xs px-2.5 py-1 rounded-md transition-colors ${showPreview ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}>Dokumentas</button>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto max-h-80 ${showPreview ? "bg-white p-8" : "p-5"}`}>
              {!showPreview
                ? <HighlightedContent content={template.content} />
                : <div className="text-zinc-900 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: template.content }} />
              }
            </div>
          </div>
        </div>
      )}

      {/* Links tab */}
      {tab === "links" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Nuorodos</p>
            <span className="text-xs text-zinc-600">{links.length} iš viso</span>
          </div>
          {links.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-500 mb-1">Nuorodų dar nėra.</p>
              {template.status === "active" && (
                <Link href={`/dashboard/templates/${id}/link`} className="text-xs text-zinc-400 hover:text-white underline transition-colors">
                  Sukurti nuorodą
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-800">
              {links.map((link) => <LinkRow key={link.id} link={link} onRevoke={handleRevoke} />)}
            </div>
          )}
        </div>
      )}

      {/* Confirmed tab */}
      {tab === "confirmed" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Patvirtintos sutartys</p>
            <span className="text-xs text-zinc-600">{confirmedSubmissions.length} iš viso</span>
          </div>
          {confirmedSubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-500">Patvirtintų sutarčių dar nėra.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-800">
              {confirmedSubmissions.map((s) => <SubmissionRow key={s.id} submission={s} onConfirm={handleConfirm} />)}
            </div>
          )}
        </div>
      )}

      {/* Pending tab */}
      {tab === "pending" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Laukia patvirtinimo</p>
            <span className="text-xs text-zinc-600">{pendingSubmissions.length} iš viso</span>
          </div>
          {pendingSubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-500">Nėra laukiančių patvirtinimo.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-800">
              {pendingSubmissions.map((s) => <SubmissionRow key={s.id} submission={s} onConfirm={handleConfirm} />)}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ---- Field group ----

function FieldGroup({ title, color, fields }: { title: string; color: "blue" | "purple" | "green"; fields: string[] }) {
  const dot = { blue: "bg-blue-400", purple: "bg-purple-400", green: "bg-emerald-400" }[color];
  const chip = {
    blue: "bg-blue-950/50 border-blue-900/50 text-blue-300",
    purple: "bg-purple-950/50 border-purple-900/50 text-purple-300",
    green: "bg-emerald-950/50 border-emerald-900/50 text-emerald-300",
  }[color];

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
        <p className="text-xs font-medium text-zinc-400">{title}</p>
      </div>
      <div className="flex flex-col gap-1">
        {fields.map((f) => (
          <div key={f} className={`text-xs px-2 py-1 rounded border ${chip}`}>{humanize(f)}</div>
        ))}
      </div>
    </div>
  );
}

// ---- Highlighted content ----

function HighlightedContent({ content }: { content: string }) {
  const parts = content.split(/(\{\{[^}]+\}\})/g);
  return (
    <div className="text-sm text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (/^\{\{[^}]+\}\}$/.test(part)) {
          const field = part.replace(/\{\{|\}\}/g, "").trim();
          const color =
            field.startsWith("owner_") ? "bg-blue-950 text-blue-300 border-blue-800" :
            field.startsWith("sys_") ? "bg-emerald-950 text-emerald-300 border-emerald-800" :
            "bg-purple-950 text-purple-300 border-purple-800";
          return (
            <span key={i} className={`inline-block text-xs px-1 py-0.5 rounded border font-sans mx-0.5 ${color}`}>
              {humanize(field)}
            </span>
          );
        }
        return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </div>
  );
}

// ---- Link row ----

function LinkRow({ link, onRevoke }: { link: PublicLink; onRevoke: (id: number) => void }) {
  const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";
  const signingUrl = `${BASE_URL}/sign/${link.token}`;
  const expired = new Date(link.expires_at) < new Date();
  const status = link.is_revoked ? "revoked" : expired ? "expired" : "active";

  const statusStyle = {
    active: "bg-emerald-950 text-emerald-400",
    expired: "bg-zinc-800 text-zinc-500",
    revoked: "bg-red-950 text-red-400",
  }[status];
  const statusLabel = { active: "Aktyvi", expired: "Pasibaigusi", revoked: "Atšaukta" }[status];

  const [copied, setCopied] = useState(false);
  function copyUrl() {
    navigator.clipboard.writeText(signingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyle}`}>{statusLabel}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-400 font-mono truncate">{signingUrl}</p>
        <p className="text-[10px] text-zinc-600 mt-0.5">
          {fmtDate(link.created_at)} · galioja iki {fmtDate(link.expires_at)}
        </p>
      </div>
      {status === "active" && (
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={copyUrl} className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1">
            {copied ? "Nukopijuota!" : "Kopijuoti"}
          </button>
          <button onClick={() => onRevoke(link.id)} className="text-xs text-zinc-400 hover:text-red-400 transition-colors px-2 py-1">
            Atšaukti
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Submission row ----

function SubmissionRow({ submission: s, onConfirm }: { submission: Submission; onConfirm: (id: number) => void }) {
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);

  const statusStyle: Record<string, string> = {
    submitted: "bg-blue-950 text-blue-400",
    confirmed: "bg-emerald-950 text-emerald-400",
    completed: "bg-zinc-800 text-zinc-300",
    cancelled: "bg-red-950 text-red-400",
  };
  const statusLabel: Record<string, string> = {
    submitted: "Pateiktas", confirmed: "Patvirtintas", completed: "Baigtas", cancelled: "Atšauktas",
  };

  async function handleDownload(type: "pdf" | "docx") {
    setDownloading(type);
    await downloadFile(s.id, type);
    setDownloading(null);
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-800/40 transition-colors">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyle[s.status]}`}>
        {statusLabel[s.status]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{s.submitter_email ?? "—"}</p>
        <p className="text-[10px] text-zinc-600 mt-0.5">{fmtDate(s.submitted_at)}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {s.status === "submitted" && (
          <button onClick={() => onConfirm(s.id)}
            className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors px-2 py-1">
            Patvirtinti
          </button>
        )}
        <button onClick={() => handleDownload("pdf")} disabled={downloading === "pdf"}
          className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 disabled:opacity-40">
          {downloading === "pdf" ? "…" : "PDF"}
        </button>
        <button onClick={() => handleDownload("docx")} disabled={downloading === "docx"}
          className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 disabled:opacity-40">
          {downloading === "docx" ? "…" : "DOCX"}
        </button>
      </div>
    </div>
  );
}
