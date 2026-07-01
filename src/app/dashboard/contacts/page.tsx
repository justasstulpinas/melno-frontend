"use client";

import { useEffect, useState } from "react";
import { api, Contact } from "@/lib/api";
import { useSortable } from "@/hooks/useSortable";
import { SortBar } from "@/components/SortableHeader";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  const { sorted: sortedContacts, sortKey: cSortKey, sortDir: cSortDir, toggleSort: toggleCSort } = useSortable(
    contacts as unknown as Record<string, unknown>[],
    "name"
  );

  useEffect(() => {
    api.getContacts()
      .then(setContacts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function exportVCard(c: Contact) {
    const lines = ["BEGIN:VCARD", "VERSION:3.0"];
    if (c.name) {
      lines.push(`FN:${c.name}`);
      const parts = c.name.trim().split(" ");
      const last = parts.length > 1 ? parts.pop()! : "";
      const first = parts.join(" ");
      lines.push(`N:${last};${first};;;`);
    }
    if (c.email) lines.push(`EMAIL:${c.email}`);
    if (c.phone) lines.push(`TEL:${c.phone}`);
    if (c.address) lines.push(`ADR:;;${c.address};;;;`);
    lines.push("END:VCARD");

    const blob = new Blob([lines.join("\r\n")], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.name ?? c.email ?? "kontaktas"}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(id: number) {
    if (!confirm("Ištrinti šį kontaktą?")) return;
    try {
      await api.deleteContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const contact = await api.createContact(form);
      setContacts((prev) => [...prev, contact]);
      setForm({ name: "", email: "", phone: "", address: "" });
      setShowForm(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Kontaktai</h1>
          <p className="text-sm text-zinc-400">Žmonės, su kuriais dirbate.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-white text-zinc-950 px-4 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors"
        >
          + Pridėti kontaktą
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white">Naujas kontaktas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Vardas</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">El. paštas</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Telefonas</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+370 600 00000" className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Adresas</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="pvz. Gedimino pr. 1, Vilnius" className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-white text-zinc-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {saving ? "Išsaugoma…" : "Išsaugoti kontaktą"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-zinc-500 hover:text-white transition-colors">
              Atšaukti
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-zinc-500">Kraunama…</p>}

      {!loading && contacts.length === 0 && (
        <div className="text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl py-16 text-center">
          Kontaktų dar nėra. Pridėkite savo pirmą klientą.
        </div>
      )}

      {!loading && contacts.length > 0 && (
        <>
          <div className="mb-4">
            <SortBar
              options={[
                { key: "name", label: "Vardas" },
                { key: "email", label: "El. paštas" },
              ]}
              sortKey={cSortKey as string}
              sortDir={cSortDir}
              onSort={(k) => toggleCSort(k as keyof Record<string, unknown>)}
            />
          </div>
          <div className="flex flex-col gap-2">
            {(sortedContacts as unknown as Contact[]).map((c) => (
              <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{c.name ?? "Be vardo"}</p>
                  <div className="flex gap-4 mt-0.5">
                    {c.email && <p className="text-xs text-zinc-500">{c.email}</p>}
                    {c.phone && <p className="text-xs text-zinc-500">{c.phone}</p>}
                    {c.address && <p className="text-xs text-zinc-500">{c.address}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => exportVCard(c)}
                    title="Eksportuoti į adresų knygą"
                    className="text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-zinc-600 hover:text-red-400 transition-colors">
                    Ištrinti
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
