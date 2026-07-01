"use client";

import Link from "next/link";
import { Syne } from "next/font/google";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function SuspendedPage() {
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
        <div className="w-full max-w-md text-center">
          <Link href="/" className="block text-base font-semibold text-white mb-10 lg:hidden tracking-tight">Melno</Link>

          <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-white mb-2">Paskyra sustabdyta</h1>
          <p className={`${syne.className} text-sm text-zinc-400 mb-8 leading-relaxed`}>
            Jūsų paskyra buvo sustabdyta. Tai gali nutikti dėl vienos iš šių priežasčių:
          </p>

          <div className="text-left bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-yellow-400 text-sm mt-0.5">·</span>
              <p className={`${syne.className} text-sm text-zinc-400`}>
                El. paštas nebuvo patvirtintas per 7 dienas nuo registracijos
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-400 text-sm mt-0.5">·</span>
              <p className={`${syne.className} text-sm text-zinc-400`}>
                Paskyra sustabdyta administratoriaus
              </p>
            </div>
          </div>

          <p className={`${syne.className} text-sm text-zinc-400 mb-6`}>
            Jei manote, kad tai klaida, arba norite atblokuoti paskyrą — susisiekite su mumis:
          </p>

          <a
            href="mailto:support@melno.app"
            className="inline-block bg-white text-zinc-950 rounded-md px-6 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors mb-6"
          >
            support@melno.app
          </a>

          <p className={`${syne.className} text-center text-sm text-zinc-500 mt-4`}>
            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
              ← Grįžti į prisijungimą
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
