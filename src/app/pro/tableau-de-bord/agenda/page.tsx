import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getMySalons, getUpcomingBookings, getUpcomingUnavailability } from "@/lib/data/pro";
import { getSalonStaff } from "@/lib/data/salons";
import { addUnavailability, removeUnavailability } from "@/lib/actions/unavailability";
import { SalonSwitcher } from "@/components/SalonSwitcher";

interface AgendaPageProps {
  searchParams: { salon?: string };
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

  const [bookings, staff, unavailability] = await Promise.all([
    getUpcomingBookings(salon!.id),
    getSalonStaff(salon!.id),
    getUpcomingUnavailability(salon!.id),
  ]);
  const byDate = bookings.reduce<Record<string, typeof bookings>>((acc, b) => {
    (acc[b.booking_date] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda — {salon!.name}</h1>
        {approved.length > 1 && (
          <SalonSwitcher salons={approved} currentId={salon!.id} />
        )}
      </div>

      <div className="mt-6 space-y-6">
        {Object.entries(byDate).map(([date, dayBookings]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-ink/50">
              {new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
              {dayBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>
                    {b.booking_time.slice(0, 5)} — {b.client_name}
                  </span>
                  <span className="text-ink/50">{b.duration_min} min · {b.price} €</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {bookings.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-6 text-ink/50">
            Aucun rendez-vous à venir.
          </p>
        )}
      </div>

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
