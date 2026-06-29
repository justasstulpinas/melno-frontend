"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Syne } from "next/font/google";
import { api } from "@/lib/api";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600"] });

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid reset link.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      router.push("/login?reset=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-1/3 bg-zinc-900 px-10 py-12">
        <Link href="/" className="text-base font-semibold text-white tracking-tight">Melno</Link>
        <div>
          <p className={`${syne.className} text-4xl font-semibold text-white leading-snug mb-6`}>
            Sutartys.<br />Greitai.<br />Paprastai.
          </p>
          <p className={`${syne.className} text-sm text-zinc-500 leading-relaxed`}>
            Sukurk šabloną vieną kartą ir siųsk pasirašyti klientams per 30 sekundžių.
          </p>
        </div>
        <p className={`${syne.className} text-xs text-zinc-600`}>© 2026 Melno</p>
      </div>

      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="block text-center text-base font-semibold text-white mb-10 lg:hidden tracking-tight">Melno</Link>

          <h1 className="text-2xl font-semibold text-white mb-1">Set new password</h1>
          <p className={`${syne.className} text-sm text-zinc-400 mb-8`}>Choose a strong password for your account.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={`${syne.className} block text-xs font-medium text-zinc-400 mb-1.5`}>New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
              />
            </div>
            <div>
              <label className={`${syne.className} block text-xs font-medium text-zinc-400 mb-1.5`}>Confirm password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
              />
            </div>

            {error && (
              <p className={`${syne.className} text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-white text-zinc-950 rounded-md py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 active:scale-[0.98] mt-2"
            >
              {loading ? "Saving…" : "Reset password"}
            </button>
          </form>

          <p className={`${syne.className} text-center text-sm text-zinc-500 mt-8`}>
            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
