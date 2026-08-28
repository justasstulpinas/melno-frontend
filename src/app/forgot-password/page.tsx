"use client";

import Link from "next/link";
import { useState } from "react";
import { Syne } from "next/font/google";
import { api } from "@/lib/api";
import { FloatingInput } from "@/components/FloatingInput";
import { validateEmail } from "@/lib/validation";
import { MelnoLogo } from "@/components/MelnoLogo";
import { HeroCycler } from "@/components/HeroCycler";
import { c, type, r } from "@/lib/design";

const syne = Syne({ subsets: ["latin"], weight: ["400", "600"] });

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
    <div className={`${syne.className} min-h-screen flex`}>

      {/* ── Left: word cycler ── */}
      <div
        className="hidden lg:flex flex-col w-1/3 px-12 py-10"
        style={{ background: c.bg }}
      >
        <div className="mb-auto pb-8">
          <Link href="/"><MelnoLogo /></Link>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <HeroCycler
            className="font-semibold leading-none"
            style={{
              fontSize: "clamp(28px, 3vw, 48px)",
              letterSpacing: "-0.03em",
              color: c.textPrimary,
            }}
          />
        </div>

        <p style={{ ...type.label, marginTop: 24, letterSpacing: "normal", textTransform: "none" }}>
          © 2026 Melno
        </p>
      </div>

      {/* ── Right: form ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ background: c.surface }}
      >
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link href="/" className="block text-center mb-10 lg:hidden">
            <MelnoLogo />
          </Link>

          {!submitted ? (
            <>
              <h1 style={{ ...type.display, marginBottom: 4 }}>Pamiršote slaptažodį?</h1>
              <p style={{ ...type.bodyLarge, marginBottom: 32 }}>
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
                  <p style={{
                    ...type.body,
                    color: "#f87171",
                    background: "rgba(127,29,29,0.3)",
                    border: "1px solid rgba(153,27,27,0.5)",
                    borderRadius: r.pill,
                    padding: "8px 16px",
                  }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: c.action,
                    color: c.actionText,
                    borderRadius: r.pill,
                    border: "none",
                    padding: "10px 0",
                    width: "100%",
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "opacity 0.2s",
                  }}
                >
                  {loading && (
                    <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {loading ? "Siunčiama…" : "Siųsti nuorodą"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(5,46,22,0.4)", border: "1px solid rgba(20,83,45,0.5)" }}
              >
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 style={{ ...type.display, marginBottom: 8 }}>Patikrinkite el. paštą</h1>
              <p style={{ ...type.body, marginBottom: 0 }}>
                Jei paskyra su adresu{" "}
                <span style={{ color: c.textPrimary }}>{email}</span>{" "}
                egzistuoja, netrukus gausite nuorodą.
              </p>
            </div>
          )}

          <p style={{ ...type.body, textAlign: "center", marginTop: 32 }}>
            <Link href="/login" style={{ color: c.textMuted }}>
              ← Grįžti į prisijungimą
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
