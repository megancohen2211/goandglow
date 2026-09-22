import Link from "next/link";
import type { Salon } from "@/lib/types";
import { FavoriteButton } from "@/components/FavoriteButton";

export function SalonCard({ salon }: { salon: Salon }) {
  const href = `/${salon.city_slug}/${salon.category_slug}/${salon.slug}`;
  const hue = salon.hue ?? 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div
        className="relative flex h-24 items-center justify-center text-4xl font-extrabold"
        style={{
          backgroundColor: `hsl(${hue} 40% 88%)`,
          color: `hsl(${hue} 45% 32%)`,
          fontFamily: "var(--font-heading)",
        }}
      >
        {salon.name.charAt(0).toUpperCase()}
        <div className="absolute right-2 top-2">
          <FavoriteButton salonId={salon.id} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={href} className="font-heading text-lg font-bold hover:underline">
              {salon.name}
            </Link>
            <p className="text-sm text-ink/60">{salon.city}</p>
          </div>
          {salon.phone && (
            <a
              href={`tel:${salon.phone}`}
              className="shrink-0 rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand-dark"
            >
              Appeler
            </a>
          )}
        </div>

        {salon.description && (
          <p className="line-clamp-2 text-sm text-ink/70">{salon.description}</p>
        )}

        <div className="mt-1 flex flex-wrap gap-1 text-xs">
          {salon.offpeak_enabled && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent-ink">
              Bons plans heures creuses
            </span>
          )}
          {salon.home_service && (
            <span className="rounded-full bg-brand-light px-2 py-0.5 font-medium text-brand-dark">
              À domicile
            </span>
          )}
          {salon.has_iban && (
            <span className="rounded-full bg-brand-light px-2 py-0.5 font-medium text-brand-dark">
              Acompte à la réservation
            </span>
          )}
        </div>

        <Link
          href={`${href}/reserver`}
          className="mt-auto inline-block rounded-full bg-brand px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-dark"
        >
          Réserver
        </Link>
      </div>
    </div>
  );
}
