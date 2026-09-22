import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  searchSalons,
  countApprovedSalons,
  listCitiesWithApprovedSalons,
} from "@/lib/data/salons";
import { CATEGORIES, MIN_SALONS_FOR_INDEX } from "@/lib/types";
import { SalonCard } from "@/components/SalonCard";

interface CategoryPageProps {
  params: { citySlug: string; categorySlug: string };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = CATEGORIES.find((c) => c.slug === params.categorySlug);
  const count = await countApprovedSalons(params.citySlug, params.categorySlug);

  return {
    title: category ? `${category.label} à ${params.citySlug}` : undefined,
    // Règle SEO : ne pas indexer une page catégorie/quartier tant qu'elle
    // n'a pas un minimum de fiches validées derrière (pas de page vide
    // indexée par Google).
    robots: count < MIN_SALONS_FOR_INDEX ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = CATEGORIES.find((c) => c.slug === params.categorySlug);
  if (!category) notFound();

  const cities = await listCitiesWithApprovedSalons();
  const city = cities.find((c) => c.slug === params.citySlug);
  if (!city) notFound();

  const salons = await searchSalons({
    citySlug: params.citySlug,
    categorySlug: params.categorySlug,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">
        {category.label} à {city.label}
      </h1>

      {salons.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-ink/50">
          Aucun salon "{category.label}" validé à {city.label} pour le moment.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {salons.map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))}
        </div>
      )}
    </div>
  );
}
