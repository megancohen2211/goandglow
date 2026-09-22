import { getCurrentAccount } from "@/lib/auth";
import { getMyBookings } from "@/lib/data/account";
import { cancelMyBooking } from "@/lib/actions/clientAccount";

const STATUS_LABELS: Record<string, string> = {
  ok: "Confirmée",
  noshow: "Absence",
  cancelled: "Annulée",
};

export default async function ClientDashboardPage() {
  const account = await getCurrentAccount();
  const bookings = account ? await getMyBookings(account.id) : [];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.booking_date >= today && b.status === "ok");
  const past = bookings.filter((b) => !(b.booking_date >= today && b.status === "ok"));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bonjour</h1>
      <p className="mt-1 text-ink/60">{account?.email}</p>

      <h2 className="mt-8 text-lg font-medium">À venir</h2>
      {upcoming.length === 0 && (
        <p className="mt-2 rounded-xl border border-dashed border-black/10 p-6 text-ink/50">
          Aucune réservation à venir.
        </p>
      )}
      <div className="mt-3 space-y-3">
        {upcoming.map((b) => (
          <div key={b.id} className="rounded-xl border border-black/10 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{b.salon?.name ?? "Salon"}</p>
                <p className="text-sm text-ink/60">
                  {b.service?.name} · {new Date(`${b.booking_date}T00:00:00`).toLocaleDateString("fr-FR")}{" "}
                  à {b.booking_time.slice(0, 5)}
                </p>
                <p className="text-sm text-ink/60">{b.price} €</p>
              </div>
              <form action={cancelMyBooking}>
                <input type="hidden" name="bookingId" value={b.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5"
                >
                  Annuler
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-medium">Historique</h2>
      {past.length === 0 && (
        <p className="mt-2 rounded-xl border border-dashed border-black/10 p-6 text-ink/50">
          Pas encore d&apos;historique.
        </p>
      )}
      <div className="mt-3 space-y-3">
        {past.map((b) => (
          <div key={b.id} className="rounded-xl border border-black/5 bg-white/60 p-4">
            <p className="font-medium">{b.salon?.name ?? "Salon"}</p>
            <p className="text-sm text-ink/60">
              {b.service?.name} · {new Date(`${b.booking_date}T00:00:00`).toLocaleDateString("fr-FR")} ·{" "}
              {STATUS_LABELS[b.status] ?? b.status}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-ink/40">
        Seules les réservations faites en étant connecté (ou après avoir renseigné
        votre téléphone dans votre profil) apparaissent ici.
      </p>
    </div>
  );
}
