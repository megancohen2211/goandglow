import { searchSalons, listCitiesWithApprovedSalons } from "@/lib/data/salons";
import { parseFreeTextQuery } from "@/lib/search-assistant";
import { CATEGORIES } from "@/lib/types";
import { SalonCard } from "@/components/SalonCard";

const DEFAULT_CITY_SLUG = "marseille";

type Sort = "prix" | "note" | "prochain-creneau";
const SORT_LABELS: Record<Sort, string> = {
  "prochain-creneau": "Prochain créneau",
  prix: "Prix",
  note: "Note",
};

interface HomeProps {
  searchParams: { q?: string; ville?: string; categorie?: string; tri?: string };
}

export default async function HomePage({ searchParams }: HomeProps) {
  const cities = await listCitiesWithApprovedSalons();
  const citySlug = searchParams.ville || DEFAULT_CITY_SLUG;

  const parsed = searchParams.q ? parseFreeTextQuery(searchParams.q) : undefined;
  const categorySlug = searchParams.categorie || parsed?.categorySlug;
  const sort = (searchParams.tri as Sort | undefined) && searchParams.tri! in SORT_LABELS
    ? (searchParams.tri as Sort)
    : undefined;

  const filtered = await searchSalons({
    citySlug,
    categorySlug,
    sort,
    maxPrice: parsed?.maxPrice,
  });

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
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink/50">{filtered.length} résultat(s)</span>
            <form className="flex items-center gap-1 text-sm">
              <input type="hidden" name="ville" value={citySlug} />
              {categorySlug && <input type="hidden" name="categorie" value={categorySlug} />}
              {searchParams.q && <input type="hidden" name="q" value={searchParams.q} />}
              <label htmlFor="tri" className="text-ink/50">
                Trier :
              </label>
              <select
                id="tri"
                name="tri"
                defaultValue={sort ?? ""}
                className="rounded-full border border-line bg-surface px-3 py-1"
              >
                <option value="">Pertinence</option>
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-full border border-line bg-surface px-3 py-1 hover:bg-line/40"
              >
                OK
              </button>
            </form>
          </div>
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
