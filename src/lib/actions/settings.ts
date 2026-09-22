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
  const loyaltyRewardThreshold = Math.max(1, Number(formData.get("loyaltyRewardThreshold") ?? 100));
  const loyaltyRewardValue = Math.max(0, Number(formData.get("loyaltyRewardValue") ?? 0));
  const offpeakEnabled = formData.get("offpeakEnabled") === "on";
  const offpeakPercent = Math.min(100, Math.max(0, Number(formData.get("offpeakPercent") ?? 0)));
  const offpeakDays = formData
    .getAll("offpeakDays")
    .map((d) => Number(d))
    .filter((d) => d >= 0 && d <= 6);
  const offpeakStart = String(formData.get("offpeakStart") ?? "09:00");
  const offpeakEnd = String(formData.get("offpeakEnd") ?? "12:00");

  const admin = createAdminClient();
  await admin
    .from("salons")
    .update({
      deposit_percent: depositPercent,
      cancellation_hours: cancellationHours,
      reminder_hours: reminderHours,
      loyalty_points_per_booking: loyaltyPointsPerBooking,
      loyalty_reward_threshold: loyaltyRewardThreshold,
      loyalty_reward_value: loyaltyRewardValue,
      offpeak_enabled: offpeakEnabled,
      offpeak_percent: offpeakPercent,
      offpeak_days: offpeakDays,
      offpeak_start: offpeakStart,
      offpeak_end: offpeakEnd,
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
