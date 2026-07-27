import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Melno — Sutartys be galvos skausmo",
  description: "Sukurk šabloną vieną kartą, išsiųsk nuorodą klientui, gauk pasirašytą dokumentą. Elektroninės sutartys Lietuvos verslininkams.",
};

const steps = [
  {
    n: "01",
    title: "Įkelkite sutarties šabloną",
    body: "Įkelkite savo Word (.docx) failą arba sukurkite šabloną tiesiogiai redaktoriuje. Pažymėkite laukus kuriuos užpildys klientas.",
  },
  {
    n: "02",
    title: "Išsiųskite nuorodą klientui",
    body: "Sugeneruokite unikalią nuorodą su savo duomenimis iš anksto užpildytais. Klientui paskyra nereikalinga.",
  },
  {
    n: "03",
    title: "Gaukite pasirašytą dokumentą",
    body: "Klientas užpildo duomenis ir pasirašo ekrane. Jums patvirtinus — sutartis PDF arba DOCX formate iš karto.",
  },
];

const plans = [
  {
    name: "Nemokamas",
    price: "0€",
    period: "/ mėn.",
    description: "Tobulas pradžiai.",
    features: [
      "Iki 3 šablonų",
      "Iki 10 sutarčių / mėn.",
      "PDF ir DOCX eksportas",
      "El. pašto pranešimai",
    ],
    cta: "Pradėti nemokamai",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "19€",
    period: "/ mėn.",
    description: "Neribotam verslui.",
    features: [
      "Neriboti šablonai",
      "Neriboti sutartys",
      "Įmonės logotipas dokumentuose",
      "Prioritetinis palaikymas",
    ],
    cta: "Pradėti Pro",
    href: "/register",
    highlight: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/logo.png" alt="Melno" className="h-8 w-auto" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5">
              Prisijungti
            </Link>
            <Link href="/register" className="text-sm bg-white text-zinc-950 px-4 py-1.5 rounded-md font-medium hover:bg-zinc-200 transition-colors">
              Pradėti nemokamai
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-28 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Šiuo metu nemokama visiems
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6 max-w-4xl mx-auto">
          Sutartys.<br />
          <span className="text-zinc-500">Greičiau nei kada nors.</span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Įkelk savo Word šabloną, išsiųsk nuorodą klientui ir gauk pasirašytą dokumentą — visa tai per kelias minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="bg-white text-zinc-950 px-7 py-3 rounded-md text-sm font-semibold hover:bg-zinc-200 transition-colors w-full sm:w-auto text-center"
          >
            Pradėti nemokamai →
          </Link>
          <Link
            href="/login"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Jau turite paskyrą? Prisijungti
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-zinc-800" />
      </div>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-3">Kaip tai veikia</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Trys žingsniai iki pasirašytos sutarties</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(100%+1px)] w-full h-px bg-zinc-800 z-0" style={{ width: "calc(100% - 48px)", left: "calc(100% + 24px)" }} />
              )}
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-5">
                  <span className="text-xs font-semibold text-zinc-400">{step.n}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-zinc-800" />
      </div>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-3">Kainos</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Paprasta kainodara</h2>
          <p className="text-sm text-zinc-500">Be paslėptų mokesčių. Atšaukite bet kada.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.highlight
                  ? "bg-white text-zinc-950"
                  : "bg-zinc-900 border border-zinc-800 text-white"
              }`}
            >
              <div className="mb-6">
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${plan.highlight ? "text-zinc-500" : "text-zinc-500"}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-zinc-500" : "text-zinc-500"}`}>{plan.period}</span>
                </div>
                <p className={`text-sm ${plan.highlight ? "text-zinc-600" : "text-zinc-500"}`}>{plan.description}</p>
              </div>

              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <svg className={`w-4 h-4 shrink-0 ${plan.highlight ? "text-zinc-950" : "text-emerald-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlight ? "text-zinc-700" : "text-zinc-300"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`text-sm font-semibold py-3 rounded-md text-center transition-colors ${
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
      </section>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-zinc-800" />
      </div>
      <footer className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <img src="/logo.png" alt="Melno" className="h-6 w-auto" />
        <p className="text-xs text-zinc-600">© 2026 Melno. Visos teisės saugomos.</p>
        <div className="flex gap-4">
          <Link href="/login" className="text-xs text-zinc-600 hover:text-white transition-colors">Prisijungti</Link>
          <Link href="/register" className="text-xs text-zinc-600 hover:text-white transition-colors">Registruotis</Link>
        </div>
      </footer>

    </div>
  );
}
