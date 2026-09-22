"use client";

import { useEffect, useState } from "react";
import { getFavoriteIds } from "@/lib/favorites";
import { fetchFavoriteSalons } from "@/lib/actions/favorites";
import { SalonCard } from "@/components/SalonCard";
import type { Salon } from "@/lib/types";

export default function FavorisPage() {
  const [salons, setSalons] = useState<Salon[] | null>(null);

  useEffect(() => {
    fetchFavoriteSalons(getFavoriteIds()).then(setSalons);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Mes favoris</h1>
      <p className="mt-1 text-ink/60">
        Enregistrés sur cet appareil uniquement (pas de compte client dans cette version).
      </p>

      {salons === null ? (
        <p className="mt-6 text-ink/50">Chargement...</p>
      ) : salons.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-ink/50">
          Aucun favori pour l&apos;instant. Cliquez sur le cœur d&apos;une fiche salon pour
          l&apos;ajouter ici.
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
