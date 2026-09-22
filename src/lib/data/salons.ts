import { createClient } from "@/lib/supabase/server";
import type { Review, Salon, Service, Staff } from "@/lib/types";

export interface SalonSearchParams {
  citySlug?: string;
  categorySlug?: string;
  q?: string;
  sort?: "prix" | "note" | "prochain-creneau";
}

/** Recherche publique : uniquement les fiches publiées ("approved"). */
export async function searchSalons(params: SalonSearchParams) {
  const supabase = createClient();
  let query = supabase.from("salons").select("*").eq("status", "approved");

  if (params.citySlug) query = query.eq("city_slug", params.citySlug);
  if (params.categorySlug) query = query.eq("category_slug", params.categorySlug);
  if (params.q) query = query.ilike("name", `%${params.q}%`);

  if (params.sort === "prix") {
    // Tri approximatif : par prix de départ, calculé côté client faute de
    // colonne dénormalisée pour ce MVP.
  }

  const { data, error } = await query.order("name");
  if (error) throw error;
  return (data ?? []) as Salon[];
}

export async function countApprovedSalons(citySlug: string, categorySlug: string) {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("salons")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("city_slug", citySlug)
    .eq("category_slug", categorySlug);

  if (error) throw error;
  return count ?? 0;
}

export async function getSalonBySlug(
  citySlug: string,
  categorySlug: string,
  salonSlug: string
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("status", "approved")
    .eq("city_slug", citySlug)
    .eq("category_slug", categorySlug)
    .eq("slug", salonSlug)
    .maybeSingle();

  if (error) throw error;
  return data as Salon | null;
}

export async function getSalonServices(salonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("salon_id", salonId)
    .order("price");

  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function getSalonStaff(salonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("salon_id", salonId)
    .order("name");

  if (error) throw error;
  return (data ?? []) as Staff[];
}

export async function getSalonReviews(salonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}

export function averageRating(reviews: Review[]) {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

export async function listCitiesWithApprovedSalons() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("salons")
    .select("city, city_slug")
    .eq("status", "approved");

  if (error) throw error;
  const seen = new Map<string, string>();
  for (const row of data ?? []) {
    if (!seen.has(row.city_slug)) seen.set(row.city_slug, row.city);
  }
  return Array.from(seen, ([slug, label]) => ({ slug, label }));
}
