export const WEEKDAY_HOURS = Array.from({ length: 9 }, (_, index) => 8 + index);
export const WEEKEND_HOURS = Array.from({ length: 8 }, (_, index) => 8 + index);

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: string): Date | null {
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isWeekendKey(key: string): boolean {
  const date = parseDateKey(key);
  if (!date) return false;
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function slotsForDateKey(key: string): string[] {
  const hours = isWeekendKey(key) ? WEEKEND_HOURS : WEEKDAY_HOURS;
  return hours.map((hour) => `${pad(hour)}:00`);
}

export function slotHour(slot: string): number {
  return Number(slot.slice(0, 2));
}

export function endHourForDateKey(key: string): number {
  const hours = isWeekendKey(key) ? WEEKEND_HOURS : WEEKDAY_HOURS;
  return hours[hours.length - 1];
}
