"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Template } from "@/lib/api";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleArchive(id: number) {
    try {
      const updated = await api.archiveTemplate(id);
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Ištrinti šį šabloną?")) return;
    try {
      await api.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleDuplicate(id: number) {
    try {
      const copy = await api.duplicateTemplate(id);
      router.push(`/dashboard/templates/${copy.id}/edit`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Šablonai</h1>
          <p className="text-sm text-zinc-400">Tvarkykite savo sutarčių šablonus.</p>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="text-sm bg-white text-zinc-950 px-4 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors"
        >
          + Naujas šablonas
        </Link>
      </div>

      {loading && <p className="text-sm text-zinc-500">Kraunama…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-sm text-zinc-500 mb-4">Šablonų dar nėra</p>
          <Link
            href="/dashboard/templates/new"
            className="text-sm bg-white text-zinc-950 px-4 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors"
          >
            Sukurti pirmą šabloną
          </Link>
        </div>
      )}

      {!loading && templates.length > 0 && (
        <div className="flex flex-col gap-2">
          {templates.map((t) => (
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
          <button
            onClick={() => onDelete(template.id)}
            className="text-xs text-zinc-400 hover:text-red-400 transition-colors px-2 py-1"
          >
            Ištrinti
          </button>
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
