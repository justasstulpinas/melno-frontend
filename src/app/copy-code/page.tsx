"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Syne } from "next/font/google";
import { MelnoLogo } from "@/components/MelnoLogo";

const syne = Syne({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function CopyCodePage() {
  const params = useSearchParams();
  const code = params.get("c") ?? "";
  const redirect = params.get("redirect") ?? "";

  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(
      () => setCopied(true),
      () => setFailed(true),
    );
  }, [code]);

  function handleManualCopy() {
    navigator.clipboard.writeText(code).then(
      () => setCopied(true),
      () => setFailed(true),
    );
  }

  return (
    <div
      className={syne.className}
      style={{
        minHeight: "100vh",
        background: "#111111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 24, left: 24 }}>
        <MelnoLogo />
      </div>
      <div
        style={{
          background: "#1e1e1e",
          borderRadius: 20,
          padding: "40px 36px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div style={{ marginBottom: 20 }}>
          {copied ? (
            <div style={{ fontSize: 40 }}>✓</div>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f4f4f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </div>

        <h1
          style={{
            fontWeight: 700,
            fontSize: 24,
            color: "#f4f4f4",
            letterSpacing: "-0.03em",
            marginBottom: 12,
          }}
        >
          {copied ? "Nukopijuota!" : "Jūsų kodas"}
        </h1>

        {/* Code display */}
        {code && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              margin: "20px 0",
            }}
          >
            {code.split("").map((d, i) => (
              <div
                key={i}
                style={{
                  width: 44,
                  height: 56,
                  lineHeight: "56px",
                  background: "#111111",
                  borderRadius: 10,
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#ffffff",
                  fontFamily: "monospace",
                  textAlign: "center",
                }}
              >
                {d}
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 13, color: "#888888", marginBottom: 28, lineHeight: 1.5 }}>
          {copied
            ? "Kodas nukopijuotas į iškarpinę. Galite grįžti ir jį įklijuoti."
            : failed
            ? "Automatiškai nukopijuoti nepavyko. Paspauskite mygtuką žemiau."
            : "Kopijuojama…"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!copied && (
            <button
              onClick={handleManualCopy}
              style={{
                background: "#f4f4f4",
                color: "#111111",
                border: "none",
                borderRadius: 100,
                padding: "13px 30px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "-0.02em",
              }}
            >
              Kopijuoti kodą
            </button>
          )}

          {redirect && (
            <Link
              href={redirect}
              style={{
                display: "inline-block",
                background: copied ? "#f4f4f4" : "transparent",
                color: copied ? "#111111" : "#888888",
                border: copied ? "none" : "1px solid #333333",
                borderRadius: 100,
                padding: "13px 30px",
                fontSize: 14,
                fontWeight: copied ? 600 : 400,
                textDecoration: "none",
                letterSpacing: "-0.02em",
              }}
            >
              {copied ? "Atidaryti sutartį →" : "Praleisti"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
