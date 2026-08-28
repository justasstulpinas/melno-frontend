"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, Template, SecureSubmissionResult, Profile } from "@/lib/api";
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

function isDateField(field: string) {
  return field.endsWith("_date") || field.endsWith("_deadline") || field === "owner_deadline_date";
}

function extractOwnerFields(content: string): string[] {
  const matches = content.matchAll(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g);
  const fields = new Set<string>();
  for (const m of matches) {
    if (m[1].startsWith("owner_")) fields.add(m[1]);
  }
  return Array.from(fields).sort();
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, days: number): string {
  if (!iso) return "";
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function ShareLinkPage() {
  const params = useParams();
  const id = Number(params.id);

  const [template, setTemplate] = useState<Template | null>(null);
  const [ownerFields, setOwnerFields] = useState<string[]>([]);
  const [prefill, setPrefill] = useState<Record<string, string>>({});
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [result, setResult] = useState<SecureSubmissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    Promise.all([api.getTemplate(id), api.getProfile()])
      .then(([t, profile]) => {
        setTemplate(t);
        const fields = t.docx_path
          ? t.placeholders.filter((f) => f.startsWith("owner_"))
          : extractOwnerFields(t.content ?? "");
        setOwnerFields(fields);
        const initial: Record<string, string> = {};
        const filled = new Set<string>();
        for (const field of fields) {
          const profileKey = PROFILE_MAP[field];
          const profileValue = profileKey ? (profile[profileKey] as string | null) : null;
          initial[field] = profileValue ?? "";
          if (profileValue) filled.add(field);
        }
        setPrefill(initial);
        setAutoFilled(filled);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [id]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const formatted: Record<string, string> = {};
      for (const [k, v] of Object.entries(prefill)) {
        formatted[k] = isDateField(k) && v ? formatDate(v) : v;
      }
      const res = await api.createSecureSubmission({
        template_id: id,
        expires_in_hours: expiresInHours,
        prefill: formatted,
        recipient_email: recipientEmail || undefined,
      });
      setResult(res);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to generate link");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function setDateWithDuration(field: string, startField: string, days: number) {
    const startVal = prefill[startField];
    if (!startVal) { alert("Pirmiausia nustatykite pradžios datą."); return; }
    setPrefill((prev) => ({ ...prev, [field]: addDays(startVal, days) }));
  }

  const publicUrl = result
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/sign/${result.uuid}`
    : null;

  const nonDateFields = ownerFields.filter((f) => !isDateField(f));
  const dateFields = ownerFields.filter((f) => isDateField(f));

  if (fetching) return <div className="p-8 text-sm text-zinc-500">Kraunama…</div>;

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
        <Link href="/dashboard/templates" className="hover:text-zinc-300 transition-colors">Šablonai</Link>
        <span>/</span>
        <Link href={`/dashboard/templates/${id}`} className="hover:text-zinc-300 transition-colors">{template?.name}</Link>
        <span>/</span>
        <span className="text-zinc-300">Dalintis</span>
      </div>

      <h1 className="text-2xl font-semibold text-white mb-1">Dalintis nuoroda</h1>
      <p className="text-sm text-zinc-400 mb-8">Sugeneruokite nuorodą, kurią klientas gali naudoti sutarčiai užpildyti ir pasirašyti.</p>

      {!result ? (
        <div className="flex flex-col gap-5">
          {nonDateFields.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white mb-0.5">Jūsų duomenys</h2>
                <p className="text-xs text-zinc-500">Užpildyta iš jūsų profilio. Redaguokite jei reikia.</p>
              </div>
              {nonDateFields.map((field) => {
                const isAuto = autoFilled.has(field);
                return (
                  <div key={field}>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{FRIENDLY[field] ?? field}</label>
                    <input
                      value={prefill[field] ?? ""}
                      onChange={(e) => {
                        setPrefill({ ...prefill, [field]: e.target.value });
                        setAutoFilled((prev) => { const next = new Set(prev); next.delete(field); return next; });
                      }}
                      className={`w-full rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 transition-colors ${
                        isAuto
                          ? "bg-yellow-950/30 border border-yellow-600/60 focus:ring-yellow-600/40"
                          : "bg-zinc-800 border border-zinc-700 focus:ring-zinc-600"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {dateFields.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-semibold text-white mb-0.5">Sutarties datos</h2>
                <p className="text-xs text-zinc-500">Pasirinkite datas, kurios bus sutartyje.</p>
              </div>
              {dateFields.map((field) => {
                const isAuto = autoFilled.has(field);
                return (
                <div key={field}>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">{FRIENDLY[field] ?? field.replace(/_/g, " ")}</label>
                  <input
                    type="date"
                    value={prefill[field] ?? ""}
                    onChange={(e) => {
                      setPrefill({ ...prefill, [field]: e.target.value });
                      setAutoFilled((prev) => { const next = new Set(prev); next.delete(field); return next; });
                    }}
                    className={`w-full rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 [color-scheme:dark] transition-colors ${
                      isAuto
                        ? "bg-yellow-950/30 border border-yellow-600/60 focus:ring-yellow-600/40"
                        : "bg-zinc-800 border border-zinc-700 focus:ring-zinc-600"
                    }`}
                  />
                  {(field.includes("end") || field.includes("due") || field.includes("deadline")) && ownerFields.includes("owner_start_date") && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[11px] text-zinc-500">Nuo pradžios datos:</span>
                      {[{label:"+1 savaitė",days:7},{label:"+2 savaitės",days:14},{label:"+1 mėnuo",days:30},{label:"+3 mėnesiai",days:90}].map(({label,days}) => (
                        <button key={days} type="button" onClick={() => setDateWithDuration(field,"owner_start_date",days)} className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors">
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-white">Nuorodos nustatymai</h2>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nuoroda galioja</label>
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

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Siųsti klientui el. paštu <span className="text-zinc-600">(neprivaloma)</span>
              </label>
              <ContactEmailPicker value={recipientEmail} onChange={setRecipientEmail} />
              <p className="text-xs text-zinc-600 mt-1.5">
                Jei nurodysite el. paštą — sistema automatiškai išsiųs nuorodą ir kodą klientui.
                Jei ne — kodą gausite čia ir siųsite patys.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-white text-zinc-950 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 w-fit"
            >
              {loading ? "Generuojama…" : "Generuoti nuorodą"}
            </button>
          </div>

          {ownerFields.length > 0 && (
            <p className="text-xs text-zinc-600">
              Trūksta duomenų?{" "}
              <Link href="/dashboard/settings" className="text-zinc-400 hover:text-white transition-colors underline">
                Atnaujinkite profilį →
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-5">

          {result.email_sent ? (
            /* Email was sent automatically */
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-4 py-3">
              <p className="text-sm text-emerald-400 font-medium mb-0.5">El. laiškas išsiųstas</p>
              <p className="text-xs text-emerald-500/80">
                Nuoroda ir patvirtinimo kodas išsiųsti adresu <strong>{recipientEmail}</strong>.
              </p>
            </div>
          ) : (
            /* Manual sharing — show URL + code */
            <>
              <div>
                <p className="text-xs text-zinc-500 mb-2">Nuoroda klientui</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={publicUrl ?? ""}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(publicUrl!)}
                    className="shrink-0 bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:text-white px-3 py-2 rounded-md transition-colors"
                  >
                    {copied ? "Nukopijuota!" : "Kopijuoti"}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-2">Patvirtinimo kodas — siųskite klientui atskirai</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2.5 text-xl font-mono text-white tracking-widest text-center select-all">
                    {result.access_code}
                  </div>
                  <button
                    onClick={() => handleCopyCode(result.access_code!)}
                    className="shrink-0 bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:text-white px-3 py-2 rounded-md transition-colors"
                  >
                    {codeCopied ? "Nukopijuota!" : "Kopijuoti"}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-1.5">Klientas įves šį kodą prieš peržiūrėdamas sutartį.</p>
              </div>
            </>
          )}

          <div className="text-xs text-zinc-500">
            Galioja iki:{" "}
            {new Date(result.expires_at.endsWith("Z") ? result.expires_at : result.expires_at + "Z").toLocaleString("lt-LT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>

          <button
            onClick={() => setResult(null)}
            className="text-xs text-zinc-500 hover:text-white transition-colors w-fit"
          >
            ← Sukurti naują nuorodą
          </button>
        </div>
      )}
    </div>
  );
}
