"use client";

import { useEffect, useState } from "react";
import { api, Profile } from "@/lib/api";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ profile_name: "", company_name: "", company_code: "", address: "", phone_number: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          profile_name: p.profile_name ?? "",
          company_name: p.company_name ?? "",
          company_code: p.company_code ?? "",
          address: p.address ?? "",
          phone_number: p.phone_number ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile(form);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Nepavyko išsaugoti");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-zinc-500">Kraunama…</div>;

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Nustatymai</h1>
      <p className="text-sm text-zinc-400 mb-8">Jūsų profilio ir paskyros informacija.</p>

      {/* Account info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <p className="text-xs text-zinc-500 mb-1">El. paštas</p>
        <p className="text-sm text-white">{profile?.email}</p>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-white mb-1">Profilis</h2>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Rodomas vardas</label>
          <input
            value={form.profile_name}
            onChange={(e) => setForm({ ...form, profile_name: e.target.value })}
            placeholder="Jūsų vardas"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Įmonės pavadinimas</label>
          <input
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            placeholder="pvz. MB Mano Įmonė"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Įmonės / IV kodas</label>
          <input
            value={form.company_code}
            onChange={(e) => setForm({ ...form, company_code: e.target.value })}
            placeholder="pvz. 304512345 arba 1234567"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Adresas</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="pvz. Gedimino pr. 1, Vilnius"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telefonas</label>
          <input
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            placeholder="+370 600 00000"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-white text-zinc-950 px-5 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 w-fit"
        >
          {saved ? "Išsaugota!" : saving ? "Išsaugoma…" : "Išsaugoti pakeitimus"}
        </button>
      </form>
    </div>
  );
}
