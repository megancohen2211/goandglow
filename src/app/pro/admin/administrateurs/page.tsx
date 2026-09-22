import { requireRole } from "@/lib/auth";
import { getStaffAccounts } from "@/lib/data/admin";
import { addAdmin, removeAdmin } from "@/lib/actions/admin";

interface AdministrateursPageProps {
  searchParams: { erreur?: string };
}

export default async function AdministrateursPage({ searchParams }: AdministrateursPageProps) {
  await requireRole(["owner"]);
  const staff = await getStaffAccounts();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold">Administrateurs</h1>
      <p className="mt-2 text-sm text-ink/60">
        Il doit toujours rester au moins un propriétaire ; la suppression du dernier est
        bloquée automatiquement.
      </p>

      {searchParams.erreur && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.erreur}
        </p>
      )}

      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
        {staff.map((a) => (
          <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              {a.email} <span className="text-ink/40">— {a.role}</span>
            </span>
            {a.role === "admin" && (
              <form action={removeAdmin}>
                <input type="hidden" name="accountId" value={a.id} />
                <button className="text-ink/50 hover:underline">Retirer</button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <form action={addAdmin} className="mt-6 flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="email@exemple.fr"
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
        />
        <button className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Ajouter comme admin
        </button>
      </form>
    </div>
  );
}
