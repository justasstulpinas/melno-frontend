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
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; uploadedAt: Date; html: string } | null>(null);
  const [addingToTemplates, setAddingToTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setActionError("Tik .docx failai palaikomi");
      return;
    }
    setActionError("");
    setUploadedFile(null);
    setUploading(true);
    try {
      const { html } = await api.uploadDocx(file);
      sessionStorage.setItem("docx_import_html", html);
      sessionStorage.setItem("docx_import_name", file.name.replace(/\.docx$/i, ""));
      setUploadedFile({ name: file.name, size: file.size, uploadedAt: new Date(), html });
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

  async function handleAddDirectly() {
    if (!uploadedFile) return;
    setAddingToTemplates(true);
    try {
      const template = await api.createTemplate({
        name: uploadedFile.name.replace(/\.docx$/i, ""),
        content: uploadedFile.html,
      });
      setUploadedFile(null);
      setTemplates((prev) => [...prev, template]);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Nepavyko pridėti šablono");
    } finally {
      setAddingToTemplates(false);
    }
  }

  const { sorted: sortedTemplates, sortKey: tSortKey, sortDir: tSortDir, toggleSort: toggleTSort } = useSortable(
    templates as unknown as Record<string, unknown>[],
    "name"
  );

  return (
    <div
      className="p-8"
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

      {!loading && templates.length === 0 && !uploadedFile && (
        <div className={`flex flex-col items-center justify-center py-24 border border-dashed rounded-xl transition-all duration-150 ${dragOver ? "border-white/40 bg-white/[0.02]" : "border-zinc-800"}`}>
          <svg className={`w-8 h-8 mb-4 transition-colors ${dragOver ? "text-white/50" : "text-zinc-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className={`text-sm mb-1 transition-colors ${dragOver ? "text-white/60" : "text-zinc-500"}`}>
            {dragOver ? "Paleiskite norėdami įkelti" : "Nutempkite .docx failą čia"}
          </p>
          <p className={`text-xs text-zinc-600 mb-5 transition-opacity ${dragOver ? "invisible" : ""}`}>arba</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`text-sm bg-white text-zinc-950 px-4 py-2 rounded-full font-medium hover:bg-zinc-200 transition-all flex items-center gap-2 ${dragOver ? "invisible" : ""}`}
          >
            {uploading && <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
            {uploading ? "Konvertuojama…" : "Pasirinkti failą"}
          </button>
        </div>
      )}

      {uploading && !uploadedFile && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-700 rounded-xl gap-4">
          <svg className="animate-spin w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-sm text-zinc-400">Konvertuojama…</p>
        </div>
      )}

      {uploadedFile && (
        <div className="border border-zinc-800 rounded-xl p-5 flex items-start gap-5">
          {/* Document icon */}
          <div className="w-14 h-16 bg-zinc-800 rounded-lg flex flex-col items-center justify-center shrink-0 border border-zinc-700">
            <svg className="w-6 h-6 text-zinc-400 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wide">docx</span>
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-1">{uploadedFile.name}</p>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>{formatBytes(uploadedFile.size)}</span>
              <span>·</span>
              <span>Microsoft Word</span>
              <span>·</span>
              <span>Įkelta {uploadedFile.uploadedAt.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full rounded-full" />
              </div>
              <span className="text-xs text-emerald-400 shrink-0">100%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => router.push("/dashboard/templates/new")}
              className="text-sm bg-white text-zinc-950 px-4 py-2 rounded-full font-medium hover:bg-zinc-200 transition-colors whitespace-nowrap"
            >
              Redaguoti failą →
            </button>
            <button
              onClick={handleAddDirectly}
              className="text-sm bg-zinc-800 text-white px-4 py-2 rounded-full font-medium hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {addingToTemplates && <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
              {addingToTemplates ? "Pridedama…" : "Pridėti prie šablonų"}
            </button>
            <button
              onClick={() => { setUploadedFile(null); fileInputRef.current?.click(); }}
              className="text-xs text-zinc-500 hover:text-white transition-colors text-center"
            >
              Keisti failą
            </button>
          </div>
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
        <div className="flex flex-col gap-4">
          {(sortedTemplates as unknown as Template[]).map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onDelete={handleDelete}
            />
          ))}
        </div>
        </>
      )}
    </div>
  );
}

function stripHtml(html: string | null | undefined) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function TemplateCard({
  template,
  onDelete,
}: {
  template: Template;
  onDelete: (id: number) => void;
}) {
  const statusStyles: Record<string, string> = {
    draft: "bg-zinc-800 text-zinc-400",
    active: "bg-emerald-950 text-emerald-400",
    archived: "bg-zinc-800 text-zinc-500",
  };
  const statusLabel: Record<string, string> = {
    draft: "Juodraštis",
    active: "Aktyvus",
    archived: "Archyvuotas",
  };

  const preview = stripHtml(template.content).slice(0, 320);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      {/* Header row: name + status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link href={`/dashboard/templates/${template.id}`} className="text-sm font-medium text-white hover:text-zinc-300 transition-colors">
          {template.name}
        </Link>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyles[template.status]}`}>
          {statusLabel[template.status]}
        </span>
      </div>

      {/* Thumbnail */}
      <Link href={`/dashboard/templates/${template.id}`} className="block">
        <div className="relative h-40 overflow-hidden rounded-lg border border-zinc-800 bg-white hover:border-zinc-600 transition-colors">
          <div
            className="absolute top-0 left-0 origin-top-left pointer-events-none select-none"
            style={{ width: "400%", transform: "scale(0.25)", fontSize: "14px", lineHeight: "1.6", padding: "24px", color: "#111" }}
            dangerouslySetInnerHTML={{ __html: template.content ?? "" }}
          />
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent" />
        </div>
      </Link>

      {/* Danger zone */}
      {(template.status === "draft" || template.status === "archived") && (
        <div className="mt-3 pt-3 border-t border-zinc-800/60 flex justify-end">
          <div className="border-l border-red-900/30 pl-2">
            <HoldToDeleteButton onDelete={async () => onDelete(template.id)} />
          </div>
        </div>
      )}
    </div>
  );
}
