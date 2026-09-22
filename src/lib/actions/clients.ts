"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalonAccess } from "@/lib/auth";

export async function addClientNote(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const clientPhone = String(formData.get("clientPhone") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim();

  const account = await requireSalonAccess(salonId);
  if (!note) return;

  const admin = createAdminClient();
  await admin.from("client_notes").insert({
    salon_id: salonId,
    client_phone: clientPhone,
    client_name: clientName,
    note,
    created_by: account.id,
  });

  revalidatePath("/pro/tableau-de-bord/clients");
}
