"use client";

import { useEffect, useState } from "react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

export function FavoriteButton({ salonId }: { salonId: string }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(salonId));
  }, [salonId]);

  return (
    <button
      type="button"
      aria-pressed={fav}
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={() => setFav(toggleFavorite(salonId))}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg ${
        fav ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface text-ink/40"
      }`}
    >
      {fav ? "♥" : "♡"}
    </button>
  );
}
