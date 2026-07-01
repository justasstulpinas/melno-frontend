"use client";

import { useEffect, useRef, useState } from "react";
import { api, Template, PublicLink, Profile } from "@/lib/api";
import { ContactEmailPicker } from "@/components/ContactEmailPicker";

const PROFILE_MAP: Record<string, keyof Profile> = {
  owner_name: "profile_name",
  owner_company: "company_name",
  owner_company_code: "company_code",
  owner_email: "email",
  owner_address: "address",
  owner_phone: "phone_number",
};

const FRIENDLY: Record<string, string> = {
  owner_name: "Jūsų vardas",
  owner_company: "Įmonė",
  owner_company_code: "Įmonės / IV kodas",
  owner_email: "El. paštas",
  owner_address: "Adresas",
  owner_phone: "Telefonas",
  owner_start_date: "Pradžios data",
  owner_end_date: "Pabaigos data",
  owner_due_date: "Termino data",
  owner_deadline_date: "Galutinis terminas",
};

function extractOwnerFields(content: string): string[] {
  const matches = content.matchAll(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g);
  const fields = new Set<string>();
  for (const m of matches) {
    if (m[1].startsWith("owner_")) fields.add(m[1]);
  }
  return Array.from(fields).sort();
}

function isDateField(field: string) {
  return field.endsWith("_date") || field.endsWith("_deadline") || field === "owner_deadline_date";
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function NewContractModal({ onClose }: { onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<"pick" | "configure" | "done">("pick");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ownerFields, setOwnerFields] = useState<string[]>([]);
  const [prefill, setPrefill] = useState<Record<string, string>>({});
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<PublicLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    Promise.all([api.getTemplates(), api.getProfile()])
      .then(([ts, p]) => {
        setTemplates(ts.filter((t) => t.status === "active"));
        setProfile(p);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function selectTemplate(t: Template) {
    setSelected(t);
    const fields = extractOwnerFields(t.content);
    setOwnerFields(fields);
    const initial: Record<string, string> = {};
    for (const field of fields) {
      const profileKey = PROFILE_MAP[field];
      const val = profileKey && profile ? (profile[profileKey] as string | null) : null;
      initial[field] = val ?? "";
    }
    setPrefill(initial);
    setStep("configure");
  }

  async function handleGenerate() {
    if (!selected) return;
    setLoading(true);
    try {
      const formatted: Record<string, string> = {};
      for (const [k, v] of Object.entries(prefill)) {
        formatted[k] = isDateField(k) && v ? formatDate(v) : v;
      }
      const link = await api.createLink({
        template_id: selected.id,
        expires_in_hours: expiresInHours,
        prefill: formatted,
      });
      setGeneratedLink(link);
      setStep("done");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Nepavyko sugeneruoti nuorodos");
    } finally {
      setLoading(false);
    }
  }

  const publicUrl = generatedLink && typeof window !== "undefined"
    ? `${window.location.origin}/sign/${generatedLink.token}`
    : "";

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const nonDateFields = ownerFields.filter((f) => !isDateField(f));
  const dateFields = ownerFields.filter((f) => isDateField(f));

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            {step !== "pick" && (
              <button
                onClick={() => { setStep("pick"); setSelected(null); setGeneratedLink(null); }}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-base font-semibold text-white">
              {step === "pick" && "Pasirinkite šabloną"}
              {step === "configure" && selected?.name}
              {step === "done" && "Nuoroda sugeneruota"}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5">

          {/* Step 1 — pick template */}
          {step === "pick" && (
            <div className="flex flex-col gap-2">
              {templates.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-8">
                  Nėra aktyvių šablonų. Sukurkite ir aktyvuokite šabloną pirma.
                </p>
              )}
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className="text-left w-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-lg px-4 py-3 transition-colors"
                >
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  {t.description && <p className="text-xs text-zinc-500 mt-0.5 truncate">{t.description}</p>}
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — configure */}
          {step === "configure" && (
            <div className="flex flex-col gap-5">
              {nonDateFields.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jūsų duomenys</p>
                  {nonDateFields.map((field) => (
                    <div key={field}>
                      <label className="block text-xs text-zinc-400 mb-1">{FRIENDLY[field] ?? field}</label>
                      <input
                        value={prefill[field] ?? ""}
                        onChange={(e) => setPrefill({ ...prefill, [field]: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      />
                    </div>
                  ))}
                </div>
              )}

              {dateFields.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Datos</p>
                  {dateFields.map((field) => (
                    <div key={field}>
                      <label className="block text-xs text-zinc-400 mb-1">{FRIENDLY[field] ?? field.replace(/_/g, " ")}</label>
                      <input
                        type="date"
                        value={prefill[field] ?? ""}
                        onChange={(e) => setPrefill({ ...prefill, [field]: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-600 [color-scheme:dark]"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nuoroda galioja</label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-600"
                >
                  <option value={24}>24 val.</option>
                  <option value={48}>48 val.</option>
                  <option value={72}>72 val.</option>
                  <option value={168}>7 dienos</option>
                  <option value={720}>30 dienų</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3 — done */}
          {step === "done" && (
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xs text-zinc-500">Dalinkitės šia nuoroda su klientu</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={publicUrl}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none"
                />
                <button
                  onClick={copyLink}
                  className="shrink-0 bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:text-white px-3 py-2 rounded-md transition-colors"
                >
                  {copied ? "✓" : "Kopijuoti"}
                </button>
              </div>
              {generatedLink && (
                <p className="text-xs text-zinc-600">
                  Galioja iki:{" "}
                  {new Date(generatedLink.expires_at.endsWith("Z") ? generatedLink.expires_at : generatedLink.expires_at + "Z").toLocaleString("lt-LT", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs text-zinc-600">arba</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              <p className="text-xs text-zinc-400">Siųsti tiesiogiai el. paštu</p>
              <div className="flex items-center gap-2">
                <ContactEmailPicker value={recipientEmail} onChange={setRecipientEmail} />
                <a
                  href={recipientEmail && generatedLink ? (() => {
                    const subject = encodeURIComponent(`Sutartis pasirašymui: ${selected?.name}`);
                    const body = encodeURIComponent(
                      `Sveiki,\n\nSiunčiu jums sutartį pasirašymui.\n\nPaspauskite žemiau esančią nuorodą, peržiūrėkite sutartį ir užpildykite reikiamus laukus:\n\n${publicUrl}\n\nNuoroda galios iki: ${new Date(generatedLink.expires_at).toLocaleString("lt-LT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}\n\nJei turite klausimų, susisiekite su mumis.\n\nPagarbiai`
                    );
                    return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
                  })() : "#"}
                  onClick={(e) => { if (!recipientEmail) e.preventDefault(); }}
                  className={`shrink-0 text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                    recipientEmail
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  Siųsti →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "configure" && (
          <div className="px-6 py-4 border-t border-zinc-800 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-white text-zinc-950 py-2.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Generuojama…" : "Generuoti nuorodą →"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="px-6 py-4 border-t border-zinc-800 shrink-0">
            <button
              onClick={onClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-md text-sm font-medium transition-colors"
            >
              Uždaryti
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
