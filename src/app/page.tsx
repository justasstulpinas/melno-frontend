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
    <div className={`${syne.className} min-h-screen bg-black text-white`}>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-7">
        <span className="text-sm font-semibold tracking-[0.18em] uppercase text-white">Melno</span>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Prisijungti
          </Link>
          <Link href="/register" className="text-sm border border-white/25 hover:border-white/60 text-white px-6 py-2 rounded-full transition-colors">
            Registruotis
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex items-center min-h-[calc(100vh-72px)] overflow-hidden px-10">

        {/* Left — text */}
        <div className="relative z-10 flex flex-col justify-center max-w-lg">
          <h1 className="text-[clamp(3.5rem,7vw,6rem)] font-semibold leading-[1.02] tracking-tight mb-6">
            Sutartys.<br />
            Be galvos<br />
            skausmo.
          </h1>
          <p className="text-base text-zinc-400 leading-relaxed max-w-xs">
            Įkelk savo Word šabloną, išsiųsk nuorodą klientui ir gauk pasirašytą dokumentą — visa tai per kelias minutes.
          </p>
        </div>

        {/* Right — large circle with logo, bleeds off screen */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[12%] rounded-full flex items-center justify-center"
          style={{
            width: "90vh",
            height: "90vh",
            background: "#111111",
          }}
        >
          <img
            src="/logo.png"
            alt="Melno"
            style={{ width: "55%", height: "55%", objectFit: "contain" }}
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-zinc-900 px-8 py-24">
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-[0.2em] mb-4">Kaip tai veikia</p>
        <h2 className="text-4xl font-semibold tracking-tight mb-16 max-w-md">
          Trys žingsniai iki pasirašytos sutarties
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step) => (
            <div key={step.n}>
              <p className="text-xs text-zinc-700 font-semibold tracking-widest mb-4">{step.n}</p>
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="border-t border-zinc-900 px-8 py-24">
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-[0.2em] mb-4">Kainos</p>
        <h2 className="text-4xl font-semibold tracking-tight mb-16">Paprasta kainodara</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.highlight
                  ? "bg-white text-black"
                  : "border border-zinc-800 text-white"
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-widest mb-5 ${plan.highlight ? "text-zinc-500" : "text-zinc-600"}`}>
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-semibold">{plan.price}</span>
                <span className={`text-xs ${plan.highlight ? "text-zinc-500" : "text-zinc-600"}`}>{plan.period}</span>
              </div>
              <p className={`text-xs mb-8 ${plan.highlight ? "text-zinc-500" : "text-zinc-600"}`}>{plan.description}</p>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg className={`w-3.5 h-3.5 shrink-0 ${plan.highlight ? "text-black" : "text-emerald-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlight ? "text-zinc-700" : "text-zinc-400"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`text-sm font-semibold py-3 rounded-full text-center transition-colors ${
                  plan.highlight
                    ? "bg-black text-white hover:bg-zinc-900"
                    : "border border-zinc-700 text-white hover:border-zinc-500"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-900 px-8 py-6 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-700">Melno</span>
        <p className="text-xs text-zinc-800">© 2026 Melno</p>
      </footer>

    </div>
  );
}
