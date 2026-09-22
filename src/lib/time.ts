export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes);
}

/** 0 = dimanche ... 6 = samedi, comme la colonne `weekday` en base. */
export function weekdayOf(dateIso: string): number {
  return new Date(`${dateIso}T00:00:00`).getDay();
}

interface OffpeakSettings {
  offpeak_enabled: boolean;
  offpeak_percent: number;
  offpeak_days: number[];
  offpeak_start: string;
  offpeak_end: string;
}

/** Pourcentage de réduction "heures creuses" applicable à ce créneau, ou 0. */
export function offpeakDiscountPercent(salon: OffpeakSettings, date: string, time: string): number {
  if (!salon.offpeak_enabled) return 0;
  if (!salon.offpeak_days.includes(weekdayOf(date))) return 0;
  const m = timeToMinutes(time);
  const inWindow = m >= timeToMinutes(salon.offpeak_start) && m < timeToMinutes(salon.offpeak_end);
  return inWindow ? Number(salon.offpeak_percent) : 0;
}
