import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import {
  getMySalons,
  getUpcomingBookings,
  getUpcomingUnavailability,
  getWeekBookings,
  getWeekUnavailability,
} from "@/lib/data/pro";
import { getSalonStaff } from "@/lib/data/salons";
import { addUnavailability, removeUnavailability } from "@/lib/actions/unavailability";
import { SalonSwitcher } from "@/components/SalonSwitcher";
import { WeekCalendar } from "@/components/WeekCalendar";

interface AgendaPageProps {
  searchParams: { salon?: string; semaine?: string; membre?: string };
}

function mondayOf(dateIso: string) {
  const d = new Date(`${dateIso}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDaysIso(startIso: string, offset: number) {
  const d = new Date(`${startIso}T00:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const account = await requireAccount();
  const salons = await getMySalons(account.id);
  const approved = salons.filter((s) => s.status === "approved");

  if (approved.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-ink/50">
        Aucune fiche publiée pour l&apos;instant.
      </p>
    );
  }

  const salonId = searchParams.salon ?? approved[0].id;
  const salon = approved.find((s) => s.id === salonId);
  if (!salon) redirect(`/pro/tableau-de-bord/agenda?salon=${approved[0].id}`);

  const weekStart = mondayOf(searchParams.semaine ?? new Date().toISOString().slice(0, 10));
  const weekEnd = addDaysIso(weekStart, 6);
  const selectedStaffId = searchParams.membre ?? "";

  const [bookings, staff, unavailability, weekBookings, weekUnavailability] = await Promise.all([
    getUpcomingBookings(salon!.id),
    getSalonStaff(salon!.id),
    getUpcomingUnavailability(salon!.id),
    getWeekBookings(salon!.id, weekStart, weekEnd),
    getWeekUnavailability(salon!.id, weekStart, weekEnd),
  ]);
  const upcomingWithPhoto = bookings.filter((b) => b.inspiration_photo);

  const weekHref = (params: { semaine?: string; membre?: string }) => {
    const qs = new URLSearchParams();
    qs.set("salon", salon!.id);
    qs.set("semaine", params.semaine ?? weekStart);
    if (params.membre ?? selectedStaffId) qs.set("membre", params.membre ?? selectedStaffId);
    return `/pro/tableau-de-bord/agenda?${qs.toString()}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda — {salon!.name}</h1>
        {approved.length > 1 && (
          <SalonSwitcher salons={approved} currentId={salon!.id} />
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={weekHref({ semaine: addDaysIso(weekStart, -7) })}
            className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-line/40"
          >
            ← Semaine précédente
          </Link>
          <Link
            href={weekHref({ semaine: addDaysIso(weekStart, 7) })}
            className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-line/40"
          >
            Semaine suivante →
          </Link>
        </div>

        {staff.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <Link
              href={weekHref({ membre: "" })}
              className={`rounded-full px-3 py-1 text-sm ${
                !selectedStaffId ? "bg-brand text-white" : "border border-line hover:bg-line/40"
              }`}
            >
              Tous
            </Link>
            {staff.map((member) => (
              <Link
                key={member.id}
                href={weekHref({ membre: member.id })}
                className={`rounded-full px-3 py-1 text-sm ${
                  selectedStaffId === member.id
                    ? "bg-brand text-white"
                    : "border border-line hover:bg-line/40"
                }`}
              >
                {member.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <WeekCalendar
          weekStart={weekStart}
          staff={staff}
          selectedStaffId={selectedStaffId}
          bookings={weekBookings}
          unavailability={weekUnavailability}
        />
      </div>

      {upcomingWithPhoto.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {upcomingWithPhoto.map((b) => (
            <a key={b.id} href={b.inspiration_photo!} target="_blank" rel="noreferrer" title={b.client_name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.inspiration_photo!}
                alt={`Inspiration — ${b.client_name}`}
                className="h-12 w-12 rounded-lg object-cover"
              />
            </a>
          ))}
        </div>
      )}

      <section className="mt-10 border-t border-black/5 pt-8">
        <h2 className="text-lg font-medium">Indisponibilités</h2>
        <p className="mt-1 text-sm text-ink/60">
          Bloquez un créneau pour un membre d&apos;équipe (congé, formation, pause...), en plus
          des jours travaillés et des fermetures exceptionnelles.
        </p>

        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
          {unavailability.map((block) => (
            <li key={block.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {block.staff.name} — {new Date(`${block.unavailable_date}T00:00:00`).toLocaleDateString("fr-FR")}
                {" "}{block.start_time.slice(0, 5)}–{block.end_time.slice(0, 5)}
                {block.reason ? ` (${block.reason})` : ""}
              </span>
              <form action={removeUnavailability}>
                <input type="hidden" name="salonId" value={salon!.id} />
                <input type="hidden" name="id" value={block.id} />
                <button className="text-ink/50 hover:underline">Retirer</button>
              </form>
            </li>
          ))}
          {unavailability.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink/50">Aucune indisponibilité à venir.</li>
          )}
        </ul>

        {staff.length > 0 ? (
          <form action={addUnavailability} className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
            <input type="hidden" name="salonId" value={salon!.id} />
            <div>
              <label className="block text-xs font-medium">Membre</label>
              <select name="staffId" required className="mt-1 rounded-lg border border-line px-3 py-2 text-sm">
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium">Date</label>
              <input type="date" name="date" required className="mt-1 rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium">De</label>
              <input type="time" name="startTime" required className="mt-1 rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium">À</label>
              <input type="time" name="endTime" required className="mt-1 rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium">Motif (optionnel)</label>
              <input type="text" name="reason" className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <button className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              Bloquer
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-ink/50">
            Ajoutez d&apos;abord un membre d&apos;équipe depuis la page Équipe &amp; horaires.
          </p>
        )}
      </section>
    </div>
  );
}
