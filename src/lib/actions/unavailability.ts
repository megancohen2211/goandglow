"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalonAccess } from "@/lib/auth";

const AGENDA_PATH = "/pro/tableau-de-bord/agenda";

export async function addUnavailability(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const staffId = String(formData.get("staffId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  await requireSalonAccess(salonId);
  if (!staffId || !date || !startTime || !endTime) return;

  const admin = createAdminClient();
  await admin.from("staff_unavailability").insert({
    staff_id: staffId,
    unavailable_date: date,
    start_time: startTime,
    end_time: endTime,
    reason,
  });

  revalidatePath(AGENDA_PATH);
}

export async function removeUnavailability(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const id = String(formData.get("id") ?? "");
  await requireSalonAccess(salonId);

  const admin = createAdminClient();
  await admin.from("staff_unavailability").delete().eq("id", id);
  revalidatePath(AGENDA_PATH);
}
