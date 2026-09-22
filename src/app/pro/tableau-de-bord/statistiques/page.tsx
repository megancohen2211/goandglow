import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getMySalons, getSalonStats } from "@/lib/data/pro";
import { SalonSwitcher } from "@/components/SalonSwitcher";

interface StatsPageProps {
  searchParams: { salon?: string };
}

export default async function StatistiquesPage({ searchParams }: StatsPageProps) {
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
  if (!salon) redirect(`/pro/tableau-de-bord/statistiques?salon=${approved[0].id}`);

  const stats = await getSalonStats(salon!.id, 30);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Statistiques — {salon!.name}</h1>
        {approved.length > 1 && <SalonSwitcher salons={approved} currentId={salon!.id} />}
      </div>
      <p className="mt-1 text-sm text-ink/50">30 derniers jours</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs text-ink/50">CA encaissé (caisse)</p>
          <p className="mt-1 text-2xl font-semibold">{stats.revenueCashed} €</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs text-ink/50">CA réservé (prévisionnel)</p>
          <p className="mt-1 text-2xl font-semibold">{stats.revenueBooked} €</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs text-ink/50">Taux de remplissage</p>
          <p className="mt-1 text-2xl font-semibold">
            {stats.fillRate !== null ? `${Math.round(stats.fillRate * 100)}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs text-ink/50">Taux d&apos;absence</p>
          <p className="mt-1 text-2xl font-semibold">
            {Math.round(stats.noShowRate * 100)}% <span className="text-sm text-ink/40">({stats.noShowCount})</span>
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm text-ink/50">{stats.bookingsCount} rendez-vous honorés sur la période.</p>
      {stats.fillRate === null && (
        <p className="mt-1 text-xs text-ink/40">
          Renseignez vos horaires d&apos;ouverture (page Équipe &amp; horaires) pour calculer le
          taux de remplissage.
        </p>
      )}
    </div>
  );
}
