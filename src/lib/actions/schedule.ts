"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalonAccess } from "@/lib/auth";

const SCHEDULE_PATH = "/pro/tableau-de-bord/equipe";

export async function addStaffMember(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  await requireSalonAccess(salonId);
  if (!name) return;

  const admin = createAdminClient();
  await admin.from("staff").insert({ salon_id: salonId, name });
  revalidatePath(SCHEDULE_PATH);
}

export async function removeStaffMember(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const staffId = String(formData.get("staffId") ?? "");
  await requireSalonAccess(salonId);

  const admin = createAdminClient();
  await admin.from("staff").delete().eq("id", staffId).eq("salon_id", salonId);
  revalidatePath(SCHEDULE_PATH);
}

export async function setOpeningHours(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const weekday = Number(formData.get("weekday") ?? 0);
  const closed = formData.get("closed") === "on";
  const opensAt = String(formData.get("opensAt") ?? "");
  const closesAt = String(formData.get("closesAt") ?? "");

  await requireSalonAccess(salonId);
  const admin = createAdminClient();

  if (closed || !opensAt || !closesAt) {
    await admin.from("opening_hours").delete().eq("salon_id", salonId).eq("weekday", weekday);
  } else {
    const { data: existing } = await admin
      .from("opening_hours")
      .select("id")
      .eq("salon_id", salonId)
      .eq("weekday", weekday)
      .maybeSingle();

    if (existing) {
      await admin
        .from("opening_hours")
        .update({ opens_at: opensAt, closes_at: closesAt })
        .eq("id", existing.id);
    } else {
      await admin.from("opening_hours").insert({
        salon_id: salonId,
        weekday,
        opens_at: opensAt,
        closes_at: closesAt,
      });
    }
  }

  revalidatePath(SCHEDULE_PATH);
}

export async function addClosure(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const closedDate = String(formData.get("closedDate") ?? "");
  await requireSalonAccess(salonId);
  if (!closedDate) return;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("closures")
    .select("id")
    .eq("salon_id", salonId)
    .eq("closed_date", closedDate)
    .maybeSingle();

  if (!existing) {
    await admin.from("closures").insert({ salon_id: salonId, closed_date: closedDate });
  }
  revalidatePath(SCHEDULE_PATH);
}

export async function removeClosure(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const closureId = String(formData.get("closureId") ?? "");
  await requireSalonAccess(salonId);

  const admin = createAdminClient();
  await admin.from("closures").delete().eq("id", closureId).eq("salon_id", salonId);
  revalidatePath(SCHEDULE_PATH);
}
