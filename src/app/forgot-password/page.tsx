"use client";

import Link from "next/link";
import { useState } from "react";
import { Syne } from "next/font/google";
import { api } from "@/lib/api";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-1/3 bg-zinc-900 px-10 py-12">
        <Link href="/" className="text-base font-semibold text-white tracking-tight">Melno</Link>
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
          <Link href="/" className="block text-center text-base font-semibold text-white mb-10 lg:hidden tracking-tight">Melno</Link>

          {!submitted ? (
            <>
              <h1 className="text-2xl font-semibold text-white mb-1">Forgot password?</h1>
              <p className={`${syne.className} text-sm text-zinc-400 mb-8`}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className={`${syne.className} block text-xs font-medium text-zinc-400 mb-1.5`}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
                  />
                </div>

                {error && (
                  <p className={`${syne.className} text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2`}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-zinc-950 rounded-md py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 active:scale-[0.98] mt-2"
                >
                  {loading ? "Sending…" : "Send reset link"}
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
              <h1 className="text-2xl font-semibold text-white mb-2">Check your email</h1>
              <p className={`${syne.className} text-sm text-zinc-400 mb-8`}>
                If an account exists for <span className="text-zinc-200">{email}</span>, you&apos;ll receive a reset link shortly.
              </p>
            </div>
          )}

          <p className={`${syne.className} text-center text-sm text-zinc-500 mt-8`}>
            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
