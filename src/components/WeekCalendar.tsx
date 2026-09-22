import type { Booking, Staff, StaffUnavailability } from "@/lib/types";

const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const OPEN_MIN = 8 * 60;
const CLOSE_MIN = 20 * 60;
const HEIGHT = CLOSE_MIN - OPEN_MIN;

function toMinutes(time: string) {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function addDaysIso(startIso: string, offset: number) {
  const d = new Date(`${startIso}T00:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

interface WeekCalendarProps {
  weekStart: string;
  staff: Staff[];
  selectedStaffId: string;
  bookings: Booking[];
  unavailability: (StaffUnavailability & { staff: { name: string } })[];
}

export function WeekCalendar({
  weekStart,
  staff,
  selectedStaffId,
  bookings,
  unavailability,
}: WeekCalendarProps) {
  const selected = staff.find((s) => s.id === selectedStaffId) ?? null;
  const days = Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i));

  const bookingsFor = (dateIso: string) =>
    bookings.filter(
      (b) =>
        b.booking_date === dateIso &&
        (!selectedStaffId || b.staff_id === selectedStaffId)
    );
  const unavailabilityFor = (dateIso: string) =>
    unavailability.filter(
      (u) =>
        u.unavailable_date === dateIso &&
        (!selectedStaffId || u.staff_id === selectedStaffId)
    );

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <div className="grid min-w-[900px] grid-cols-[52px_repeat(7,minmax(120px,1fr))]">
        <div className="border-b border-line" />
        {days.map((dateIso, i) => (
          <div key={dateIso} className="border-b border-line px-2 py-2 text-center text-sm">
            <span className="block text-ink/50">{DAY_LABELS[i]}</span>
            <span className="font-heading font-bold">
              {new Date(`${dateIso}T00:00:00`).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        ))}

        <div className="relative" style={{ height: HEIGHT }}>
          {Array.from({ length: (CLOSE_MIN - OPEN_MIN) / 60 + 1 }, (_, h) => (
            <div
              key={h}
              className="absolute right-1 -translate-y-1/2 text-[10px] text-ink/40"
              style={{ top: h * 60 }}
            >
              {String(8 + h).padStart(2, "0")}h
            </div>
          ))}
        </div>

        {days.map((dateIso) => (
          <div
            key={dateIso}
            className="relative border-l border-line"
            style={{
              height: HEIGHT,
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 59px, var(--line) 59px, var(--line) 60px)",
            }}
          >
            {unavailabilityFor(dateIso).map((u) => {
              const top = Math.max(0, toMinutes(u.start_time) - OPEN_MIN);
              const height = Math.max(4, toMinutes(u.end_time) - toMinutes(u.start_time));
              return (
                <div
                  key={u.id}
                  className="absolute left-0.5 right-0.5 overflow-hidden rounded-md bg-line px-1.5 py-0.5 text-[10px] text-ink/50"
                  style={{ top, height }}
                >
                  {selectedStaffId ? "Indisponible" : `${u.staff.name} — indisponible`}
                  {u.reason ? ` (${u.reason})` : ""}
                </div>
              );
            })}

            {bookingsFor(dateIso).map((b) => {
              const top = Math.max(0, toMinutes(b.booking_time) - OPEN_MIN);
              const height = Math.max(16, b.duration_min);
              const isNoshow = b.status === "noshow";
              return (
                <div
                  key={b.id}
                  className={`absolute left-0.5 right-0.5 overflow-hidden rounded-md px-1.5 py-0.5 text-[11px] leading-tight ${
                    isNoshow ? "bg-danger/15 text-danger" : "bg-brand-light text-brand-dark"
                  }`}
                  style={{ top, height }}
                >
                  <strong className="block">{b.booking_time.slice(0, 5)}</strong>
                  {b.client_name}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {!selected && staff.length > 0 && (
        <p className="border-t border-line px-3 py-2 text-xs text-ink/40">
          Tous les membres d&apos;équipe sont affichés ensemble ; sélectionnez un membre
          ci-dessus pour un agenda plus lisible.
        </p>
      )}
    </div>
  );
}
