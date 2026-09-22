"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalonAccess } from "@/lib/auth";

export async function updateSalonSettings(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  await requireSalonAccess(salonId);

  const depositPercent = Math.min(100, Math.max(0, Number(formData.get("depositPercent") ?? 0)));
  const cancellationHours = Math.max(0, Number(formData.get("cancellationHours") ?? 0));
  const reminderHours = Math.max(0, Number(formData.get("reminderHours") ?? 0));
  const loyaltyPointsPerBooking = Math.max(0, Number(formData.get("loyaltyPointsPerBooking") ?? 0));

  const admin = createAdminClient();
  await admin
    .from("salons")
    .update({
      deposit_percent: depositPercent,
      cancellation_hours: cancellationHours,
      reminder_hours: reminderHours,
      loyalty_points_per_booking: loyaltyPointsPerBooking,
    })
    .eq("id", salonId);

  revalidatePath("/pro/tableau-de-bord/reglages");
}

/** Invalide l'ancien lien d'abonnement calendrier (.ics) et en génère un nouveau. */
export async function regenerateCalendarToken(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  await requireSalonAccess(salonId);

  const admin = createAdminClient();
  await admin.from("salons").update({ calendar_token: randomUUID() }).eq("id", salonId);

  revalidatePath("/pro/tableau-de-bord/reglages");
}
