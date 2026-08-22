"use client";

import { useEffect, useRef, useState } from "react";
import { api, Profile } from "@/lib/api";
import { FloatingInput } from "@/components/FloatingInput";
import { validatePhone } from "@/lib/validation";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
    canvasRef.current!.getContext("2d")!.clearRect(0, 0, 600, 200);
    setHasSig(false);
  }

  function confirm() {
    if (!hasSig) return;
    onSave(canvasRef.current!.toDataURL("image/png").split(",")[1]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-lg overflow-hidden border border-zinc-300">
        <canvas
          ref={canvasRef} width={600} height={200}
          className="w-full touch-none cursor-crosshair block"
          style={{ touchAction: "none" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={confirm} disabled={!hasSig} className="bg-white text-zinc-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40">Išsaugoti parašą</button>
        <button type="button" onClick={clear} disabled={!hasSig} className="text-sm text-zinc-500 hover:text-white transition-colors disabled:opacity-40">Išvalyti</button>
        <button type="button" onClick={onCancel} className="text-sm text-zinc-500 hover:text-white transition-colors ml-auto">Atšaukti</button>
      </div>
    </div>
  );
}

function hasInfo(p: Profile | null) {
  return !!(p?.company_name || p?.company_code || p?.address || p?.phone_number);
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({ profile_name: "", company_name: "", company_code: "", address: "", phone_number: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [modalTouched, setModalTouched] = useState<Record<string, boolean>>({});
  const [showSignPad, setShowSignPad] = useState(false);
  const [savingSig, setSavingSig] = useState(false);
  const [sigError, setSigError] = useState("");
  const [deletingSig, setDeletingSig] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [deletingLogo, setDeletingLogo] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getProfile().then((p) => {
      setProfile(p);
      setForm({
        profile_name: p.profile_name ?? "",
        company_name: p.company_name ?? "",
        company_code: p.company_code ?? "",
        address: p.address ?? "",
        phone_number: p.phone_number ?? "",
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function openEditModal() {
    setForm({
      profile_name: profile?.profile_name ?? "",
      company_name: profile?.company_name ?? "",
      company_code: profile?.company_code ?? "",
      address: profile?.address ?? "",
      phone_number: profile?.phone_number ?? "",
    });
    setModalTouched({});
    setSaveError("");
    setShowEditModal(true);
  }

  const phoneError = modalTouched.phone_number ? validatePhone(form.phone_number) : null;
  const phoneSuccess = modalTouched.phone_number && !phoneError && form.phone_number.trim();

  useEffect(() => {
    if (showEditModal) {
      const isEmpty = Object.values(form).every((v) => !v.trim());
      if (!isEmpty) localStorage.setItem("settings_draft", JSON.stringify(form));
    }
  }, [form, showEditModal]);

  useEffect(() => {
    if (showEditModal) {
      const saved = localStorage.getItem("settings_draft");
      if (saved) {
        try { setForm((prev) => ({ ...prev, ...JSON.parse(saved) })); } catch {}
      }
    }
  }, [showEditModal]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setModalTouched({ phone_number: true });
    if (validatePhone(form.phone_number)) return;
    setSaveError("");
    setSaving(true);
    try {
      const updated = await api.updateProfile(form);
      setProfile(updated);
      localStorage.removeItem("settings_draft");
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowEditModal(false); }, 1000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Nepavyko išsaugoti");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingAvatar(true);
    try {
      await api.uploadAvatar(file);
      const updated = await api.getProfile();
      setProfile(updated);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Nepavyko įkelti nuotraukos");
    } finally {
      setSavingAvatar(false);
      e.target.value = "";
    }
  }

  async function handleDeleteAvatar() {
    setSavingAvatar(true);
    try {
      await api.deleteAvatar();
      const updated = await api.getProfile();
      setProfile(updated);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Nepavyko ištrinti");
    } finally {
      setSavingAvatar(false);
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
        setLogoError(err instanceof Error ? err.message : "Nepavyko įkelti logotipo");
      } finally {
        setSavingLogo(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleDeleteLogo() {
    setDeletingLogo(true);
    try {
      const updated = await api.deleteUserLogo();
      setProfile(updated);
    } catch (err: unknown) {
      setLogoError(err instanceof Error ? err.message : "Nepavyko ištrinti logotipo");
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
    } catch (err: unknown) {
      setSigError(err instanceof Error ? err.message : "Nepavyko išsaugoti parašo");
    } finally {
      setSavingSig(false);
    }
  }

  async function handleDeleteSignature() {
    setDeletingSig(true);
    try {
      const updated = await api.deleteUserSignature();
      setProfile(updated);
    } catch (err: unknown) {
      setSigError(err instanceof Error ? err.message : "Nepavyko ištrinti parašo");
    } finally {
      setDeletingSig(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-zinc-500">Kraunama…</div>;

  const nameFilled = !!profile?.profile_name;

  return (
    <div className="p-8 max-w-2xl">
      {/* Edit modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white">Redaguoti profilį</h2>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <FloatingInput label="Rodomas vardas" value={form.profile_name} onChange={(e) => setForm({ ...form, profile_name: e.target.value })} />
              <FloatingInput label="Įmonės pavadinimas" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <FloatingInput label="Įmonės / IV kodas" value={form.company_code} onChange={(e) => setForm({ ...form, company_code: e.target.value })} />
                <FloatingInput
                  label="Telefonas"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  onBlur={() => setModalTouched((t) => ({ ...t, phone_number: true }))}
                  errorMessage={phoneError ?? undefined}
                  success={!!phoneSuccess}
                />
              </div>
              <FloatingInput label="Adresas" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              {saveError && <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-full px-4 py-2">{saveError}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-white text-zinc-950 px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2">
                  {saving && <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                  {saved ? "Išsaugota!" : saving ? "Išsaugoma…" : "Išsaugoti"}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="text-sm text-zinc-500 hover:text-white transition-colors px-2">
                  Atšaukti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-semibold text-white mb-8">Profilis</h1>

      {/* Avatar + Logo row */}
      <div className="flex gap-6 mb-8">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarUpload} />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={savingAvatar}
            className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-500 transition-colors group disabled:opacity-50 shrink-0"
            style={{ borderRadius: "9999px" }}
          >
            {profile?.avatar_url ? (
              <img src={`${BASE_URL}${profile.avatar_url}`} alt="Avatar" className="absolute inset-0 w-full h-full object-cover block" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>
          {profile?.avatar_url && (
            <button type="button" onClick={handleDeleteAvatar} disabled={savingAvatar} className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors">
              Ištrinti
            </button>
          )}
          {avatarError && <p className="text-[10px] text-red-400 text-center max-w-[80px]">{avatarError}</p>}
        </div>

        {/* Name + email */}
        <div className="flex flex-col justify-center gap-1 flex-1">
          {nameFilled ? (
            <p className="text-lg font-semibold text-white">{profile?.profile_name}</p>
          ) : (
            <button
              type="button"
              onClick={openEditModal}
              className="text-sm text-zinc-500 hover:text-white transition-colors text-left"
            >
              + Pridėti vardą
            </button>
          )}
          <p className="text-sm text-zinc-400">{profile?.email}</p>
        </div>

        {/* Company logo */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
          {profile?.logo_image ? (
            <>
              <div
                className="w-20 h-20 bg-white rounded-xl border border-zinc-700 flex items-center justify-center p-2 cursor-pointer hover:border-zinc-500 transition-colors overflow-hidden"
                onClick={() => logoInputRef.current?.click()}
              >
                <img src={`data:image/png;base64,${profile.logo_image}`} alt="Logotipas" className="w-full h-full object-contain" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={savingLogo} className="text-[10px] text-zinc-500 hover:text-white transition-colors">
                  {savingLogo ? "Keičiama…" : "Keisti"}
                </button>
                <button type="button" onClick={handleDeleteLogo} disabled={deletingLogo} className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors">
                  {deletingLogo ? "…" : "Ištrinti"}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={savingLogo}
              className="w-20 h-20 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-full flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-50"
            >
              <span className="text-lg leading-none">+</span>
              <span className="text-[10px]">{savingLogo ? "Įkeliama…" : "Logotipas"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-zinc-800 mb-6" />

      {/* Profile info card */}
      <div className="mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          {hasInfo(profile) ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Įmonės informacija</h2>
                <button type="button" onClick={openEditModal} className="text-xs text-zinc-500 hover:text-white transition-colors">
                  Redaguoti
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Vardas", value: profile?.profile_name },
                  { label: "Įmonė", value: profile?.company_name },
                  { label: "Kodas", value: profile?.company_code },
                  { label: "Telefonas", value: profile?.phone_number },
                  { label: "Adresas", value: profile?.address },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className="flex items-baseline gap-3">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide w-16 shrink-0">{f.label}</span>
                    <span className="text-sm text-white">{f.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white mb-0.5">Įmonės informacija</p>
                <p className="text-xs text-zinc-500">Pridėkite įmonės informaciją kuri automatiškai susipildys į jūsų šablonus</p>
              </div>
              <button type="button" onClick={openEditModal} className="text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white px-3 py-1.5 rounded-md transition-colors shrink-0">
                + Pridėti
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-zinc-800 mb-6" />

      {/* Signature */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Parašas</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Naudojamas sutartyse su <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">{`{{user_signature}}`}</code> kintamuoju.
        </p>
        {profile?.signature_image ? (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-lg p-4 inline-block">
              <img src={`data:image/png;base64,${profile.signature_image}`} alt="Parašas" className="max-w-[280px] h-auto" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowSignPad(true)} className="text-xs text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white px-3 py-2 rounded-md transition-colors">
                Pakeisti parašą
              </button>
              <button type="button" onClick={handleDeleteSignature} disabled={deletingSig} className="text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50 px-2">
                {deletingSig ? "Trinama…" : "Ištrinti"}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setShowSignPad(true)} className="text-sm text-zinc-500 border border-dashed border-zinc-700 hover:border-zinc-500 hover:text-white px-4 py-3 rounded-md transition-colors w-full text-center">
            + Pridėti parašą
          </button>
        )}
        {showSignPad && !savingSig && (
          <div className="mt-4">
            <SignaturePad onSave={handleSaveSignature} onCancel={() => setShowSignPad(false)} />
          </div>
        )}
        {savingSig && <p className="text-xs text-zinc-500 mt-3">Išsaugoma…</p>}
        {sigError && <p className="text-xs text-red-400 mt-2">{sigError}</p>}
        {logoError && <p className="text-xs text-red-400 mt-2">{logoError}</p>}
      </div>
    </div>
  );
}
