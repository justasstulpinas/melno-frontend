"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Syne } from "next/font/google";
import { api, saveToken } from "@/lib/api";
import { FloatingInput } from "@/components/FloatingInput";
import { validateEmail } from "@/lib/validation";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmMismatch = confirmTouched && confirm !== password;
  const emailError = emailTouched ? validateEmail(email) : null;
  const emailSuccess = emailTouched && !emailError;

  const requirementsMet = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const passwordError = passwordTouched && !requirementsMet ? "Slaptažodis neatitinka reikalavimų" : null;
  const passwordSuccess = passwordTouched && requirementsMet;

  const requirements = [
    { label: "Bent 12 simbolių", met: password.length >= 12 },
    { label: "Bent viena didžioji raidė", met: /[A-Z]/.test(password) },
    { label: "Bent vienas skaičius", met: /[0-9]/.test(password) },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmTouched(true);
    if (validateEmail(email) || !requirementsMet || password !== confirm) return;
    setError("");
    setLoading(true);
    try {
      await api.register(email, password);
      const data = await api.login(email, password);
      saveToken(data.access_token, false);
      if (name.trim()) {
        await api.updateProfile({ profile_name: name.trim() });
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registracija nepavyko");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left — 1/3 brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/3 bg-zinc-900 px-10 py-12">
        <Link href="/" className="text-base font-semibold text-white tracking-tight">
          Melno
        </Link>

        <div>
          <p className={`${syne.className} text-4xl font-semibold text-white leading-snug mb-6`}>
            Sutartys.<br />Greitai.<br />Paprastai.
          </p>
          <ul className="flex flex-col gap-3">
            {[
              "Šablonas paruoštas per 3 minutes",
              "Klientas pasirašo be paskyros",
              "PDF ir DOCX parsisiuntimas iš karto",
            ].map((item) => (
              <li key={item} className={`${syne.className} flex items-center gap-2.5 text-sm text-zinc-400`}>
                <span className="w-1 h-1 rounded-full bg-zinc-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className={`${syne.className} text-xs text-zinc-600`}>© 2026 Melno</p>
      </div>

      {/* Right — 2/3 form */}
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link href="/" className="block text-center text-base font-semibold text-white mb-10 lg:hidden tracking-tight">
            Melno
          </Link>

          <h1 className="text-2xl font-semibold text-white mb-1">Sukurti paskyrą</h1>
          <p className={`${syne.className} text-sm text-zinc-400 mb-8`}>Pradėkite siųsti sutartis per kelias minutes</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FloatingInput label="Vardas" value={name} onChange={(e) => setName(e.target.value)} />
            <FloatingInput
              label="El. paštas"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              errorMessage={emailError ?? undefined}
              success={!!emailSuccess}
            />
            <div>
              <FloatingInput
                label="Slaptažodis"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                errorMessage={passwordError ?? undefined}
                success={!!passwordSuccess}
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
                  {requirements.map((r) => (
                    <li key={r.label} className={`flex items-center gap-1.5 text-xs transition-colors ${r.met ? "text-emerald-400" : "text-zinc-500"}`}>
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {r.met ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01" />}
                      </svg>
                      {r.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
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
              <p className={`${syne.className} text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-full px-3 py-2`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-white text-zinc-950 rounded-full py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {loading && <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
              {loading ? "Kuriama paskyra…" : "Sukurti paskyrą"}
            </button>
          </form>

          <p className={`${syne.className} text-center text-sm text-zinc-500 mt-8`}>
            Jau turite paskyrą?{" "}
            <Link href="/login" className="text-zinc-300 hover:text-white transition-colors">
              Prisijungti
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
