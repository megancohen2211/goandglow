import type { createAdminClient } from "@/lib/supabase/admin";

/** Attribue des points de fidélité à un client pour un salon donné. */
export async function awardLoyaltyPoints(
  admin: ReturnType<typeof createAdminClient>,
  salonId: string,
  clientPhone: string,
  clientName: string,
  points: number,
  bookingId: string
) {
  if (points <= 0) return;

  const { data: existing } = await admin
    .from("loyalty_points")
    .select("points")
    .eq("salon_id", salonId)
    .eq("client_phone", clientPhone)
    .maybeSingle();

  const newTotal = (existing?.points ?? 0) + points;

  await admin.from("loyalty_points").upsert(
    {
      salon_id: salonId,
      client_phone: clientPhone,
      client_name: clientName,
      points: newTotal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "salon_id,client_phone" }
  );

  await admin.from("loyalty_transactions").insert({
    salon_id: salonId,
    client_phone: clientPhone,
    points,
    reason: "réservation",
    booking_id: bookingId,
  });
}
