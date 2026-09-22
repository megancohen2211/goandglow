import { createClient } from "@/lib/supabase/server";
import type { Closure, OpeningHours, Review, Salon, Service, Staff } from "@/lib/types";

export interface SalonSearchParams {
  citySlug?: string;
  categorySlug?: string;
  q?: string;
  sort?: "prix" | "note" | "prochain-creneau";
  maxPrice?: number;
}

async function minPricesBySalon(salonIds: string[]) {
  if (salonIds.length === 0) return new Map<string, number>();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("salon_id, price")
    .in("salon_id", salonIds);
  if (error) throw error;

  const map = new Map<string, number>();
  for (const row of (data ?? []) as { salon_id: string; price: number }[]) {
    const current = map.get(row.salon_id);
    if (current === undefined || row.price < current) map.set(row.salon_id, row.price);
  }
  return map;
}

async function avgRatingsBySalon(salonIds: string[]) {
  if (salonIds.length === 0) return new Map<string, number>();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("salon_id, rating")
    .in("salon_id", salonIds);
  if (error) throw error;

  const sums = new Map<string, { total: number; count: number }>();
  for (const row of (data ?? []) as { salon_id: string; rating: number }[]) {
    const entry = sums.get(row.salon_id) ?? { total: 0, count: 0 };
    entry.total += row.rating;
    entry.count += 1;
    sums.set(row.salon_id, entry);
  }
  const map = new Map<string, number>();
  for (const [salonId, { total, count }] of sums) map.set(salonId, total / count);
  return map;
}

/** Prochain jour ouvré (sur 14 jours) qui n'est pas une fermeture exceptionnelle. */
async function nextAvailableDaysBySalon(salonIds: string[]) {
  if (salonIds.length === 0) return new Map<string, number>();
  const supabase = createClient();

  const [{ data: hours, error: hoursError }, { data: closuresData, error: closuresError }] =
    await Promise.all([
      supabase.from("opening_hours").select("salon_id, weekday").in("salon_id", salonIds),
      supabase
        .from("closures")
        .select("salon_id, closed_date")
        .in("salon_id", salonIds)
        .gte("closed_date", new Date().toISOString().slice(0, 10)),
    ]);
  if (hoursError) throw hoursError;
  if (closuresError) throw closuresError;

  const weekdaysBySalon = new Map<string, Set<number>>();
  for (const row of (hours ?? []) as { salon_id: string; weekday: number }[]) {
    const set = weekdaysBySalon.get(row.salon_id) ?? new Set<number>();
    set.add(row.weekday);
    weekdaysBySalon.set(row.salon_id, set);
  }
  const closedDatesBySalon = new Map<string, Set<string>>();
  for (const row of (closuresData ?? []) as { salon_id: string; closed_date: string }[]) {
    const set = closedDatesBySalon.get(row.salon_id) ?? new Set<string>();
    set.add(row.closed_date);
    closedDatesBySalon.set(row.salon_id, set);
  }

  const map = new Map<string, number>();
  for (const salonId of salonIds) {
    const weekdays = weekdaysBySalon.get(salonId);
    if (!weekdays || weekdays.size === 0) continue;
    const closedDates = closedDatesBySalon.get(salonId);
    for (let offset = 0; offset < 14; offset++) {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const iso = d.toISOString().slice(0, 10);
      if (weekdays.has(d.getDay()) && !closedDates?.has(iso)) {
        map.set(salonId, offset);
        break;
      }
    }
  }
  return map;
}

/** Recherche publique : uniquement les fiches publiées ("approved"). */
export async function searchSalons(params: SalonSearchParams) {
  const supabase = createClient();
  let query = supabase.from("salons").select("*").eq("status", "approved");

  if (params.citySlug) query = query.eq("city_slug", params.citySlug);
  if (params.categorySlug) query = query.eq("category_slug", params.categorySlug);
  if (params.q) query = query.ilike("name", `%${params.q}%`);

  const { data, error } = await query.order("name");
  if (error) throw error;
  let salons = (data ?? []) as Salon[];
  const ids = salons.map((s) => s.id);

  if (params.maxPrice !== undefined) {
    const minPrices = await minPricesBySalon(ids);
    salons = salons.filter((s) => {
      const min = minPrices.get(s.id);
      return min === undefined || min <= params.maxPrice!;
    });
  }

  if (params.sort === "prix") {
    const minPrices = await minPricesBySalon(salons.map((s) => s.id));
    salons = salons.slice().sort((a, b) => {
      const pa = minPrices.get(a.id) ?? Infinity;
      const pb = minPrices.get(b.id) ?? Infinity;
      return pa - pb;
    });
  } else if (params.sort === "note") {
    const ratings = await avgRatingsBySalon(salons.map((s) => s.id));
    salons = salons.slice().sort((a, b) => {
      const ra = ratings.get(a.id) ?? -1;
      const rb = ratings.get(b.id) ?? -1;
      return rb - ra;
    });
  } else if (params.sort === "prochain-creneau") {
    const nextDays = await nextAvailableDaysBySalon(salons.map((s) => s.id));
    salons = salons.slice().sort((a, b) => {
      const da = nextDays.get(a.id) ?? Infinity;
      const db = nextDays.get(b.id) ?? Infinity;
      return da - db;
    });
  }

  return salons;
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

export async function getOpeningHours(salonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("opening_hours")
    .select("*")
    .eq("salon_id", salonId)
    .order("weekday");

  if (error) throw error;
  return (data ?? []) as OpeningHours[];
}

export async function getClosures(salonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("closures")
    .select("*")
    .eq("salon_id", salonId)
    .order("closed_date");

  if (error) throw error;
  return (data ?? []) as Closure[];
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

export async function getSalonsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("status", "approved")
    .in("id", ids);

  if (error) throw error;
  return (data ?? []) as Salon[];
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
