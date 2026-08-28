/**
 * Melno design tokens — single source of truth for colors, typography, radius.
 *
 * Use `c` for colors, `type` for typography presets (CSSProperties objects),
 * `r` for border-radius, and `inputClass` for the standard input className.
 *
 * CSS custom properties (for Tailwind utilities) are defined in globals.css.
 */

import type { CSSProperties } from "react";

// ── Colors ────────────────────────────────────────────────────────────────────

export const c = {
  /** Page / screen background */
  bg: "#1e1e1e",
  /** Card, sidebar, panel background */
  surface: "#2a2a2a",
  /** Inputs, elevated surfaces inside cards */
  surfaceRaised: "#363636",
  /** Subtle dividers and borders */
  border: "#333333",

  /** Headings, primary labels */
  textPrimary: "#F4F4F4",
  /** Body text, descriptions */
  textSecondary: "#D9D9D9",
  /** Captions, secondary hints */
  textMuted: "#BCBCBC",
  /** Placeholders, disabled, footnotes */
  textDisabled: "#888888",

  /** Primary action button background (light pill) */
  action: "#D9D9D9",
  /** Primary action button text */
  actionText: "#1E1E1E",

  /** Danger / warning card background */
  danger: "#4D3636",
  /** Danger / warning text */
  dangerText: "#D7A1A1",
} as const;

// ── Typography presets ────────────────────────────────────────────────────────
// All use Syne. Import the font in the page/layout, then spread these into style={}.

const syne = "'Syne', Arial, sans-serif";

export const type = {
  /** 32 px · 700 · −0.03em — feature titles, large headings */
  display: {
    fontFamily: syne,
    fontSize: "32px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: "1.15",
    color: c.textPrimary,
  } satisfies CSSProperties,

  /** 19 px · 700 · −0.03em — card headings, email headlines */
  heading: {
    fontFamily: syne,
    fontSize: "19px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: "23px",
    color: c.textPrimary,
  } satisfies CSSProperties,

  /** 19 px · 400 · −0.03em — feature descriptions, large body */
  bodyLarge: {
    fontFamily: syne,
    fontSize: "19px",
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: "23px",
    color: c.textSecondary,
  } satisfies CSSProperties,

  /** 12 px · 400 · −0.02em — standard body, email text */
  body: {
    fontFamily: syne,
    fontSize: "12px",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    lineHeight: "14px",
    color: c.textSecondary,
  } satisfies CSSProperties,

  /** 10 px · 400 · +0.05em uppercase — section labels inside cards */
  label: {
    fontFamily: syne,
    fontSize: "10px",
    fontWeight: 400,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: c.textDisabled,
  } satisfies CSSProperties,
} as const;

// ── Border radius ─────────────────────────────────────────────────────────────

export const r = {
  /** Cards, panels, email boxes */
  card: "15px",
  /** Buttons, pills, input fields */
  pill: "9999px",
  /** Small elements — digit boxes, badges */
  sm: "5px",
} as const;

// ── Input ─────────────────────────────────────────────────────────────────────
// Standard Tailwind className for all plain <input> elements (non-FloatingInput).
// Matches FloatingInput's visual style: zinc-900 bg, zinc-800 border, rounded-full.

export const inputClass =
  "w-full bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 text-sm text-[#F4F4F4] " +
  "placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors";

export const inputDateClass = inputClass + " [color-scheme:dark]";
