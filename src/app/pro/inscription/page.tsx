import { createSalonSelfSignup } from "@/lib/actions/salons";
import { CATEGORIES } from "@/lib/types";

interface InscriptionPageProps {
  searchParams: { erreur?: string };
}

export default function InscriptionPage({ searchParams }: InscriptionPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Créer ma fiche salon</h1>
      <p className="mt-2 text-sm text-ink/60">
        Votre fiche sera vérifiée par un administrateur avant publication. Vous confirmez
        votre e-mail par un code juste après cette étape.
      </p>

      {searchParams.erreur && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.erreur}
        </p>
      )}

      <form action={createSalonSelfSignup} className="mt-6 space-y-6">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            Votre salon
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Adresse</label>
              <input name="address" className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea name="description" rows={3} className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="homeService" />
            Je me déplace aussi à domicile
          </label>
          <div className="max-w-xs">
            <label className="block text-sm font-medium">Supplément à domicile (€, facultatif)</label>
            <input name="homeFee" type="number" min={0} step="0.5" className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            Prestations (jusqu'à 3, modifiable ensuite)
          </h2>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-3 gap-3">
              <input name={`service_name_${i}`} placeholder="Nom" className="rounded-lg border border-line px-3 py-2" />
              <input name={`service_duration_${i}`} type="number" min={5} placeholder="Durée (min)" className="rounded-lg border border-line px-3 py-2" />
              <input name={`service_price_${i}`} type="number" min={0} step="0.5" placeholder="Prix (€)" className="rounded-lg border border-line px-3 py-2" />
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            Équipe (jusqu'à 3, modifiable ensuite)
          </h2>
          {[0, 1, 2].map((i) => (
            <input key={i} name={`staff_name_${i}`} placeholder="Prénom" className="w-full rounded-lg border border-line px-3 py-2" />
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            Paiement (facultatif)
          </h2>
          <div>
            <label className="block text-sm font-medium">IBAN</label>
            <input name="iban" className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
            <p className="mt-1 text-xs text-ink/50">
              Sans IBAN, vous fonctionnez normalement (encaissement sur place) mais ne pouvez
              pas activer l'acompte à la réservation.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            Votre e-mail
          </h2>
          <input
            name="email"
            type="email"
            required
            placeholder="vous@votre-salon.fr"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
        </section>

        <button
          type="submit"
          className="w-full rounded-full bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Créer ma fiche et recevoir mon code
        </button>
      </form>
    </div>
  );
}
