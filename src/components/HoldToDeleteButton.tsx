"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  onDelete: () => Promise<void>;
  label?: string;
}

type Phase = "idle" | "holding" | "undo" | "deleting";

const HOLD_MS = 300;
const UNDO_MS = 10_000;
const R = 10;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function HoldToDeleteButton({ onDelete, label = "Ištrinti" }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [holdPct, setHoldPct] = useState(0);
  const [undoMs, setUndoMs] = useState(UNDO_MS);
  const [error, setError] = useState<string | null>(null);

  const holdRaf = useRef<number | null>(null);
  const holdStart = useRef<number>(0);
  const undoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoRaf = useRef<number | null>(null);
  const undoStart = useRef<number>(0);

  const cancelHoldAnim = useCallback(() => {
    if (holdRaf.current) cancelAnimationFrame(holdRaf.current);
  }, []);

  const cancelUndoAnim = useCallback(() => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    if (undoRaf.current) cancelAnimationFrame(undoRaf.current);
  }, []);

  const startUndoCountdown = useCallback(() => {
    undoStart.current = performance.now();
    setUndoMs(UNDO_MS);

    const tick = (now: number) => {
      const remaining = Math.max(0, UNDO_MS - (now - undoStart.current));
      setUndoMs(remaining);
      if (remaining > 0) undoRaf.current = requestAnimationFrame(tick);
    };
    undoRaf.current = requestAnimationFrame(tick);

    undoTimeout.current = setTimeout(async () => {
      cancelAnimationFrame(undoRaf.current!);
      setPhase("deleting");
      try {
        await onDelete();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Nepavyko ištrinti");
        setPhase("idle");
      }
    }, UNDO_MS);
  }, [onDelete]);

  const startHold = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("holding");
    setHoldPct(0);
    setError(null);
    holdStart.current = performance.now();

    const tick = (now: number) => {
      const pct = Math.min(1, (now - holdStart.current) / HOLD_MS);
      setHoldPct(pct);
      if (pct < 1) {
        holdRaf.current = requestAnimationFrame(tick);
      } else {
        setPhase("undo");
        startUndoCountdown();
      }
    };
    holdRaf.current = requestAnimationFrame(tick);
  }, [phase, startUndoCountdown]);

  const cancelHold = useCallback(() => {
    if (phase !== "holding") return;
    cancelHoldAnim();
    setPhase("idle");
    setHoldPct(0);
  }, [phase, cancelHoldAnim]);

  const handleUndo = useCallback(() => {
    cancelUndoAnim();
    setPhase("idle");
    setUndoMs(UNDO_MS);
  }, [cancelUndoAnim]);

  useEffect(() => () => { cancelHoldAnim(); cancelUndoAnim(); }, [cancelHoldAnim, cancelUndoAnim]);

  if (phase === "undo") {
    const pct = undoMs / UNDO_MS;
    const secs = Math.ceil(undoMs / 1000);
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400/70">Ištrinamas…</span>
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-md transition-colors select-none"
        >
          <svg className="-rotate-90 shrink-0" width="14" height="14" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r={R} fill="none" stroke="#3f3f46" strokeWidth="3" />
            <circle
              cx="14" cy="14" r={R} fill="none" stroke="#f87171" strokeWidth="3"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - pct)}
              strokeLinecap="round"
            />
          </svg>
          Atšaukti · {secs}s
        </button>
      </div>
    );
  }

  if (phase === "deleting") {
    return <span className="text-xs text-zinc-500 italic">Trinama…</span>;
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={(e) => { e.preventDefault(); startHold(); }}
        onTouchEnd={cancelHold}
        className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 select-none transition-colors cursor-pointer"
        aria-label={label}
      >
        {phase === "holding" ? (
          <svg className="-rotate-90 shrink-0" width="14" height="14" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r={R} fill="none" stroke="#3f3f46" strokeWidth="3" />
            <circle
              cx="14" cy="14" r={R} fill="none" stroke="#f87171" strokeWidth="3"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - holdPct)}
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
