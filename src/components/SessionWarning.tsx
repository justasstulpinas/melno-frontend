"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export default function SessionWarning() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function setup() {
      const token = localStorage.getItem("token");
      if (!token) return;

      const exp = getTokenExpiry(token);
      if (!exp) return;

      const now = Math.floor(Date.now() / 1000);
      const msUntilWarning = (exp - now - 30) * 1000;

      if (msUntilWarning <= 0) {
        // already in warning zone
        startCountdown(exp);
        return;
      }

      warningRef.current = setTimeout(() => startCountdown(exp), msUntilWarning);
    }

    function startCountdown(exp: number) {
      intervalRef.current = setInterval(() => {
        const remaining = exp - Math.floor(Date.now() / 1000);
        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          handleLogout();
        } else {
          setSecondsLeft(remaining);
        }
      }, 1000);
    }

    setup();
    return () => {
      if (warningRef.current) clearTimeout(warningRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  function handleExtend() {
    clearToken();
    setSecondsLeft(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    router.push("/login?reason=session");
  }

  if (secondsLeft === null || secondsLeft > 30) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">

        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-yellow-950 border border-yellow-900/60 flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h2 className="text-base font-semibold text-white mb-1">Sesija baigiasi</h2>
        <p className="text-sm text-zinc-400 mb-5">
          Jūsų sesija baigsis po{" "}
          <span className="text-white font-semibold tabular-nums">{secondsLeft}s</span>.
          Prisijunkite iš naujo kad tęstumėte darbą.
        </p>

        {/* Countdown bar */}
        <div className="w-full bg-zinc-800 rounded-full h-1 mb-5 overflow-hidden">
          <div
            className="h-1 bg-yellow-500 rounded-full transition-all duration-1000"
            style={{ width: `${(secondsLeft / 30) * 100}%` }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleLogout}
            className="flex-1 text-sm text-zinc-400 border border-zinc-700 px-4 py-2 rounded-md hover:border-zinc-500 hover:text-white transition-colors"
          >
            Atsijungti
          </button>
          <button
            onClick={handleExtend}
            className="flex-1 text-sm bg-white text-zinc-950 px-4 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors"
          >
            Prisijungti iš naujo
          </button>
        </div>
      </div>
    </div>
  );
}
