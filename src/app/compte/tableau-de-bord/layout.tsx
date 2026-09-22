import Link from "next/link";
import { requireClientAccount } from "@/lib/auth";
import { clientSignOut } from "@/lib/actions/clientAuth";

export default async function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireClientAccount();

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-[160px_1fr] gap-6 px-4 py-8">
      <aside className="space-y-1 text-sm">
        <Link
          href="/compte/tableau-de-bord"
          className="block rounded-lg px-3 py-2 hover:bg-black/5"
        >
          Réservations
        </Link>
        <Link
          href="/compte/tableau-de-bord/fidelite"
          className="block rounded-lg px-3 py-2 hover:bg-black/5"
        >
          Fidélité
        </Link>
        <Link
          href="/compte/tableau-de-bord/profil"
          className="block rounded-lg px-3 py-2 hover:bg-black/5"
        >
          Mon profil
        </Link>
        <form action={clientSignOut} className="pt-4">
          <button className="w-full rounded-lg px-3 py-2 text-left text-ink/50 hover:bg-black/5">
            Se déconnecter
          </button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
