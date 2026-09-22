import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getMySalons, getWaitlist } from "@/lib/data/pro";
import { markWaitlistNotified, removeFromWaitlist } from "@/lib/actions/waitlist";
import { SalonSwitcher } from "@/components/SalonSwitcher";

interface WaitlistPageProps {
  searchParams: { salon?: string };
}

export default async function WaitlistPage({ searchParams }: WaitlistPageProps) {
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
  if (!salon) redirect(`/pro/tableau-de-bord/liste-attente?salon=${approved[0].id}`);

  const entries = await getWaitlist(salon!.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Liste d&apos;attente — {salon!.name}</h1>
        {approved.length > 1 && <SalonSwitcher salons={approved} currentId={salon!.id} />}
      </div>

      <ul className="mt-6 divide-y divide-black/5 rounded-xl border border-black/10 bg-white">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">
                {entry.client_name} · {entry.client_phone}
              </p>
              <p className="text-ink/50">
                {entry.wanted_date ? new Date(`${entry.wanted_date}T00:00:00`).toLocaleDateString("fr-FR") : "Date libre"}
                {entry.period ? ` · ${entry.period}` : ""}
                {entry.notified ? " · déjà prévenu" : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {!entry.notified && (
                <form action={markWaitlistNotified}>
                  <input type="hidden" name="id" value={entry.id} />
                  <input type="hidden" name="salonId" value={salon!.id} />
                  <button className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark">
                    Marquer prévenu
                  </button>
                </form>
              )}
              <form action={removeFromWaitlist}>
                <input type="hidden" name="id" value={entry.id} />
                <input type="hidden" name="salonId" value={salon!.id} />
                <button className="rounded-lg border border-black/10 px-3 py-1.5 text-xs hover:bg-black/5">
                  Retirer
                </button>
              </form>
            </div>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="px-4 py-3 text-sm text-ink/50">Aucune demande en liste d&apos;attente.</li>
        )}
      </ul>
    </div>
  );
}
