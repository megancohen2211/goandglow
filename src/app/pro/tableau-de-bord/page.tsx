import Link from "next/link";
import { requireAccount } from "@/lib/auth";
import { getMySalons } from "@/lib/data/pro";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente de validation",
  invited: "Invitation envoyée",
  approved: "Publiée",
  rejected: "Refusée",
  suspended: "Suspendue",
};

export default async function DashboardOverviewPage() {
  const account = await requireAccount();
  const salons = await getMySalons(account.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bonjour</h1>
      <p className="mt-1 text-ink/60">{account.email}</p>

      <div className="mt-6 space-y-3">
        {salons.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-6 text-ink/50">
            Vous n&apos;avez pas encore de fiche salon.{" "}
            <Link href="/pro/inscription" className="underline">
              Créer une fiche
            </Link>
          </p>
        )}

        {salons.map((salon) => (
          <div
            key={salon.id}
            className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4"
          >
            <div>
              <p className="font-medium">{salon.name}</p>
              <p className="text-sm text-ink/50">
                {salon.city} · {STATUS_LABELS[salon.status] ?? salon.status}
              </p>
            </div>
            {salon.status === "approved" && (
              <Link
                href={`/pro/tableau-de-bord/agenda?salon=${salon.id}`}
                className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Voir l&apos;agenda
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
