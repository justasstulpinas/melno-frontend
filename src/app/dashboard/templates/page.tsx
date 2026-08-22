"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Template } from "@/lib/api";
import { useSortable } from "@/hooks/useSortable";
import { SortBar } from "@/components/SortableHeader";
import { HoldToDeleteButton } from "@/components/HoldToDeleteButton";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setActionError("Tik .docx failai palaikomi");
      return;
    }
    setActionError("");
    setUploading(true);
    try {
      const { html } = await api.uploadDocx(file);
      sessionStorage.setItem("docx_import_html", html);
      sessionStorage.setItem("docx_import_name", file.name.replace(/\.docx$/i, ""));
      router.push("/dashboard/templates/new");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Įkėlimas nepavyko");
    } finally {
      setUploading(false);
    }
  }

  async function handleDocxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await uploadFile(file);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOver(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadFile(file);
  }

  useEffect(() => {
    api.getTemplates()
      .then(setTemplates)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleActivate(id: number) {
    try {
      const updated = await api.activateTemplate(id);
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Nepavyko atlikti veiksmo");
    }
  }

  async function handleArchive(id: number) {
    try {
      const updated = await api.archiveTemplate(id);
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Nepavyko atlikti veiksmo");
    }
  }

  async function handleDelete(id: number) {
    await api.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleDuplicate(id: number) {
    try {
      const copy = await api.duplicateTemplate(id);
      router.push(`/dashboard/templates/${copy.id}/edit`);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Nepavyko atlikti veiksmo");
    }
  }

  const { sorted: sortedTemplates, sortKey: tSortKey, sortDir: tSortDir, toggleSort: toggleTSort } = useSortable(
    templates as unknown as Record<string, unknown>[],
    "name"
  );

  return (
    <div
      className="p-8 max-w-5xl relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={handleDocxUpload}
      />

      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm pointer-events-none">
          <div className="border-2 border-dashed border-white/40 rounded-2xl px-20 py-16 flex flex-col items-center gap-4 shadow-[0_0_80px_rgba(255,255,255,0.08)]">
            <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-white text-lg font-medium">Paleiskite norėdami įkelti</p>
            <p className="text-zinc-400 text-sm">.docx failas</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Šablonai</h1>
          <p className="text-sm text-zinc-400">Tvarkykite savo sutarčių šablonus.</p>
        </div>
        <button
          onClick={() => { setActionError(""); fileInputRef.current?.click(); }}
          className="text-sm bg-white text-zinc-950 px-4 py-2 rounded-full font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2"
        >
          {uploading && <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          {uploading ? "Konvertuojama…" : "+ Įkelti .docx šabloną"}
        </button>
      </div>

      {loading && <p className="text-sm text-zinc-500">Kraunama…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {actionError && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-full px-4 py-2 mb-2">{actionError}</p>}

      {!loading && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 rounded-xl transition-colors">
          <svg className="w-8 h-8 text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-zinc-500 mb-1">Nutempkite .docx failą čia</p>
          <p className="text-xs text-zinc-600 mb-5">arba</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm bg-white text-zinc-950 px-4 py-2 rounded-full font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            {uploading && <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
            {uploading ? "Konvertuojama…" : "Pasirinkti failą"}
          </button>
        </div>
      )}

      {!loading && templates.length > 0 && (
        <>
        <div className="mb-4">
          <SortBar
            options={[
              { key: "name", label: "Pavadinimas" },
              { key: "status", label: "Būsena" },
            ]}
            sortKey={tSortKey as string}
            sortDir={tSortDir}
            onSort={(k) => toggleTSort(k as keyof Record<string, unknown>)}
          />
        </div>
        <div className="flex flex-col gap-2">
          {(sortedTemplates as unknown as Template[]).map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onActivate={handleActivate}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
        </>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onActivate,
  onArchive,
  onDelete,
  onDuplicate,
}: {
  template: Template;
  onActivate: (id: number) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
}) {
  const statusStyles: Record<string, string> = {
    draft: "bg-zinc-800 text-zinc-400",
    active: "bg-emerald-950 text-emerald-400",
    archived: "bg-zinc-800 text-zinc-500",
  };

  return (
    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-700 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/templates/${template.id}`} className="text-sm font-medium text-white hover:text-zinc-300 transition-colors">
            {template.name}
          </Link>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[template.status]}`}>
            {template.status === "draft" ? "Juodraštis" : template.status === "active" ? "Aktyvus" : "Archyvuotas"}
          </span>
        </div>
        {template.description && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-md">{template.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0">
        {template.status === "draft" && (
          <button
            onClick={() => onActivate(template.id)}
            className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors px-2 py-1"
          >
            Aktyvuoti
          </button>
        )}
        {template.status === "active" && (
          <Link
            href={`/dashboard/templates/${template.id}/link`}
            className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1"
          >
            Dalintis
          </Link>
        )}
        {(template.status === "draft" || template.status === "archived") && (
          <div className="border-l border-red-900/30 pl-2">
            <HoldToDeleteButton onDelete={async () => onDelete(template.id)} />
          </div>
        )}
        <button
          onClick={() => onDuplicate(template.id)}
          className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1"
        >
          Kopijuoti
        </button>
        <Link
          href={`/dashboard/templates/${template.id}`}
          className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1"
        >
          Atidaryti →
        </Link>
      </div>
    </div>
  );
}
