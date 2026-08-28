"use client";

import { useState, useEffect } from "react";

const WORDS = [
  "nuomos",
  "panaudos",
  "fotografavimo",
  "filmavimo",
  "dekoravimo",
  "valymo",
  "pervežimo",
  "apskaitos",
  "darbo",
  "remonto",
  "statybos",
  "perleidimo",
  "paslaugų",
];

interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export function HeroCycler({ className, style }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes wordIn {
          from { transform: translateY(110%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <h1 className={className} style={style}>
        {/* Clipped container — new word slides up from below, old one is clipped away */}
        <span
          style={{
            display: "block",
            overflow: "hidden",
            height: "1.05em",
            lineHeight: 1.05,
          }}
        >
          <span
            key={index}
            style={{
              display: "block",
              whiteSpace: "nowrap",
              animation: "wordIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {WORDS[index]}
          </span>
        </span>
        <span style={{ display: "block" }}>sutartis</span>
        <span style={{ display: "block" }}>vienu</span>
        <span style={{ display: "block" }}>žingsniu.</span>
      </h1>
    </>
  );
}
