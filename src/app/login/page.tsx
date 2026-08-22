"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Syne } from "next/font/google";
import { api, saveToken } from "@/lib/api";
import { FloatingInput } from "@/components/FloatingInput";
import { validateEmail } from "@/lib/validation";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600"] });

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordReset = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password && !password.trim() ? "Slaptažodis yra privalomas" : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      saveToken(data.access_token, remember);
      const redirect = searchParams.get("redirect");
      router.push(redirect ?? "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Prisijungti nepavyko");
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
          <p className={`${syne.className} text-sm text-zinc-500 leading-relaxed`}>
            Sukurk šabloną vieną kartą ir siųsk pasirašyti klientams per 30 sekundžių.
          </p>
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

          <h1 className="text-2xl font-semibold text-white mb-1">Sveiki sugrįžę</h1>
          <p className={`${syne.className} text-sm text-zinc-400 mb-8`}>Prisijunkite prie savo paskyros</p>

          {passwordReset && (
            <p className={`${syne.className} text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 rounded-full px-3 py-2 mb-4`}>
              Slaptažodis sėkmingai pakeistas. Galite prisijungti.
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FloatingInput
              label="El. paštas"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              errorMessage={emailError ?? undefined}
            />
            <FloatingInput
              label="Slaptažodis"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              errorMessage={passwordError ?? undefined}
              rightElement={
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              }
            />

            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => setRemember(!remember)}
                className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors shrink-0 ${
                  remember
                    ? "bg-white border-white"
                    : "bg-transparent border-zinc-600 group-hover:border-zinc-400"
                }`}
              >
                {remember && (
                  <svg className="w-2.5 h-2.5 text-zinc-950" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M1.5 5l2.5 2.5L8.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </div>
              <span
                onClick={() => setRemember(!remember)}
                className={`${syne.className} text-xs select-none ${remember ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"} transition-colors`}
              >
                Prisiminti mane
              </span>
            </label>

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
              {loading ? "Jungiamasi…" : "Prisijungti"}
            </button>
          </form>

          <p className={`${syne.className} text-center text-sm text-zinc-500 mt-4`}>
            <Link href="/forgot-password" className="text-zinc-400 hover:text-white transition-colors">
              Pamiršote slaptažodį?
            </Link>
          </p>

          <p className={`${syne.className} text-center text-sm text-zinc-500 mt-4`}>
            Neturite paskyros?{" "}
            <Link href="/register" className="text-zinc-300 hover:text-white transition-colors">
              Registruotis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
