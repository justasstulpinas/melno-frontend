"use client";

import { forwardRef, useState } from "react";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errorMessage?: string;
  success?: boolean;
  rightElement?: React.ReactNode;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, errorMessage, success, rightElement, className, type = "text", onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = Boolean(props.value) || Boolean(props.defaultValue);
    const floated = focused || hasValue;

    const borderClass = errorMessage
      ? "border-red-800 focus:ring-red-800"
      : success
      ? "border-emerald-700 focus:ring-emerald-700"
      : "border-zinc-800 focus:ring-zinc-600";

    return (
      <div className="flex flex-col gap-1">
        <div className="relative">
          <input
            ref={ref}
            type={type}
            placeholder=" "
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            className={`peer w-full bg-zinc-900 border ${borderClass} rounded-full px-4 pt-5 pb-2 ${rightElement ? "pr-10" : ""} text-sm text-white placeholder-transparent focus:outline-none focus:ring-1 transition-colors ${className ?? ""}`}
            {...props}
          />
          <label
            className={`pointer-events-none absolute left-4 transition-all duration-150 select-none ${
              floated ? "top-1.5 text-[10px] text-zinc-500" : "top-3.5 text-sm text-zinc-500"
            }`}
          >
            {label}
          </label>
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {errorMessage && (
          <p className="text-xs text-red-400 px-4">{errorMessage}</p>
        )}
        {!errorMessage && success && (
          <p className="text-xs text-emerald-400 px-4">Atrodo gerai ✓</p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";
