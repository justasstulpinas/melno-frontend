"use client";

import Link from "next/link";
import { useState } from "react";
import { Syne } from "next/font/google";
import { api } from "@/lib/api";
import { FloatingInput } from "@/components/FloatingInput";
import { validateEmail } from "@/lib/validation";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = emailTouched ? validateEmail(email) : null;
  const emailSuccess = emailTouched && !emailError && email.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setEmailTouched(true);
    if (validateEmail(email)) return;
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Klaida. Bandykite dar kartą.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-1/3 bg-zinc-900 px-10 py-12">
        <Link href="/" className=""><img src="/logo.png" alt="Melno" className="h-7 w-auto" /></Link>
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

      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="block mb-10 lg:hidden text-center"><img src="/logo.png" alt="Melno" className="h-7 w-auto mx-auto" /></Link>

          {!submitted ? (
            <>
              <h1 className="text-2xl font-semibold text-white mb-1">Pamiršote slaptažodį?</h1>
              <p className={`${syne.className} text-sm text-zinc-400 mb-8`}>
                Įveskite el. paštą ir atsiųsime slaptažodžio atnaujinimo nuorodą.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                {error && (
                  <p className={`${syne.className} text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-full px-4 py-2`}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-white text-zinc-950 rounded-full py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                >
                  {loading && <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                  {loading ? "Siunčiama…" : "Siųsti nuorodą"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center mx-auto mb-6">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Patikrinkite el. paštą</h1>
              <p className={`${syne.className} text-sm text-zinc-400 mb-8`}>
                Jei paskyra su adresu <span className="text-zinc-200">{email}</span> egzistuoja, netrukus gausite nuorodą.
              </p>
            </div>
          )}

          <p className={`${syne.className} text-center text-sm text-zinc-500 mt-8`}>
            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
              ← Grįžti į prisijungimą
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
