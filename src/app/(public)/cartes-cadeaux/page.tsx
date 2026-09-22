import { createAdminClient } from "@/lib/supabase/admin";
import { checkGiftcardBalance } from "@/lib/actions/giftcards";
import type { Giftcard } from "@/lib/types";

interface GiftcardsPageProps {
  searchParams: { code?: string; erreur?: string };
}

type GiftcardWithSalon = Giftcard & { salons: { name: string } | null };

export default async function GiftcardsPage({ searchParams }: GiftcardsPageProps) {
  let giftcard: GiftcardWithSalon | null = null;

  if (searchParams.code) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("giftcards")
      .select("*, salons(name)")
      .eq("code", searchParams.code.toUpperCase())
      .maybeSingle();
    giftcard = data as GiftcardWithSalon | null;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold">Cartes cadeaux</h1>
      <p className="mt-2 text-ink/60">
        Vérifiez le solde de votre carte cadeau. Elle s&apos;applique automatiquement en
        indiquant son code lors de votre prochaine réservation.
      </p>

      <form action={checkGiftcardBalance} className="mt-6 flex gap-2">
        <input
          type="text"
          name="code"
          placeholder="Code de la carte"
          defaultValue={searchParams.code ?? ""}
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 uppercase"
        />
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Vérifier
        </button>
      </form>

      {searchParams.erreur && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.erreur}</p>
      )}

      {giftcard && (
        <div className="mt-6 rounded-xl border border-black/10 bg-white p-4">
          <p className="font-medium">{giftcard.salons?.name ?? "Salon"}</p>
          <p className="mt-1 text-2xl font-semibold text-brand-dark">{giftcard.balance} €</p>
          <p className="text-sm text-ink/50">sur {giftcard.amount} € offerts</p>
        </div>
      )}
    </div>
  );
}
