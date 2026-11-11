export function isUpToDate(estado: string | null): boolean {
  const value = (estado ?? "").toLowerCase();
  return (
    value.includes("al d") ||
    value.includes("confirm") ||
    value.includes("pagad") ||
    value.includes("aprobad")
  );
}

export function statusTone(estado: string | null): "ok" | "warn" | "pending" {
  if (isUpToDate(estado)) return "ok";
  const value = (estado ?? "").toLowerCase();
  if (value.includes("pago")) return "warn";
  return "pending";
}

export function formatPrice(precio: string | null | undefined): string {
  const raw = (precio ?? "").trim();
  if (!raw) return "Consultar";
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return raw;
  return `Desde $${Number(digits).toLocaleString("es-CO")}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function normalizeDateKey(value: string | null | undefined): string {
  if (!value) return "";
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
  }
  return "";
}

export function parseAppointmentTime(
  value: string | null | undefined
): { hour: number; minute: number } | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase();
  const match = cleaned.match(/(\d{1,2})(?:[:.](\d{1,2}))?\s*([ap])?\s*\.?\s*m?\.?/i);
  if (!match) return null;

  let hour = Number(match[1]);
  let minute = match[2] ? Number(match[2]) : 0;
  const meridiem = (match[3] ?? "").toLowerCase();
  const isPm = meridiem === "p";
  const isAm = meridiem === "a";

  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;
  if (!isPm && !isAm && hour < 8) hour += 12;

  if (!Number.isFinite(hour) || hour < 0 || hour > 23) hour = 0;
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) minute = 0;

  return { hour, minute };
}

export function formatTimeLabel(value: string | null | undefined): string {
  const parsed = parseAppointmentTime(value);
  if (!parsed) return value ?? "";
  const suffix = parsed.hour < 12 ? "a. m." : "p. m.";
  const hour12 = parsed.hour % 12 || 12;
  return `${hour12}:${pad(parsed.minute)} ${suffix}`;
}
