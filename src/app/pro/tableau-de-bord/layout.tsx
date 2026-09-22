import Link from "next/link";
import { requireAccount } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount();

  return (
    <div className="grid grid-cols-[200px_1fr] gap-6 px-4 py-8">
      <aside className="space-y-1 text-sm">
        <Link href="/pro/tableau-de-bord" className="block rounded-lg px-3 py-2 hover:bg-black/5">
          Vue d&apos;ensemble
        </Link>
        <Link
          href="/pro/tableau-de-bord/agenda"
          className="block rounded-lg px-3 py-2 hover:bg-black/5"
        >
          Agenda
        </Link>
        <Link
          href="/pro/tableau-de-bord/avis"
          className="block rounded-lg px-3 py-2 hover:bg-black/5"
        >
          Avis
        </Link>
        <Link
          href="/pro/tableau-de-bord/liste-attente"
          className="block rounded-lg px-3 py-2 hover:bg-black/5"
        >
          Liste d&apos;attente
        </Link>
        {(account.role === "admin" || account.role === "owner") && (
          <Link href="/pro/admin" className="block rounded-lg px-3 py-2 hover:bg-black/5">
            Espace admin
          </Link>
        )}
        <form action={signOut} className="pt-4">
          <button className="w-full rounded-lg px-3 py-2 text-left text-ink/50 hover:bg-black/5">
            Se déconnecter
          </button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
