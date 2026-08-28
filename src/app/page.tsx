"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Syne } from "next/font/google";
import { HeroCycler } from "@/components/HeroCycler";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const PANEL_COUNT = 5;

const steps = [
  { n: "01", title: "Įkelkite šabloną", body: "Įkelkite savo Word (.docx) failą. Pažymėkite laukus kuriuos užpildys klientas." },
  { n: "02", title: "Išsiųskite nuorodą", body: "Sugeneruokite unikalią nuorodą su savo duomenimis. Klientui paskyra nereikalinga." },
  { n: "03", title: "Gaukite dokumentą", body: "Klientas pasirašo ekrane. Jums patvirtinus — sutartis PDF arba DOCX formatu." },
];

const plans = [
  {
    name: "Nemokamas", price: "0€", period: "/ mėn.", description: "Tobulas pradžiai.",
    features: ["Iki 3 šablonų", "Iki 10 sutarčių / mėn.", "PDF ir DOCX eksportas", "El. pašto pranešimai"],
    cta: "Pradėti nemokamai", href: "/register", highlight: false,
  },
  {
    name: "Pro", price: "19€", period: "/ mėn.", description: "Neribotam verslui.",
    features: ["Neriboti šablonai", "Neriboti sutartys", "Įmonės logotipas dokumentuose", "Prioritetinis palaikymas"],
    cta: "Pradėti Pro", href: "/register", highlight: true,
  },
];

export default function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const panels = container.querySelectorAll("[data-panel]");
    const observers: IntersectionObserver[] = [];
    panels.forEach((panel, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(i); },
        { root: container, threshold: 0.5 },
      );
      obs.observe(panel);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  return (
    <div className={syne.className} style={{ position: "relative" }}>

      {/* ── Panel indicator — vertical lines ── */}
      <div style={{
        position: "fixed",
        right: 28,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        zIndex: 100,
      }}>
        {Array.from({ length: PANEL_COUNT }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 2,
              height: i === active ? 32 : 18,
              borderRadius: 2,
              background: i === active ? "#F4F4F4" : "rgba(244,244,244,0.18)",
              boxShadow: i === active ? "0 0 12px rgba(244,244,244,0.6), 0 0 4px rgba(244,244,244,0.4)" : "none",
              transition: "height 300ms ease, background 300ms ease, box-shadow 300ms ease",
            }}
          />
        ))}
      </div>

      {/* ── Scroll container ── */}
      <div
        ref={scrollRef}
        className="snap-container"
        style={{
          height: "100vh",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          background: "#111111",
          color: "#F4F4F4",
          msOverflowStyle: "none" as const,
          scrollbarWidth: "none" as const,
        }}
      >

        {/* Panel 1: Hero */}
        <section
          data-panel
          style={{ height: "100vh", scrollSnapAlign: "start", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <nav className="relative z-10 flex items-center justify-between px-10 py-7 shrink-0">
            <div className="flex items-center gap-3">
              <img src="/logo-icon.png" alt="Melno" className="rounded-full object-cover" style={{ width: 52, height: 52 }} />
              <span style={{ fontWeight: 400, fontSize: 22, letterSpacing: "-0.03em", color: "#F4F4F4" }}>melno</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="nav-btn-text text-sm text-zinc-400">Prisijungti</Link>
              <Link href="/register" className="nav-btn-outline text-sm px-6 py-2 rounded-full border text-white">Registruotis</Link>
            </div>
          </nav>

          <div className="relative flex-1 flex items-center px-10 overflow-hidden">
            <div className="relative z-10 flex flex-col justify-center" style={{ maxWidth: 720 }}>
              <HeroCycler
                className="font-semibold leading-none mb-6"
                style={{ fontSize: "clamp(56px, 6.5vw, 100px)", letterSpacing: "-0.03em", color: "#F4F4F4" }}
              />
              <p className="leading-snug mb-10" style={{ fontSize: "clamp(15px, 1.4vw, 20px)", letterSpacing: "-0.02em", color: "#BCBCBC", maxWidth: 460 }}>
                Išsaugokite sutartį kaip šabloną, pasirinkite informacijos laukus ir per kelias sekundes turėsite naują sutartį, paruoštą siųsti. Klientui belieka paspausti nuorodą ir pasirašyti tiesiogiai naršyklėje.
              </p>
              <div className="flex items-center gap-4">
                <Link href="#apie" className="nav-btn-text text-sm" style={{ color: "#BCBCBC", letterSpacing: "-0.02em" }}>Apie projektą</Link>
                <Link href="/register" className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-medium" style={{ background: "#F4F4F4", color: "#111111", letterSpacing: "-0.02em" }}>
                  Pradėti nemokamai
                </Link>
              </div>
            </div>

            <div className="absolute rounded-full flex items-center justify-center" style={{ right: "-8%", top: "50%", transform: "translateY(-42%)", width: "90vh", height: "90vh", minWidth: 600, minHeight: 600, background: "#1A1A1A" }}>
              <img src="/logo-icon.png" alt="" aria-hidden style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            </div>
          </div>
        </section>

        {/* Panel 2: How it works */}
        <section
          data-panel
          id="apie"
          style={{ height: "100vh", scrollSnapAlign: "start", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 40px", borderTop: "1px solid #222222" }}
        >
          <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#444444", marginBottom: 16 }}>Kaip tai veikia</p>
          <h2 className="font-semibold" style={{ fontSize: "clamp(28px, 3vw, 42px)", letterSpacing: "-0.03em", maxWidth: 420, marginBottom: 64 }}>
            Trys žingsniai iki pasirašytos sutarties
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48, maxWidth: 900 }}>
            {steps.map((step) => (
              <div key={step.n}>
                <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#333333", marginBottom: 16 }}>{step.n}</p>
                <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: "clamp(15px, 1.4vw, 20px)", lineHeight: 1.6, letterSpacing: "-0.02em", color: "#BCBCBC" }}>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Panel 3: Features */}
        <section
          data-panel
          style={{ height: "100vh", scrollSnapAlign: "start", display: "flex", flexDirection: "column", background: "#111111", borderTop: "1px solid #222222", padding: "60px 40px 48px", boxSizing: "border-box" }}
        >
          {/* Top half */}
          <div style={{ flex: 1, display: "flex", gap: 48, alignItems: "center", borderBottom: "1px solid #2A2A2A", paddingBottom: 40 }}>
            <div style={{ flex: "0 0 420px" }}>
              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "clamp(39px, 3.67vw, 52px)", lineHeight: 1.1, letterSpacing: "-0.03em", color: "#F4F4F4", margin: 0, marginBottom: 28 }}>
                Šablonas per kelias minutes
              </h2>
              <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 400, fontSize: "clamp(15px, 1.4vw, 20px)", lineHeight: 1.5, letterSpacing: "-0.02em", color: "#BCBCBC", margin: 0 }}>
                Įkelkite esamas sutartis ir pažymėkite kintamus laukus, pvz.,{" "}
                <span style={{ color: "#888888", fontFamily: "monospace", fontSize: 16 }}>{"{{kliento įmonės kodas}}"}</span>{" "}
                arba{" "}
                <span style={{ color: "#888888", fontFamily: "monospace", fontSize: 16 }}>{"{{sutarties data}}"}</span>
                . Išsaugokite kaip šabloną vieną kartą ir naudokite jį su bet kuriuo klientu, be perrašinėjimo nuo nulio.
              </p>
            </div>
            <div style={{ flex: 1, height: "100%", borderRadius: 12, background: "#161616", border: "1px solid #2A2A2A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 12, color: "#333333", letterSpacing: "0.1em", textTransform: "uppercase" }}>Mockup</p>
            </div>
          </div>

          {/* Bottom half */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, paddingTop: 40 }}>
            <div style={{ paddingRight: 48, borderRight: "1px solid #2A2A2A" }}>
              <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "clamp(24px, 2.27vw, 32px)", lineHeight: 1.15, letterSpacing: "-0.03em", color: "#F4F4F4", marginBottom: 16 }}>
                Sutarties užpildymas ir pasirašymas vienoje vietoje
              </h3>
              <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 400, fontSize: "clamp(15px, 1.4vw, 20px)", lineHeight: 1.6, letterSpacing: "-0.02em", color: "#BCBCBC" }}>
                Klientas užpildo laukus ir pasirašo tiesiogiai naršyklėje autentikuotu parašu, pasirašytą sutartį gauna iškart. Jūs gausite pranešimą apie pasirašymą ir galėsite sutartį iškart parsisiųsti.
              </p>
            </div>
            <div style={{ paddingLeft: 48 }}>
              <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "clamp(24px, 2.27vw, 32px)", lineHeight: 1.15, letterSpacing: "-0.03em", color: "#F4F4F4", marginBottom: 16 }}>
                Privatumas ir saugumas pagal nutylėjimą
              </h3>
              <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 400, fontSize: "clamp(15px, 1.4vw, 20px)", lineHeight: 1.6, letterSpacing: "-0.02em", color: "#BCBCBC" }}>
                Visa kliento įvesta informacija yra užšifruota ir automatiškai ištrinama iš sistemos, kai abi šalys parsisiunčia pasirašytą sutartį.
              </p>
            </div>
          </div>
        </section>

        {/* Panel 4: Pricing */}
        <section
          data-panel
          style={{ height: "100vh", scrollSnapAlign: "start", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 40px", borderTop: "1px solid #222222" }}
        >
          <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#444444", marginBottom: 16 }}>Kainos</p>
          <h2 className="font-semibold" style={{ fontSize: "clamp(28px, 3vw, 42px)", letterSpacing: "-0.03em", marginBottom: 48 }}>Paprasta kainodara</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 640 }}>
            {plans.map((plan) => (
              <div key={plan.name} style={{ borderRadius: 16, padding: "28px 32px", display: "flex", flexDirection: "column", background: plan.highlight ? "#F4F4F4" : "transparent", border: plan.highlight ? "none" : "1px solid #222222", color: plan.highlight ? "#111111" : "#F4F4F4" }}>
                <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: plan.highlight ? "#888888" : "#444444", marginBottom: 16 }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em" }}>{plan.price}</span>
                  <span style={{ fontSize: 11, color: plan.highlight ? "#888888" : "#444444" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 11, color: plan.highlight ? "#888888" : "#444444", marginBottom: 24 }}>{plan.description}</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, flex: 1, listStyle: "none", padding: 0 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "#111111" : "#555555"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <span style={{ fontSize: "clamp(15px, 1.4vw, 20px)", letterSpacing: "-0.02em", color: plan.highlight ? "#555555" : "#BCBCBC" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{ display: "block", textAlign: "center", padding: "10px 0", borderRadius: 100, fontSize: 12, letterSpacing: "-0.02em", textDecoration: "none", background: plan.highlight ? "#111111" : "transparent", border: plan.highlight ? "none" : "1px solid #2A2A2A", color: plan.highlight ? "#F4F4F4" : "#666666" }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Panel 5: Footer */}
        <footer
          data-panel
          style={{ height: "100vh", scrollSnapAlign: "start", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderTop: "1px solid #222222", gap: 32 }}
        >
          <img src="/logo-icon.png" alt="" aria-hidden className="rounded-full object-cover" style={{ width: 64, height: 64, opacity: 0.6 }} />
          <span style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.03em", color: "#F4F4F4" }}>melno</span>
          <Link href="/register" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px 40px", borderRadius: 100, fontSize: 13, letterSpacing: "-0.02em", textDecoration: "none", background: "#F4F4F4", color: "#111111" }}>
            Pradėti nemokamai
          </Link>
          <p style={{ fontSize: 11, color: "#333333", marginTop: 48 }}>© 2026 Melno</p>
        </footer>

      </div>
    </div>
  );
}
