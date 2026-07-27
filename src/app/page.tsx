import Link from "next/link";
import type { Metadata } from "next";
import { Syne } from "next/font/google";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Melno — Sutartys be galvos skausmo",
  description: "Įkelk Word šabloną, išsiųsk nuorodą klientui, gauk pasirašytą dokumentą.",
};

const steps = [
  {
    n: "01",
    title: "Įkelkite šabloną",
    body: "Įkelkite savo Word (.docx) failą. Pažymėkite laukus kuriuos užpildys klientas.",
  },
  {
    n: "02",
    title: "Išsiųskite nuorodą",
    body: "Sugeneruokite unikalią nuorodą su savo duomenimis. Klientui paskyra nereikalinga.",
  },
  {
    n: "03",
    title: "Gaukite dokumentą",
    body: "Klientas pasirašo ekrane. Jums patvirtinus — sutartis PDF arba DOCX formatu.",
  },
];

const plans = [
  {
    name: "Nemokamas",
    price: "0€",
    period: "/ mėn.",
    description: "Tobulas pradžiai.",
    features: ["Iki 3 šablonų", "Iki 10 sutarčių / mėn.", "PDF ir DOCX eksportas", "El. pašto pranešimai"],
    cta: "Pradėti nemokamai",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "19€",
    period: "/ mėn.",
    description: "Neribotam verslui.",
    features: ["Neriboti šablonai", "Neriboti sutartys", "Įmonės logotipas dokumentuose", "Prioritetinis palaikymas"],
    cta: "Pradėti Pro",
    href: "/register",
    highlight: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/60">
        <img src="/logo.png" alt="Melno" className="h-7 w-auto" />
        <div className="flex items-center gap-3">
          <Link href="/login" className={`${syne.className} text-sm text-zinc-400 hover:text-white transition-colors`}>
            Prisijungti
          </Link>
          <Link href="/register" className={`${syne.className} text-sm bg-white text-zinc-950 px-4 py-1.5 rounded-md font-medium hover:bg-zinc-200 transition-colors`}>
            Pradėti nemokamai
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex min-h-[calc(100vh-65px)]">

        {/* Left — statement */}
        <div className="hidden lg:flex flex-col justify-between w-2/5 bg-zinc-900 border-r border-zinc-800 px-12 py-16">
          <div />
          <div>
            <p className={`${syne.className} text-5xl font-semibold text-white leading-tight mb-8`}>
              Sutartys.<br />Be galvos<br />skausmo.
            </p>
            <p className={`${syne.className} text-sm text-zinc-500 leading-relaxed max-w-xs`}>
              Įkelk savo Word šabloną, išsiųsk nuorodą klientui ir gauk pasirašytą dokumentą — visa tai per kelias minutes.
            </p>
          </div>
          <p className={`${syne.className} text-xs text-zinc-600`}>© 2026 Melno</p>
        </div>

        {/* Right — CTA */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
          <div className="w-full max-w-md">

            {/* Mobile headline */}
            <h1 className={`${syne.className} text-4xl font-semibold text-white leading-tight mb-4 lg:hidden`}>
              Sutartys.<br />Be galvos skausmo.
            </h1>

            <p className={`${syne.className} text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-6`}>
              Pradėkite per 2 minutes
            </p>

            <h2 className="text-2xl font-semibold text-white mb-2">Sukurti paskyrą nemokamai</h2>
            <p className={`${syne.className} text-sm text-zinc-500 mb-8`}>
              Be kreditinės kortelės. Atšaukite bet kada.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/register"
                className={`${syne.className} w-full bg-white text-zinc-950 py-3 rounded-md text-sm font-semibold hover:bg-zinc-200 transition-colors text-center active:scale-[0.98]`}
              >
                Pradėti nemokamai →
              </Link>
              <Link
                href="/login"
                className={`${syne.className} w-full border border-zinc-800 text-zinc-400 py-3 rounded-md text-sm font-medium hover:border-zinc-600 hover:text-white transition-colors text-center`}
              >
                Jau turiu paskyrą
              </Link>
            </div>

            <div className="mt-10 pt-8 border-t border-zinc-800 grid grid-cols-3 gap-4">
              {[
                { n: "3 min.", label: "vidutinis sąrankos laikas" },
                { n: "100%", label: "be paskyros klientui" },
                { n: "PDF", label: "ir DOCX eksportas" },
              ].map((s) => (
                <div key={s.label}>
                  <p className={`${syne.className} text-lg font-semibold text-white mb-0.5`}>{s.n}</p>
                  <p className={`${syne.className} text-xs text-zinc-600 leading-snug`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-zinc-800">
        <div className="flex min-h-0">

          {/* Label column */}
          <div className="hidden lg:flex w-2/5 bg-zinc-900 border-r border-zinc-800 px-12 py-16 items-start">
            <div>
              <p className={`${syne.className} text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-3`}>Kaip tai veikia</p>
              <h2 className={`${syne.className} text-2xl font-semibold text-white leading-snug`}>
                Trys žingsniai<br />iki pasirašytos<br />sutarties
              </h2>
            </div>
          </div>

          {/* Steps */}
          <div className="flex-1 px-8 lg:px-12 py-16">
            <p className={`${syne.className} text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-8 lg:hidden`}>Kaip tai veikia</p>
            <div className="flex flex-col gap-0 max-w-md">
              {steps.map((step, i) => (
                <div key={step.n} className={`flex gap-6 ${i < steps.length - 1 ? "pb-10" : ""}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0">
                      <span className={`${syne.className} text-[10px] font-semibold text-zinc-500`}>{step.n}</span>
                    </div>
                    {i < steps.length - 1 && <div className="w-px flex-1 bg-zinc-800 mt-2" />}
                  </div>
                  <div className="pb-2">
                    <h3 className={`${syne.className} text-base font-semibold text-white mb-1.5`}>{step.title}</h3>
                    <p className={`${syne.className} text-sm text-zinc-500 leading-relaxed`}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="border-t border-zinc-800">
        <div className="flex min-h-0">

          {/* Label column */}
          <div className="hidden lg:flex w-2/5 bg-zinc-900 border-r border-zinc-800 px-12 py-16 items-start">
            <div>
              <p className={`${syne.className} text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-3`}>Kainos</p>
              <h2 className={`${syne.className} text-2xl font-semibold text-white leading-snug mb-4`}>
                Paprasta<br />kainodara
              </h2>
              <p className={`${syne.className} text-sm text-zinc-500`}>Be paslėptų mokesčių.<br />Atšaukite bet kada.</p>
            </div>
          </div>

          {/* Plans */}
          <div className="flex-1 px-8 lg:px-12 py-16">
            <p className={`${syne.className} text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-8 lg:hidden`}>Kainos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl p-6 flex flex-col ${
                    plan.highlight
                      ? "bg-white text-zinc-950"
                      : "bg-zinc-900 border border-zinc-800"
                  }`}
                >
                  <p className={`${syne.className} text-xs font-semibold uppercase tracking-widest mb-4 ${plan.highlight ? "text-zinc-500" : "text-zinc-600"}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`${syne.className} text-3xl font-semibold`}>{plan.price}</span>
                    <span className={`${syne.className} text-xs ${plan.highlight ? "text-zinc-500" : "text-zinc-600"}`}>{plan.period}</span>
                  </div>
                  <p className={`${syne.className} text-xs mb-6 ${plan.highlight ? "text-zinc-500" : "text-zinc-600"}`}>{plan.description}</p>

                  <ul className="flex flex-col gap-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className={`${syne.className} flex items-start gap-2 text-xs`}>
                        <svg className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.highlight ? "text-zinc-950" : "text-emerald-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={plan.highlight ? "text-zinc-700" : "text-zinc-400"}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={`${syne.className} text-xs font-semibold py-2.5 rounded-md text-center transition-colors ${
                      plan.highlight
                        ? "bg-zinc-950 text-white hover:bg-zinc-800"
                        : "bg-zinc-800 text-white hover:bg-zinc-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 px-8 py-6 flex items-center justify-between">
        <img src="/logo.png" alt="Melno" className="h-5 w-auto opacity-60" />
        <p className={`${syne.className} text-xs text-zinc-700`}>© 2026 Melno</p>
      </footer>

    </div>
  );
}
