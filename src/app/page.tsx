import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Melno. Sutartys be galvos skausmo",
  description: "Sukurk šabloną, išsiųsk nuorodą, gauk parašą per minutę. Elektroninės sutartys Lietuvos verslininkams.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm">
        <span className="text-base font-semibold tracking-tight">Melno</span>
        <div className="flex items-center gap-4">
          <Link href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-[color] duration-150">
            Prisijungti
          </Link>
          <Link href="/register"
            className="text-sm bg-white text-zinc-950 px-4 py-1.5 rounded-md font-medium hover:bg-zinc-200 transition-[background-color] duration-150 active:scale-[0.96] transition-transform">
            Pradėti nemokamai
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
        <div className="hero-item inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-xs text-zinc-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Sukurta laisvai samdomiems Lietuvoje
        </div>
        <h1 className="hero-item text-5xl sm:text-6xl font-bold leading-tight max-w-3xl mb-6 tracking-tight text-balance">
          Sutartis: 3 minutės.<br />
          <span className="text-zinc-400">Ne 3 dienos.</span>
        </h1>
        <p className="hero-item text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed text-pretty">
          Sukurk šabloną vieną kartą, išsiųsk nuorodą klientui, gauk parašą. Klientui paskyra nereikalinga. Jokių PDF priedų. Jokio laukimo.
        </p>
        <div className="hero-item flex flex-col sm:flex-row items-center gap-4">
          <Link href="/register"
            className="bg-white text-zinc-950 px-6 py-3 rounded-md text-sm font-semibold hover:bg-zinc-200 transition-[background-color] duration-150 active:scale-[0.96] transition-transform w-full sm:w-auto text-center">
            Pradėti nemokamai →
          </Link>
          <Link href="/login"
            className="text-sm text-zinc-500 hover:text-white transition-[color] duration-150">
            Jau turite paskyrą? Prisijungti
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-zinc-800 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest text-center mb-3">Kaip tai veikia</p>
          <h2 className="text-2xl font-bold text-center mb-14 text-balance">
            Trys žingsniai iki pasirašytos sutarties, greičiau nei surašyti el. laišką
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                n: "1",
                title: "Sukurkite šabloną vieną kartą",
                body: "Parašykite sutartį su laukų žymekliais kaip {{kliento_vardas}}. Užtrunka 3 minutes. Po to naudokite neribotai.",
              },
              {
                n: "2",
                title: "Išsiųskite nuorodą per 30 sekundžių",
                body: "Sugeneruokite unikalią nuorodą su iš anksto užpildytais jūsų duomenimis. Išsiųskite klientui per el. paštą ar žinutes. Jokių priedų, jokių PDF failų.",
              },
              {
                n: "3",
                title: "Gaukite parašą. Klientas nesukuria paskyros",
                body: "Klientas užpildo savo duomenis, pasirašo ranka ekrane ir pateikia. Jūs iš karto gaunate pranešimą ir PDF.",
              },
            ].map((step) => (
              <div key={step.n} className="flex flex-col">
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-300 mb-5">
                  {step.n}
                </div>
                <h3 className="text-base font-semibold text-white mb-2 text-balance">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed text-pretty">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-zinc-800 px-6 py-20 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest text-center mb-3">Funkcijos</p>
          <h2 className="text-2xl font-bold text-center mb-14 text-balance">Viskas ko reikia, nieko ko nereikia</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
                title: "Redaktorius",
                body: "Turtingo teksto redaktorius su A4 peržiūra. Sutartis atrodo profesionaliai nuo pirmos minutės.",
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                  </svg>
                ),
                title: "Dinaminiai laukai",
                body: "Įterpkite žymeklius kaip {{kliento_vardas}} ir užpildomi automatiškai. Jokio copy-paste tarp sutarčių.",
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
                title: "Bendrinamos nuorodos",
                body: "Kiekvienam klientui unikali nuoroda su galiojimo laiku. Klientui paskyra nereikalinga. Sutartis pasiekiama iš karto.",
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                ),
                title: "Rankų parašas",
                body: "Klientas pasirašo ranka tiesiai naršyklėje. Parašas įterpiamas į PDF. Teisiškai galioja kaip paprastas elektroninis parašas.",
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                ),
                title: "PDF ir DOCX eksportas",
                body: "Kiekviena pasirašyta sutartis vienu paspaudimu kaip PDF arba Word. VMI audito atveju esi padengtas.",
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ),
                title: "Sutarčių sekimas",
                body: "Matyk visų sutarčių būsenas realiuoju laiku: laukiama, pasirašyta, patvirtinta. Viskas vienoje vietoje.",
              },
            ].map((f) => (
              <div key={f.title}
                className="bg-zinc-900 rounded-xl p-5"
                style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 1px 3px rgba(0,0,0,0.3)" }}>
                <div className="w-8 h-8 bg-zinc-800 rounded-md flex items-center justify-center mb-4 text-zinc-300"
                  style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 text-balance">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed text-pretty">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing coming soon ── */}
      <section className="border-t border-zinc-800 px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Kainos</p>
          <h2 className="text-2xl font-bold mb-4 text-balance">Paprasta kainodara</h2>
          <p className="text-sm text-zinc-500 mb-8 text-pretty">Mokamos planai greitai. Kol kas — viskas nemokama.</p>
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-400"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Šiuo metu nemokama visiems
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-zinc-800 px-6 py-20 bg-zinc-900/30">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-balance">Pirmą sutartį sukursi dar šiandien.</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed text-pretty">
            Prisijunk prie verslininkų, kurie nebepraranda laiko sutartims.
          </p>
          <Link href="/register"
            className="inline-block bg-white text-zinc-950 px-8 py-3 rounded-md text-sm font-semibold hover:bg-zinc-200 transition-[background-color] duration-150 active:scale-[0.96] transition-transform">
            Pradėti nemokamai
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white">Melno © 2025</span>
        <p className="text-xs text-zinc-600">Privatumo politika · Sąlygos</p>
      </footer>

    </div>
  );
}
