import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getMySalons, getGiftcards } from "@/lib/data/pro";
import { issueGiftcard } from "@/lib/actions/giftcards";
import { SalonSwitcher } from "@/components/SalonSwitcher";

interface GiftcardsPageProps {
  searchParams: { salon?: string };
}

export default async function ProGiftcardsPage({ searchParams }: GiftcardsPageProps) {
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
  if (!salon) redirect(`/pro/tableau-de-bord/cartes-cadeaux?salon=${approved[0].id}`);

  const giftcards = await getGiftcards(salon!.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartes cadeaux — {salon!.name}</h1>
        {approved.length > 1 && <SalonSwitcher salons={approved} currentId={salon!.id} />}
      </div>

      <form action={issueGiftcard} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-black/10 bg-white p-4">
        <input type="hidden" name="salonId" value={salon!.id} />
        <div>
          <label className="block text-sm font-medium">Montant</label>
          <input
            type="number"
            name="amount"
            min={1}
            step="0.01"
            required
            className="mt-1 w-32 rounded-lg border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium">Offerte à (optionnel)</label>
          <input
            type="text"
            name="boughtFor"
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Émettre
        </button>
      </form>

      <ul className="mt-6 divide-y divide-black/5 rounded-xl border border-black/10 bg-white">
        {giftcards.map((gc) => (
          <li key={gc.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium tracking-widest">{gc.code}</p>
              <p className="text-ink/50">{gc.bought_for ?? "—"}</p>
            </div>
            <p className="font-medium">
              {gc.balance} € <span className="text-ink/40">/ {gc.amount} €</span>
            </p>
          </li>
        ))}
        {giftcards.length === 0 && (
          <li className="px-4 py-3 text-sm text-ink/50">Aucune carte cadeau émise.</li>
        )}
      </ul>
    </div>
  );
}
