"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { addMinutes, timeToMinutes, weekdayOf } from "@/lib/time";
import { awardLoyaltyPoints } from "@/lib/loyalty";
import { getCurrentAccount } from "@/lib/auth";
import type { Booking, OpeningHours, Service, Staff } from "@/lib/types";

function basePath(citySlug: string, categorySlug: string, salonSlug: string) {
  return `/${citySlug}/${categorySlug}/${salonSlug}`;
}

function withError(base: string, message: string): never {
  redirect(`${base}/reserver?erreur=${encodeURIComponent(message)}`);
}

async function staffIsFree(
  admin: ReturnType<typeof createAdminClient>,
  staffId: string,
  date: string,
  start: string,
  end: string
) {
  const { data, error } = await admin
    .from("bookings")
    .select("booking_time, duration_min")
    .eq("staff_id", staffId)
    .eq("booking_date", date)
    .neq("status", "cancelled");

  if (error) throw error;

  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  const bookingConflict = (data as Pick<Booking, "booking_time" | "duration_min">[]).some((b) => {
    const bStart = timeToMinutes(b.booking_time);
    const bEnd = bStart + b.duration_min;
    return startMin < bEnd && bStart < endMin;
  });
  if (bookingConflict) return false;

  const { data: blocks, error: blocksError } = await admin
    .from("staff_unavailability")
    .select("start_time, end_time")
    .eq("staff_id", staffId)
    .eq("unavailable_date", date);

  if (blocksError) throw blocksError;

  return !(blocks as { start_time: string; end_time: string }[]).some((b) => {
    const bStart = timeToMinutes(b.start_time);
    const bEnd = timeToMinutes(b.end_time);
    return startMin < bEnd && bStart < endMin;
  });
}

export async function createBooking(formData: FormData) {
  const citySlug = String(formData.get("citySlug") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const salonSlug = String(formData.get("salonSlug") ?? "");
  const base = basePath(citySlug, categorySlug, salonSlug);

  const salonId = String(formData.get("salonId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const requestedStaffId = String(formData.get("staffId") ?? "") || null;
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const giftcardCode = String(formData.get("giftcardCode") ?? "").trim().toUpperCase() || null;
  const peopleCount = Math.min(Math.max(Number(formData.get("peopleCount") ?? 1), 1), 4);

  if (!salonId || !serviceId || !date || !time) {
    withError(base, "Merci de remplir tous les champs.");
  }

  const names: string[] = [];
  const phones: string[] = [];
  for (let i = 0; i < peopleCount; i++) {
    const name = String(formData.get(`name_${i}`) ?? "").trim();
    const phone = String(formData.get(`phone_${i}`) ?? "").trim();
    if (!name || !phone) withError(base, "Nom et téléphone requis pour chaque personne.");
    names.push(name);
    phones.push(phone);
  }

  const admin = createAdminClient();

  const { data: salon, error: salonError } = await admin
    .from("salons")
    .select("*")
    .eq("id", salonId)
    .eq("status", "approved")
    .maybeSingle();
  if (salonError || !salon) withError(base, "Ce salon n'est plus disponible.");

  const { data: service } = await admin
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("salon_id", salonId)
    .maybeSingle<Service>();
  if (!service) withError(base, "Prestation introuvable.");

  const weekday = weekdayOf(date);
  const { data: hours } = await admin
    .from("opening_hours")
    .select("*")
    .eq("salon_id", salonId)
    .eq("weekday", weekday)
    .maybeSingle<OpeningHours>();

  const totalDuration = service!.duration_min * peopleCount;
  const endTime = addMinutes(time, totalDuration);

  if (!hours || time < hours.opens_at || endTime > hours.closes_at) {
    withError(base, "Le salon est fermé à cet horaire, choisissez un autre créneau.");
  }

  const { data: closure } = await admin
    .from("closures")
    .select("id")
    .eq("salon_id", salonId)
    .eq("closed_date", date)
    .maybeSingle();
  if (closure) withError(base, "Le salon est exceptionnellement fermé ce jour-là.");

  let staffId = requestedStaffId;
  if (!staffId) {
    const { data: staffList } = await admin
      .from("staff")
      .select("*")
      .eq("salon_id", salonId)
      .returns<Staff[]>();

    for (const candidate of staffList ?? []) {
      let free = true;
      for (let i = 0; i < peopleCount; i++) {
        const slotStart = addMinutes(time, i * service!.duration_min);
        const slotEnd = addMinutes(slotStart, service!.duration_min);
        if (!(await staffIsFree(admin, candidate.id, date, slotStart, slotEnd))) {
          free = false;
          break;
        }
      }
      if (free) {
        staffId = candidate.id;
        break;
      }
    }
    if (!staffId) withError(base, "Plus aucun créneau disponible à cette heure, essayez un autre horaire.");
  } else {
    for (let i = 0; i < peopleCount; i++) {
      const slotStart = addMinutes(time, i * service!.duration_min);
      const slotEnd = addMinutes(slotStart, service!.duration_min);
      if (!(await staffIsFree(admin, staffId, date, slotStart, slotEnd))) {
        withError(base, "Ce professionnel n'est plus disponible à cet horaire.");
      }
    }
  }

  let giftcard: { id: string; balance: number } | null = null;
  if (giftcardCode) {
    const { data: foundGiftcard } = await admin
      .from("giftcards")
      .select("id, balance")
      .eq("salon_id", salonId)
      .eq("code", giftcardCode)
      .maybeSingle();
    if (!foundGiftcard || foundGiftcard.balance <= 0) {
      withError(base, "Ce code cadeau est invalide ou déjà utilisé.");
    }
    giftcard = foundGiftcard;
  }

  const rows = names.map((name, i) => ({
    salon_id: salonId,
    service_id: serviceId,
    staff_id: staffId,
    client_name: name,
    client_phone: phones[i],
    client_account_id: null as string | null,
    booking_date: date,
    booking_time: addMinutes(time, i * service!.duration_min),
    duration_min: service!.duration_min,
    price: service!.price,
    status: "ok" as const,
    source: "goandglow",
  }));

  // La personne n°1 est la personne connectée (le cas échéant) : ses
  // réservations pour les autres personnes du groupe restent en son nom
  // uniquement, sans compte associé.
  const account = await getCurrentAccount();
  if (account) rows[0].client_account_id = account.id;

  if (giftcard) {
    const discount = Math.min(giftcard.balance, rows[0].price);
    rows[0].price = Number((rows[0].price - discount).toFixed(2));
  }

  const { data: created, error: insertError } = await admin
    .from("bookings")
    .insert(rows)
    .select("id");

  if (insertError || !created) withError(base, "Impossible d'enregistrer la réservation, réessayez.");

  if (giftcard) {
    const discount = Math.min(giftcard.balance, service!.price);
    await admin
      .from("giftcards")
      .update({ balance: Number((giftcard.balance - discount).toFixed(2)) })
      .eq("id", giftcard.id);
    await admin.from("giftcard_redemptions").insert({
      giftcard_id: giftcard.id,
      booking_id: created![0].id,
      amount: discount,
    });
  }

  const pointsPerBooking = Number(salon.loyalty_points_per_booking ?? 0);
  if (pointsPerBooking > 0) {
    for (let i = 0; i < names.length; i++) {
      await awardLoyaltyPoints(admin, salonId, phones[i], names[i], pointsPerBooking, created![i].id);
    }
  }

  redirect(`${base}/reserver/confirmation?id=${created![0].id}`);
}
