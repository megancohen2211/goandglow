import Link from "next/link";
import { getCurrentAccount } from "@/lib/auth";
import { getMyLoyalty } from "@/lib/data/account";

export default async function FidelitePage() {
  const account = await getCurrentAccount();
  const loyalty = account?.phone ? await getMyLoyalty(account.phone) : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Fidélité</h1>

      {!account?.phone && (
        <p className="mt-4 rounded-xl border border-dashed border-black/10 p-6 text-ink/50">
          Renseignez votre téléphone dans{" "}
          <Link href="/compte/tableau-de-bord/profil" className="underline">
            votre profil
          </Link>{" "}
          pour voir vos points de fidélité.
        </p>
      )}

      {account?.phone && loyalty.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-black/10 p-6 text-ink/50">
          Pas encore de points de fidélité.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {loyalty.map((l) => (
          <div
            key={l.salon_id}
            className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4"
          >
            <p className="font-medium">{l.salon_name}</p>
            <p className="text-sm text-ink/60">{l.points} points</p>
          </div>
        ))}
      </div>
    </div>
  );
}
