import { searchSalons, listCitiesWithApprovedSalons } from "@/lib/data/salons";
import { parseFreeTextQuery } from "@/lib/search-assistant";
import { CATEGORIES } from "@/lib/types";
import { SalonCard } from "@/components/SalonCard";

const DEFAULT_CITY_SLUG = "marseille";

interface HomeProps {
  searchParams: { q?: string; ville?: string; categorie?: string };
}

export default async function HomePage({ searchParams }: HomeProps) {
  const cities = await listCitiesWithApprovedSalons();
  const citySlug = searchParams.ville || DEFAULT_CITY_SLUG;

  const parsed = searchParams.q ? parseFreeTextQuery(searchParams.q) : undefined;
  const categorySlug = searchParams.categorie || parsed?.categorySlug;

  const salons = await searchSalons({ citySlug, categorySlug });
  const filtered = parsed?.maxPrice
    ? salons // le prix par prestation est filtré sur la page catégorie ; ici on garde tout
    : salons;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-10 rounded-2xl bg-brand-light p-8 text-center">
        <h1 className="text-3xl font-semibold text-brand-dark">
          Réservez votre rendez-vous beauté
        </h1>
        <p className="mt-2 text-ink/70">
          Coiffeur, barbier, ongles, institut, massage — sans commission pour les salons.
        </p>

        <form action="/" className="mx-auto mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
          <input
            type="text"
            name="q"
            placeholder="Ex. « balayage samedi matin, moins de 140 € »"
            defaultValue={searchParams.q}
            className="flex-1 rounded-lg border border-line px-4 py-2"
          />
          <button
            type="submit"
            className="rounded-full bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark"
          >
            Rechercher
          </button>
        </form>

        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.slug}
              href={`/?ville=${citySlug}&categorie=${cat.slug}`}
              className={`rounded-full px-3 py-1 ${
                categorySlug === cat.slug ? "bg-brand text-white" : "bg-surface text-ink/70"
              }`}
            >
              {cat.label}
            </a>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium">
            Salons à {cities.find((c) => c.slug === citySlug)?.label ?? "Marseille"}
          </h2>
          <span className="text-sm text-ink/50">{filtered.length} résultat(s)</span>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink/50">
            Aucun salon ne correspond pour l'instant. Nous démarrons à Marseille — d'autres
            villes arrivent bientôt.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
