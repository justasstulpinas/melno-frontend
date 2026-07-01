"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Syne } from "next/font/google";
import { api, saveToken } from "@/lib/api";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.register(email, password);
      const data = await api.login(email, password);
      saveToken(data.access_token, false);
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
