"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Syne } from "next/font/google";
import { api, saveToken } from "@/lib/api";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      saveToken(data.access_token);
      if (remember) localStorage.setItem("remember", "1");
      else localStorage.removeItem("remember");
      router.push("/dashboard");
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={`${syne.className} block text-xs font-medium text-zinc-400 mb-1.5`}>El. paštas</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jusu@pastas.lt"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
              />
            </div>
            <div>
              <label className={`${syne.className} block text-xs font-medium text-zinc-400 mb-1.5`}>Slaptažodis</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
              />
            </div>

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
              <p className={`${syne.className} text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-zinc-950 rounded-md py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 active:scale-[0.98] mt-2"
            >
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
