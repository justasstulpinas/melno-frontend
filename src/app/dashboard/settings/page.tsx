"use client";

import { useEffect, useRef, useState } from "react";
import { api, Profile } from "@/lib/api";

function SignaturePad({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSig, setHasSig] = useState(false);

  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSig(true);
  }

  function stopDraw() { drawing.current = false; }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  }

  function confirm() {
    if (!hasSig) return;
    const dataUrl = canvasRef.current!.toDataURL("image/png").split(",")[1];
    onSave(dataUrl);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-lg overflow-hidden border border-zinc-300">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full touch-none cursor-crosshair block"
          style={{ touchAction: "none" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirm}
          disabled={!hasSig}
          className="bg-white text-zinc-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40"
        >
          Išsaugoti parašą
        </button>
        <button type="button" onClick={clear} disabled={!hasSig} className="text-sm text-zinc-500 hover:text-white transition-colors disabled:opacity-40">
          Išvalyti
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-zinc-500 hover:text-white transition-colors ml-auto">
          Atšaukti
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ profile_name: "", company_name: "", company_code: "", address: "", phone_number: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const [savingSig, setSavingSig] = useState(false);
  const [deletingSig, setDeletingSig] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);

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

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setSavingLogo(true);
      try {
        const updated = await api.saveUserLogo(base64);
        setProfile(updated);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Nepavyko įkelti logotipo");
      } finally {
        setSavingLogo(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleDeleteLogo() {
    if (!confirm("Ištrinti logotipą?")) return;
    setDeletingLogo(true);
    try {
      const updated = await api.deleteUserLogo();
      setProfile(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Nepavyko ištrinti logotipo");
    } finally {
      setDeletingLogo(false);
    }
  }

  async function handleSaveSignature(base64: string) {
    setSavingSig(true);
    try {
      const updated = await api.saveUserSignature(base64);
      setProfile(updated);
      setShowSignPad(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Nepavyko išsaugoti parašo");
    } finally {
      setSavingSig(false);
    }
  }

  async function handleDeleteSignature() {
    if (!confirm("Ištrinti savo parašą?")) return;
    setDeletingSig(true);
    try {
      const updated = await api.deleteUserSignature();
      setProfile(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Nepavyko ištrinti parašo");
    } finally {
      setDeletingSig(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-zinc-500">Kraunama…</div>;

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Profilis</h1>
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
          <input value={form.profile_name} onChange={(e) => setForm({ ...form, profile_name: e.target.value })} placeholder="Jūsų vardas" className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Įmonės pavadinimas</label>
          <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="pvz. MB Mano Įmonė" className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Įmonės / IV kodas</label>
          <input value={form.company_code} onChange={(e) => setForm({ ...form, company_code: e.target.value })} placeholder="pvz. 304512345 arba 1234567" className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Adresas</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="pvz. Gedimino pr. 1, Vilnius" className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telefonas</label>
          <input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="+370 600 00000" className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
        </div>
        <button type="submit" disabled={saving} className="bg-white text-zinc-950 px-5 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 w-fit">
          {saved ? "Išsaugota!" : saving ? "Išsaugoma…" : "Išsaugoti pakeitimus"}
        </button>
      </form>

      {/* Logo */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-6">
        <h2 className="text-sm font-semibold text-white mb-1">Įmonės logotipas</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Rodomas PDF dokumentuose. Logotipo padėtį galite nustatyti kuriant nuorodą klientui.
        </p>
        {profile?.logo_image ? (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-lg p-4 inline-block">
              <img src={`data:image/png;base64,${profile.logo_image}`} alt="Logotipas" className="max-h-16 max-w-[200px] object-contain" />
            </div>
            <div className="flex gap-2">
              <label className="text-xs text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white px-3 py-2 rounded-md transition-colors cursor-pointer">
                {savingLogo ? "Keičiama…" : "Pakeisti logotipą"}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
              </label>
              <button onClick={handleDeleteLogo} disabled={deletingLogo} className="text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50 px-2">
                {deletingLogo ? "Trinama…" : "Ištrinti"}
              </button>
            </div>
          </div>
        ) : (
          <label className="flex items-center justify-center border border-dashed border-zinc-700 hover:border-zinc-500 hover:text-white text-zinc-400 text-sm rounded-md px-4 py-6 cursor-pointer transition-colors w-full text-center">
            {savingLogo ? "Įkeliama…" : "+ Įkelti logotipą"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
          </label>
        )}
      </div>

      {/* Signature */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-6">
        <h2 className="text-sm font-semibold text-white mb-1">Jūsų parašas</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Naudojamas sutartyse su <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">{`{{user_signature}}`}</code> kintamuoju.
        </p>
        {profile?.signature_image ? (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-lg p-4 inline-block">
              <img src={`data:image/png;base64,${profile.signature_image}`} alt="Jūsų parašas" className="max-w-[280px] h-auto" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSignPad(true)} className="text-xs text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white px-3 py-2 rounded-md transition-colors">
                Pakeisti parašą
              </button>
              <button onClick={handleDeleteSignature} disabled={deletingSig} className="text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50 px-2">
                {deletingSig ? "Trinama…" : "Ištrinti"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowSignPad(true)} className="text-sm text-zinc-400 border border-dashed border-zinc-700 hover:border-zinc-500 hover:text-white px-4 py-3 rounded-md transition-colors w-full text-center">
            + Pridėti parašą
          </button>
        )}
        {showSignPad && !savingSig && (
          <div className="mt-4">
            <SignaturePad onSave={handleSaveSignature} onCancel={() => setShowSignPad(false)} />
          </div>
        )}
        {savingSig && <p className="text-xs text-zinc-500 mt-3">Išsaugoma…</p>}
      </div>
    </div>
  );
}
