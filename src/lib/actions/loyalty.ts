"use server";

import { redirect } from "next/navigation";

function basePath(citySlug: string, categorySlug: string, salonSlug: string) {
  return `/${citySlug}/${categorySlug}/${salonSlug}`;
}

/** Redirige avec le numéro en query : la page salon affiche le solde. */
export async function checkLoyaltyPoints(formData: FormData) {
  const citySlug = String(formData.get("citySlug") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const salonSlug = String(formData.get("salonSlug") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const base = basePath(citySlug, categorySlug, salonSlug);

  redirect(`${base}?phone=${encodeURIComponent(phone)}#fidelite`);
}
