import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getMySalons, getClients, getClientBookings, getClientNotes } from "@/lib/data/pro";
import { addClientNote } from "@/lib/actions/clients";
import { SalonSwitcher } from "@/components/SalonSwitcher";

interface ClientsPageProps {
  searchParams: { salon?: string; client?: string };
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
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
  if (!salon) redirect(`/pro/tableau-de-bord/clients?salon=${approved[0].id}`);

  const clients = await getClients(salon!.id);
  const activeClient = searchParams.client
    ? clients.find((c) => c.phone === searchParams.client)
    : undefined;

  const [bookings, notes] = activeClient
    ? await Promise.all([
        getClientBookings(salon!.id, activeClient.phone),
        getClientNotes(salon!.id, activeClient.phone),
      ])
    : [[], []];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients — {salon!.name}</h1>
        {approved.length > 1 && <SalonSwitcher salons={approved} currentId={salon!.id} />}
      </div>

      <div className="mt-6 grid grid-cols-[280px_1fr] gap-4">
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {clients.map((client) => (
            <li key={client.phone}>
              <Link
                href={`/pro/tableau-de-bord/clients?salon=${salon!.id}&client=${encodeURIComponent(client.phone)}`}
                className={`block px-3 py-2 text-sm hover:bg-black/5 ${
                  client.phone === activeClient?.phone ? "bg-brand-light font-medium text-brand-dark" : ""
                }`}
              >
                <span className="font-medium">{client.name}</span>
                <br />
                <span className="text-xs text-ink/50">
                  {client.visits} visite(s) · {client.totalSpent.toFixed(2)} €
                </span>
              </Link>
            </li>
          ))}
          {clients.length === 0 && <li className="px-3 py-2 text-sm text-ink/50">Aucun client pour l&apos;instant.</li>}
        </ul>

        <div className="rounded-2xl border border-line bg-surface p-4">
          {activeClient ? (
            <>
              <h2 className="font-medium">{activeClient.name}</h2>
              <p className="text-sm text-ink/50">{activeClient.phone}</p>

              <h3 className="mt-4 text-sm font-semibold text-ink/70">Historique</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {bookings.map((b) => (
                  <li key={b.id} className="flex justify-between">
                    <span>
                      {new Date(`${b.booking_date}T00:00:00`).toLocaleDateString("fr-FR")} — {b.booking_time.slice(0, 5)}
                    </span>
                    <span className="text-ink/50">{b.price} € · {b.status}</span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-4 text-sm font-semibold text-ink/70">Notes</h3>
              <ul className="mt-2 space-y-2">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-black/5 px-3 py-2 text-sm">
                    {n.note}
                  </li>
                ))}
                {notes.length === 0 && <li className="text-sm text-ink/50">Aucune note.</li>}
              </ul>

              <form action={addClientNote} className="mt-3 flex gap-2">
                <input type="hidden" name="salonId" value={salon!.id} />
                <input type="hidden" name="clientPhone" value={activeClient.phone} />
                <input type="hidden" name="clientName" value={activeClient.name} />
                <input
                  type="text"
                  name="note"
                  placeholder="Ajouter une note..."
                  className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                />
                <button className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
                  Ajouter
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-ink/50">Sélectionnez un client pour voir sa fiche.</p>
          )}
        </div>
      </div>
    </div>
  );
}
