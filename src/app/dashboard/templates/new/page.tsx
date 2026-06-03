"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import RichTextEditor, { RichTextEditorHandle } from "@/components/RichTextEditor";
import PlaceholderSidebar from "@/components/PlaceholderSidebar";

export default function NewTemplatePage() {
  const router = useRouter();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const template = await api.createTemplate({ name, description: description || undefined, content });
      router.push(`/dashboard/templates/${template.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Nepavyko sukurti šablono");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-20 gap-6">
        <div className="flex items-center gap-3 text-xs text-zinc-500 shrink-0">
          <Link href="/dashboard/templates" className="hover:text-zinc-300 transition-colors">Šablonai</Link>
          <span>/</span>
        </div>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Šablono pavadinimas…"
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none min-w-0"
        />
        <div className="flex items-center gap-3 shrink-0">
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Link href="/dashboard/templates" className="text-sm text-zinc-500 hover:text-white transition-colors">Atšaukti</Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-zinc-950 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? "Kuriama…" : "Sukurti šabloną"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-10">
          <div className="flex gap-8 items-start">
            <div className="flex-1 min-w-0">
              <RichTextEditor
                ref={editorRef}
                value={content}
                onChange={setContent}
                placeholder="Pradėkite rašyti sutartį…"
              />
            </div>
            <PlaceholderSidebar editorRef={editorRef} />
          </div>
        </div>
      </div>
    </form>
  );
}
