import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getMySalons } from "@/lib/data/pro";
import { getSalonStaff, getOpeningHours, getClosures } from "@/lib/data/salons";
import {
  addStaffMember,
  removeStaffMember,
  setOpeningHours,
  addClosure,
  removeClosure,
} from "@/lib/actions/schedule";
import { SalonSwitcher } from "@/components/SalonSwitcher";

interface EquipePageProps {
  searchParams: { salon?: string };
}

const WEEKDAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export default async function EquipePage({ searchParams }: EquipePageProps) {
  const account = await requireAccount();
  const salons = await getMySalons(account.id);
  const approved = salons.filter((s) => s.status === "approved");

  if (approved.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/10 p-6 text-ink/50">
        Aucune fiche publiée pour l&apos;instant.
      </p>
    );
  }

  const salonId = searchParams.salon ?? approved[0].id;
  const salon = approved.find((s) => s.id === salonId);
  if (!salon) redirect(`/pro/tableau-de-bord/equipe?salon=${approved[0].id}`);

  const [staff, hours, closures] = await Promise.all([
    getSalonStaff(salon!.id),
    getOpeningHours(salon!.id),
    getClosures(salon!.id),
  ]);
  const hoursByWeekday = new Map(hours.map((h) => [h.weekday, h]));

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Équipe &amp; horaires — {salon!.name}</h1>
        {approved.length > 1 && <SalonSwitcher salons={approved} currentId={salon!.id} />}
      </div>

      <section>
        <h2 className="text-lg font-medium">Équipe</h2>
        <ul className="mt-3 divide-y divide-black/5 rounded-xl border border-black/10 bg-white">
          {staff.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-4 py-3 text-sm">
              {member.name}
              <form action={removeStaffMember}>
                <input type="hidden" name="salonId" value={salon!.id} />
                <input type="hidden" name="staffId" value={member.id} />
                <button className="text-ink/50 hover:underline">Retirer</button>
              </form>
            </li>
          ))}
          {staff.length === 0 && <li className="px-4 py-3 text-sm text-ink/50">Aucun membre d&apos;équipe.</li>}
        </ul>
        <form action={addStaffMember} className="mt-3 flex gap-2">
          <input type="hidden" name="salonId" value={salon!.id} />
          <input
            type="text"
            name="name"
            placeholder="Nom du membre"
            required
            className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            Ajouter
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">Horaires d&apos;ouverture</h2>
        <div className="mt-3 space-y-2">
          {WEEKDAYS.map((label, weekday) => {
            const existing = hoursByWeekday.get(weekday);
            return (
              <form
                key={weekday}
                action={setOpeningHours}
                className="flex items-center gap-3 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm"
              >
                <input type="hidden" name="salonId" value={salon!.id} />
                <input type="hidden" name="weekday" value={weekday} />
                <span className="w-24 shrink-0">{label}</span>
                <input
                  type="time"
                  name="opensAt"
                  defaultValue={existing?.opens_at?.slice(0, 5) ?? ""}
                  className="rounded-lg border border-black/10 px-2 py-1"
                />
                <span>—</span>
                <input
                  type="time"
                  name="closesAt"
                  defaultValue={existing?.closes_at?.slice(0, 5) ?? ""}
                  className="rounded-lg border border-black/10 px-2 py-1"
                />
                <label className="ml-2 flex items-center gap-1 text-ink/50">
                  <input type="checkbox" name="closed" defaultChecked={!existing} />
                  Fermé
                </label>
                <button className="ml-auto rounded-lg border border-black/10 px-3 py-1 hover:bg-black/5">
                  Enregistrer
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Fermetures exceptionnelles</h2>
        <ul className="mt-3 divide-y divide-black/5 rounded-xl border border-black/10 bg-white">
          {closures.map((closure) => (
            <li key={closure.id} className="flex items-center justify-between px-4 py-3 text-sm">
              {new Date(`${closure.closed_date}T00:00:00`).toLocaleDateString("fr-FR")}
              <form action={removeClosure}>
                <input type="hidden" name="salonId" value={salon!.id} />
                <input type="hidden" name="closureId" value={closure.id} />
                <button className="text-ink/50 hover:underline">Retirer</button>
              </form>
            </li>
          ))}
          {closures.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink/50">Aucune fermeture exceptionnelle.</li>
          )}
        </ul>
        <form action={addClosure} className="mt-3 flex gap-2">
          <input type="hidden" name="salonId" value={salon!.id} />
          <input
            type="date"
            name="closedDate"
            required
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            Ajouter une fermeture
          </button>
        </form>
      </section>
    </div>
  );
}
