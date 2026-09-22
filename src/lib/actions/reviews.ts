"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalonAccess } from "@/lib/auth";

function basePath(citySlug: string, categorySlug: string, salonSlug: string) {
  return `/${citySlug}/${categorySlug}/${salonSlug}`;
}

const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Avis client, publié immédiatement (pas de modération dans ce MVP). */
export async function submitReview(formData: FormData) {
  const citySlug = String(formData.get("citySlug") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const salonSlug = String(formData.get("salonSlug") ?? "");
  const base = basePath(citySlug, categorySlug, salonSlug);

  const salonId = String(formData.get("salonId") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 0);
  const text = String(formData.get("text") ?? "").trim() || null;

  if (!salonId || !clientName || rating < 1 || rating > 5) {
    redirect(`${base}?erreur=${encodeURIComponent("Merci de renseigner votre nom et une note de 1 à 5.")}#avis`);
  }

  const admin = createAdminClient();
  const photoUrls: string[] = [];

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_PHOTOS);

  for (const file of files) {
    if (file.size > MAX_PHOTO_BYTES) continue;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${salonId}/${randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("avis-photos")
      .upload(path, file, { contentType: file.type || "image/jpeg" });
    if (!uploadError) {
      const { data } = admin.storage.from("avis-photos").getPublicUrl(path);
      photoUrls.push(data.publicUrl);
    }
  }

  const { error } = await admin.from("reviews").insert({
    salon_id: salonId,
    client_name: clientName,
    rating,
    text,
    photos: photoUrls,
  });

  if (error) {
    redirect(`${base}?erreur=${encodeURIComponent("Impossible d'enregistrer votre avis, réessayez.")}#avis`);
  }

  revalidatePath(base);
  redirect(`${base}?avis=envoye#avis`);
}

/** Réponse du salon à un avis. */
export async function replyToReview(formData: FormData) {
  const reviewId = String(formData.get("reviewId") ?? "");
  const salonId = String(formData.get("salonId") ?? "");
  const reply = String(formData.get("reply") ?? "").trim();

  await requireSalonAccess(salonId);

  const admin = createAdminClient();
  await admin
    .from("reviews")
    .update({ reply: reply || null })
    .eq("id", reviewId)
    .eq("salon_id", salonId);

  revalidatePath("/pro/tableau-de-bord/avis");
}
