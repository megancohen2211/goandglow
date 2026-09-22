import Link from "next/link";
import { notFound } from "next/navigation";
import { listCitiesWithApprovedSalons } from "@/lib/data/salons";
import { CATEGORIES } from "@/lib/types";

interface CityPageProps {
  params: { citySlug: string };
}

export async function generateMetadata({ params }: CityPageProps) {
  const cities = await listCitiesWithApprovedSalons();
  const city = cities.find((c) => c.slug === params.citySlug);
  if (!city) return {};
  return { title: `Beauté & coiffure à ${city.label}` };
}

export default async function CityPage({ params }: CityPageProps) {
  const cities = await listCitiesWithApprovedSalons();
  const city = cities.find((c) => c.slug === params.citySlug);
  if (!city) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Salons de beauté à {city.label}</h1>
      <p className="mt-2 text-ink/60">Choisissez une catégorie pour voir les salons disponibles.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/${city.slug}/${cat.slug}`}
            className="rounded-2xl border border-line bg-surface p-4 hover:border-brand"
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
