"use client";

import { forwardRef, useState } from "react";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  rightElement?: React.ReactNode;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, rightElement, className, type = "text", onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = Boolean(props.value) || Boolean(props.defaultValue);
    const floated = focused || hasValue;

    const borderClass = error
      ? "border-red-800 focus:ring-red-800"
      : "border-zinc-800 focus:ring-zinc-600";

    return (
      <div className="relative">
        <input
          ref={ref}
          type={type}
          placeholder=" "
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          className={`peer w-full bg-zinc-900 border ${borderClass} rounded-full px-3 pt-5 pb-2 ${rightElement ? "pr-10" : ""} text-sm text-white placeholder-transparent focus:outline-none focus:ring-1 transition-colors ${className ?? ""}`}
          {...props}
        />
        <label
          className={`pointer-events-none absolute left-3 transition-all duration-150 select-none ${
            floated
              ? "top-1.5 text-[10px] text-zinc-500"
              : "top-3.5 text-sm text-zinc-500"
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
    );
  }
);

FloatingInput.displayName = "FloatingInput";
