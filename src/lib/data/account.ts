import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MyBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_min: number;
  price: number;
  status: "ok" | "noshow" | "cancelled";
  salon: { name: string; city: string; slug: string; city_slug: string; category_slug: string } | null;
  service: { name: string } | null;
}

/** Réservations liées au compte connecté (RLS : bookings_client_read_own). */
export async function getMyBookings(accountId: string): Promise<MyBooking[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_date, booking_time, duration_min, price, status, salons(name, city, slug, city_slug, category_slug), services(name)"
    )
    .eq("client_account_id", accountId)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    booking_date: row.booking_date,
    booking_time: row.booking_time,
    duration_min: row.duration_min,
    price: row.price,
    status: row.status,
    salon: (Array.isArray(row.salons) ? row.salons[0] : row.salons) ?? null,
    service: (Array.isArray(row.services) ? row.services[0] : row.services) ?? null,
  }));
}

export interface MyLoyalty {
  salon_id: string;
  salon_name: string;
  points: number;
}

/**
 * Points de fidélité du numéro renseigné dans le profil, tous salons
 * confondus. Passe par le client service_role comme la consultation
 * publique par téléphone (loyalty_points n'a pas de politique de lecture
 * client, la donnée est identifiée par téléphone et non par compte).
 */
export async function getMyLoyalty(phone: string): Promise<MyLoyalty[]> {
  if (!phone) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("loyalty_points")
    .select("salon_id, points, salons(name)")
    .eq("client_phone", phone)
    .gt("points", 0);

  if (error) throw error;

  return ((data ?? []) as unknown as { salon_id: string; points: number; salons: { name: string } | { name: string }[] | null }[]).map(
    (row) => ({
      salon_id: row.salon_id,
      salon_name: (Array.isArray(row.salons) ? row.salons[0]?.name : row.salons?.name) ?? "Salon",
      points: row.points,
    })
  );
}
