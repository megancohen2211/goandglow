import { createSalonInvitation } from "@/lib/actions/salons";
import { CATEGORIES } from "@/lib/types";

interface NouveauPageProps {
  searchParams: { erreur?: string };
}

export default function AdminNouveauSalonPage({ searchParams }: NouveauPageProps) {
  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold">Inviter un salon (démarchage)</h1>
      <p className="mt-2 text-sm text-ink/60">
        Un e-mail est envoyé au salon avec 6 mois offerts, sans carte bancaire. Une fois qu&apos;il
        accepte les CGU et confirme son e-mail, sa fiche est publiée directement.
      </p>

      {searchParams.erreur && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.erreur}
        </p>
      )}

      <form action={createSalonInvitation} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Nom du salon</label>
          <input name="name" required className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Catégorie</label>
          <select name="type" required className="mt-1 w-full rounded-lg border border-line px-3 py-2">
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Ville</label>
          <input name="city" defaultValue="Marseille" required className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Téléphone</label>
          <input name="phone" className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">E-mail du salon</label>
          <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Envoyer l&apos;invitation
        </button>
      </form>
    </div>
  );
}
