import { useEffect, useState } from "react";

export function useDraftForm<T extends Record<string, string>>(key: string, initial: T) {
  const [form, setFormRaw] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const saved = localStorage.getItem(key);
      return saved ? { ...initial, ...JSON.parse(saved) } : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    const isEmpty = Object.values(form).every((v) => !v.trim());
    if (isEmpty) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(form));
    }
  }, [form, key]);

  function setForm(next: T) {
    setFormRaw(next);
  }

  function clearDraft() {
    localStorage.removeItem(key);
    setFormRaw(initial);
  }

  return { form, setForm, clearDraft };
}
