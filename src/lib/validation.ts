export function validateEmail(value: string): string | null {
  if (!value.trim()) return "El. paštas yra privalomas";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Neteisingas el. pašto formatas";
  return null;
}

export function validateRequired(label: string) {
  return (value: string): string | null => {
    if (!value.trim()) return `${label} yra privalomas(-a)`;
    return null;
  };
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return null; // optional
  if (!/^\+?[\d\s\-()]{7,}$/.test(value)) return "Neteisingas telefono formatas";
  return null;
}
