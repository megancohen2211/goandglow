"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalonAccess } from "@/lib/auth";

function formatCode() {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** Émission d'une carte cadeau par le salon. */
export async function issueGiftcard(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const boughtFor = String(formData.get("boughtFor") ?? "").trim() || null;

  await requireSalonAccess(salonId);
  if (amount <= 0) return;

  const admin = createAdminClient();
  let code = formatCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await admin.from("giftcards").select("id").eq("code", code).maybeSingle();
    if (!existing) break;
    code = formatCode();
  }

  await admin.from("giftcards").insert({
    salon_id: salonId,
    code,
    amount,
    balance: amount,
    bought_for: boughtFor,
  });

  revalidatePath("/pro/tableau-de-bord/cartes-cadeaux");
}

/** Consultation publique du solde d'un code, tous salons confondus (code unique). */
export async function checkGiftcardBalance(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) redirect("/cartes-cadeaux?erreur=Code+requis");

  const admin = createAdminClient();
  const { data: giftcard } = await admin.from("giftcards").select("id").eq("code", code).maybeSingle();

  if (!giftcard) {
    redirect(`/cartes-cadeaux?erreur=${encodeURIComponent("Code introuvable.")}`);
  }

  redirect(`/cartes-cadeaux?code=${encodeURIComponent(code)}`);
}
