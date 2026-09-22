"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClientAccount } from "@/lib/auth";

/**
 * Enregistre nom/téléphone du particulier et rattache au passage les
 * réservations déjà faites avec ce numéro (avant la création du compte)
 * à son historique.
 */
export async function updateMyProfile(formData: FormData) {
  const account = await requireClientAccount();

  const fullName = String(formData.get("fullName") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  const admin = createAdminClient();
  const { error } = await admin
    .from("accounts")
    .update({ full_name: fullName, phone })
    .eq("id", account.id);

  if (error) {
    redirect(`/compte/tableau-de-bord/profil?erreur=${encodeURIComponent(error.message)}`);
  }

  if (phone) {
    await admin
      .from("bookings")
      .update({ client_account_id: account.id })
      .eq("client_phone", phone)
      .is("client_account_id", null);
  }

  revalidatePath("/compte/tableau-de-bord");
  redirect("/compte/tableau-de-bord/profil?enregistre=1");
}

/** Annule une réservation à venir liée au compte connecté. */
export async function cancelMyBooking(formData: FormData) {
  await requireClientAccount();

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;

  const supabase = createClient();
  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);

  revalidatePath("/compte/tableau-de-bord");
}
