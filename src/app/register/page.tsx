"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Syne } from "next/font/google";
import { api, saveToken } from "@/lib/api";
import { FloatingInput } from "@/components/FloatingInput";
import { validateEmail } from "@/lib/validation";
import { MelnoLogo } from "@/components/MelnoLogo";
import { HeroCycler } from "@/components/HeroCycler";
import { FloatingSelect } from "@/components/FloatingSelect";
import { c, type, r } from "@/lib/design";

const syne = Syne({ subsets: ["latin"], weight: ["400", "600", "700"] });

const FEATURES = [
  {
    title: "Pasirašymas naršyklėje",
    description:
      "Klientas užpildo laukus ir pasirašo tiesiogiai naršyklėje autentikuotu parašu, pasirašytą sutartį gauna iškart. Jūs gausite pranešimą apie pasirašymą ir galėsite sutartį iškart parsisiųsti.",
  },
  {
    title: "Automatiniai pranešimai",
    description:
      "Klientas gauna aiškų laišką su patvirtinimo kodu ir nuoroda. Jūs gausite pranešimą, kai sutartis bus pasirašyta ar atmesta — be jokio rankinio darbo.",
  },
  {
    title: "Šablonai per minutes",
    description:
      "Sukurkite sutarties šabloną su automatiškai užpildomais laukais ir siųskite klientams. Sutartis užpildoma ir pasirašoma per kelias minutes.",
  },
];

const BUSINESS_TYPES = [
  "Fotografas",
  "Videografas",
  "Dekoras",
  "Maisto tiekimas",
  "Statybos",
  "Apskaita",
  "Pervežimas",
  "Laisvai samdomas",
];

const CITIES = [
  "Vilnius",
  "Kaunas",
  "Klaipėda",
  "Šiauliai",
  "Panevėžys",
  "Alytus",
  "Marijampolė",
  "Mažeikiai",
  "Jonava",
  "Utena",
];

const TOTAL_STEPS = 4;

export default function RegisterPage() {
  const router = useRouter();

  // ── Step 1: personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = emailTouched ? validateEmail(email) : null;

  // ── Step 2: business type & location
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");

  // ── Step 3: optional business info
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // ── Step 4: password
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const requirementsMet = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const passwordError = passwordTouched && !requirementsMet ? "Slaptažodis neatitinka reikalavimų" : null;
  const confirmMismatch = confirmTouched && confirm !== password;

  const requirements = [
    { label: "Bent 12 simbolių", met: password.length >= 12 },
    { label: "Bent viena didžioji raidė", met: /[A-Z]/.test(password) },
    { label: "Bent vienas skaičius", met: /[0-9]/.test(password) },
  ];

  // ── Navigation
  const [step, setStep] = useState(1);
  const [displayStep, setDisplayStep] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function changeStep(next: number) {
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setDisplayStep(next);
      setTransitioning(false);
    }, 260);
  }

  // ── Feature carousel
  const [featureIndex, setFeatureIndex] = useState(0);
  const [featureVisible, setFeatureVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((toIndex?: number) => {
    setFeatureVisible(false);
    setTimeout(() => {
      setFeatureIndex((i) => toIndex ?? (i + 1) % FEATURES.length);
      setFeatureVisible(true);
    }, 400);
  }, []);

  const restartTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => advance(), 7500);
  }, [advance]);

  useEffect(() => {
    restartTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [restartTimer]);

  // ── Step navigation
  function nextStep() {
    setError("");
    if (step === 1) {
      setEmailTouched(true);
      if (!firstName.trim() || !lastName.trim()) { setError("Įveskite vardą ir pavardę."); return; }
      if (validateEmail(email)) { setError("Įveskite teisingą el. paštą."); return; }
    }
    if (step === 2) {
      if (!businessType) { setError("Pasirinkite veiklos tipą."); return; }
    }
    changeStep(step + 1);
  }

  function prevStep() {
    setError("");
    changeStep(step - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordTouched(true);
    setConfirmTouched(true);
    if (!requirementsMet || password !== confirm) return;
    setError("");
    setLoading(true);
    try {
      await api.register(email, password);
      const data = await api.login(email, password);
      saveToken(data.access_token, false);
      const profileName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await api.updateProfile({
        profile_name: profileName,
        company_name: companyName || undefined,
        company_code: companyCode || undefined,
        address: address || location || undefined,
        phone_number: phone || undefined,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registracija nepavyko");
    } finally {
      setLoading(false);
    }
  }

  // ── Step labels
  const stepLabels = ["Kontaktai", "Veikla", "Įmonė", "Slaptažodis"];

  return (
    <div className={`${syne.className} min-h-screen flex`}>

      {/* ── Left: feature carousel ── */}
      <div className="hidden lg:flex flex-col w-1/3 px-12 py-10" style={{ background: c.bg }}>
        <div className="mb-auto pb-8">
          <Link href="/"><MelnoLogo /></Link>
        </div>

        <div
          className="flex-1 flex flex-col justify-center"
          style={{ opacity: featureVisible ? 1 : 0, transition: "opacity 0.4s ease" }}
        >
          <h2 style={{ ...type.display, marginBottom: 20 }}>{FEATURES[featureIndex].title}</h2>
          <p style={type.bodyLarge}>{FEATURES[featureIndex].description}</p>
        </div>

        <style>{`@keyframes slideProgress{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
        <div className="flex items-center gap-2 pt-12">
          {FEATURES.map((_, i) => (
            <div
              key={i}
              onClick={() => { advance(i); restartTimer(); }}
              style={{ height: 4, borderRadius: r.sm, cursor: "pointer", transition: "width 0.3s ease", width: i === featureIndex ? 48 : 8, background: "#3a3a3a", overflow: "hidden", flexShrink: 0 }}
            >
              {i === featureIndex ? (
                <div key={`bar-${featureIndex}`} style={{ height: "100%", width: "100%", borderRadius: r.sm, background: "#888", transformOrigin: "left", animation: "slideProgress 7.5s linear forwards", willChange: "transform" }} />
              ) : (
                <div style={{ height: "100%", width: "100%", background: "#3a3a3a", borderRadius: r.sm }} />
              )}
            </div>
          ))}
        </div>

        <p style={{ ...type.label, marginTop: 24, letterSpacing: "normal", textTransform: "none" }}>© 2026 Melno</p>
      </div>

      {/* ── Right: multi-step form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12" style={{ background: c.surface }}>
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link href="/" className="block text-center mb-10 lg:hidden"><MelnoLogo /></Link>

          {/* Title — always visible */}
          <h1 style={{ ...type.display, marginBottom: 4 }}>Sukurti paskyrą</h1>
          <p style={{ ...type.bodyLarge, marginBottom: 24 }}>daugiau jokių laiškų pirmyn atgal</p>

          {/* Step progress bar — click any filled segment to go back */}
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                onClick={() => { if (i + 1 < step) { setError(""); changeStep(i + 1); } }}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: i < step ? c.action : "#333",
                  transition: "background 0.3s ease",
                  cursor: i + 1 < step ? "pointer" : "default",
                  opacity: i + 1 < step ? 1 : i + 1 === step ? 1 : 0.4,
                }}
              />
            ))}
          </div>

          {/* Step label */}
          <p style={{ ...type.label, marginBottom: 24 }}>
            Žingsnis {step} iš {TOTAL_STEPS} — {stepLabels[step - 1]}
          </p>

          {/* ── Step content (animated) ── */}
          <div
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? "translateY(10px)" : "translateY(0)",
              transition: "opacity 0.26s ease, transform 0.26s ease",
            }}
          >

          {/* ── Step 1: Personal info ── */}
          {displayStep === 1 && (
            <div>
              <div className="flex flex-col gap-4">
                <FloatingInput
                  label="Vardas"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <FloatingInput
                  label="Pavardė"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <FloatingInput
                  label="El. paštas"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  errorMessage={emailError ?? undefined}
                  success={emailTouched && !emailError}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Business type & location ── */}
          {displayStep === 2 && (
            <div className="flex flex-col gap-4">
              <FloatingSelect
                label="Veiklos tipas"
                value={businessType}
                onChange={setBusinessType}
                options={BUSINESS_TYPES}
              />
              <FloatingSelect
                label="Darbo miestas"
                value={location}
                onChange={setLocation}
                options={CITIES}
              />
            </div>
          )}

          {/* ── Step 3: Optional business info ── */}
          {displayStep === 3 && (
            <div className="flex flex-col gap-4">
              <p style={{ ...type.body, color: c.textMuted, lineHeight: "1.6" }}>
                Šie duomenys bus automatiškai įterpiami į sutartis ten, kur pasirinksite juos naudoti. Galite praleisti ir užpildyti vėliau nustatymuose.
              </p>
              <FloatingInput
                label="Įmonės pavadinimas arba vardas"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <FloatingInput
                label="Juridinis kodas"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
              />
              <FloatingInput
                label="Telefono numeris"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <FloatingInput
                label="Adresas"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          )}

          {/* ── Step 4: Password ── */}
          {displayStep === 4 && (
            <form onSubmit={handleSubmit}>

              <div className="flex flex-col gap-4">
                <div>
                  <FloatingInput
                    label="Slaptažodis"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    errorMessage={passwordError ?? undefined}
                    success={passwordTouched && requirementsMet}
                    rightElement={
                      <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        {showPassword
                          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        }
                      </button>
                    }
                  />
                  {password.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {requirements.map((req) => (
                        <li key={req.label} className={`flex items-center gap-1.5 text-xs transition-colors ${req.met ? "text-emerald-400" : "text-zinc-500"}`}>
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {req.met
                              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01" />}
                          </svg>
                          {req.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <FloatingInput
                  label="Pakartokite slaptažodį"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  errorMessage={confirmMismatch ? "Slaptažodžiai nesutampa" : undefined}
                  rightElement={
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                      {showConfirm
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
                    </button>
                  }
                />
              </div>

              {error && (
                <p style={{ ...type.body, color: "#f87171", background: "rgba(127,29,29,0.3)", border: "1px solid rgba(153,27,27,0.5)", borderRadius: r.pill, padding: "8px 16px", marginTop: 16 }}>
                  {error}
                </p>
              )}

              {/* Submit button for step 4 */}
              <button
                type="submit"
                disabled={loading}
                style={{ background: c.action, color: c.actionText, borderRadius: r.pill, border: "none", padding: "10px 0", width: "100%", fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.2s" }}
              >
                {loading && <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                {loading ? "Kuriama paskyra…" : "Sukurti paskyrą"}
              </button>
            </form>
          )}

          </div>{/* end animated step content */}

          {/* ── Navigation buttons (steps 1–3) ── */}
          {step < 4 && (
            <div className={`flex gap-3 mt-6 ${step === 1 ? "justify-end" : "justify-between"}`}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  style={{ background: "transparent", border: `1px solid #333`, color: c.textMuted, borderRadius: r.pill, padding: "10px 24px", fontFamily: "'Syne', sans-serif", fontSize: 13, cursor: "pointer", transition: "color 0.15s" }}
                >
                  ← Atgal
                </button>
              )}
              <div className="flex gap-2">
                {displayStep === 3 && (
                  <button
                    type="button"
                    onClick={() => changeStep(4)}
                    style={{ background: "transparent", border: `1px solid #333`, color: c.textMuted, borderRadius: r.pill, padding: "10px 24px", fontFamily: "'Syne', sans-serif", fontSize: 13, cursor: "pointer" }}
                  >
                    Praleisti
                  </button>
                )}
                <button
                  type="button"
                  onClick={nextStep}
                  style={{ background: c.action, color: c.actionText, borderRadius: r.pill, border: "none", padding: "10px 28px", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Toliau →
                </button>
              </div>
            </div>
          )}

          {/* Back button for step 4 */}
          {displayStep === 4 && (
            <button
              type="button"
              onClick={prevStep}
              style={{ display: "block", marginTop: 12, background: "none", border: "none", color: c.textMuted, fontFamily: "'Syne', sans-serif", fontSize: 13, cursor: "pointer", padding: 0 }}
            >
              ← Atgal
            </button>
          )}

          {/* Error for steps 1–3 */}
          {error && step < 4 && (
            <p style={{ ...type.body, color: "#f87171", background: "rgba(127,29,29,0.3)", border: "1px solid rgba(153,27,27,0.5)", borderRadius: r.pill, padding: "8px 16px", marginTop: 12 }}>
              {error}
            </p>
          )}

          {step === 1 && (
            <p style={{ ...type.body, textAlign: "center", marginTop: 28 }}>
              Jau turite paskyrą?{" "}
              <Link href="/login" style={{ color: c.textPrimary }}>Prisijungti</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
