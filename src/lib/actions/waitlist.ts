"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalonAccess } from "@/lib/auth";

function basePath(citySlug: string, categorySlug: string, salonSlug: string) {
  return `/${citySlug}/${categorySlug}/${salonSlug}`;
}

/** Le client demande à être prévenu si un créneau se libère. */
export async function joinWaitlist(formData: FormData) {
  const citySlug = String(formData.get("citySlug") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const salonSlug = String(formData.get("salonSlug") ?? "");
  const base = basePath(citySlug, categorySlug, salonSlug);

  const salonId = String(formData.get("salonId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "") || null;
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientPhone = String(formData.get("clientPhone") ?? "").trim();
  const wantedDate = String(formData.get("wantedDate") ?? "") || null;
  const period = String(formData.get("period") ?? "").trim() || null;

  if (!salonId || !clientName || !clientPhone) {
    redirect(`${base}/reserver?erreur=${encodeURIComponent("Nom et téléphone requis pour la liste d'attente.")}`);
  }

  const admin = createAdminClient();
  const { error } = await admin.from("waitlist").insert({
    salon_id: salonId,
    service_id: serviceId,
    wanted_date: wantedDate,
    period,
    client_name: clientName,
    client_phone: clientPhone,
  });

  if (error) {
    redirect(`${base}/reserver?erreur=${encodeURIComponent("Impossible d'enregistrer votre demande, réessayez.")}`);
  }

  redirect(`${base}/reserver?liste-attente=envoyee`);
}

export async function markWaitlistNotified(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const salonId = String(formData.get("salonId") ?? "");
  await requireSalonAccess(salonId);

  const admin = createAdminClient();
  await admin.from("waitlist").update({ notified: true }).eq("id", id).eq("salon_id", salonId);
  revalidatePath("/pro/tableau-de-bord/liste-attente");
}

export async function removeFromWaitlist(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const salonId = String(formData.get("salonId") ?? "");
  await requireSalonAccess(salonId);

  const admin = createAdminClient();
  await admin.from("waitlist").delete().eq("id", id).eq("salon_id", salonId);
  revalidatePath("/pro/tableau-de-bord/liste-attente");
}
