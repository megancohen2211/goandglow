"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalonAccess } from "@/lib/auth";
import { getClients } from "@/lib/data/pro";

function basePath(citySlug: string, categorySlug: string, salonSlug: string) {
  return `/${citySlug}/${categorySlug}/${salonSlug}`;
}

/**
 * Premier message d'un client vers un salon : réutilise la conversation
 * existante pour ce numéro de téléphone, ou en crée une. Le client accède
 * ensuite à son fil via l'URL contenant l'id de conversation (pas de
 * compte formel dans ce MVP, même logique que le lien d'invitation salon).
 */
export async function startOrContinueChat(formData: FormData) {
  const citySlug = String(formData.get("citySlug") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const salonSlug = String(formData.get("salonSlug") ?? "");
  const base = basePath(citySlug, categorySlug, salonSlug);

  const salonId = String(formData.get("salonId") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientPhone = String(formData.get("clientPhone") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();

  if (!salonId || !clientName || !clientPhone || !text) {
    redirect(`${base}?erreur=${encodeURIComponent("Nom, téléphone et message requis.")}#contact`);
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("chats")
    .select("id")
    .eq("salon_id", salonId)
    .eq("client_phone", clientPhone)
    .maybeSingle();

  let chatId = existing?.id as string | undefined;
  if (!chatId) {
    const { data: created, error } = await admin
      .from("chats")
      .insert({ salon_id: salonId, client_name: clientName, client_phone: clientPhone })
      .select("id")
      .single();
    if (error || !created) {
      redirect(`${base}?erreur=${encodeURIComponent("Impossible d'envoyer le message, réessayez.")}#contact`);
    }
    chatId = created!.id;
  }

  await admin.from("chat_messages").insert({ chat_id: chatId, sender: "client", text });

  redirect(`${base}/messages/${chatId}`);
}

export async function sendClientMessage(formData: FormData) {
  const citySlug = String(formData.get("citySlug") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const salonSlug = String(formData.get("salonSlug") ?? "");
  const chatId = String(formData.get("chatId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const base = basePath(citySlug, categorySlug, salonSlug);

  if (text) {
    const admin = createAdminClient();
    await admin.from("chat_messages").insert({ chat_id: chatId, sender: "client", text });
  }

  redirect(`${base}/messages/${chatId}`);
}

/** Envoie le même message à tous les clients d'un segment simple. */
export async function broadcastToSegment(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const segment = String(formData.get("segment") ?? "all");
  const text = String(formData.get("text") ?? "").trim();

  await requireSalonAccess(salonId);
  if (!text) return;

  const clients = await getClients(salonId);
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const targets =
    segment === "inactive60" ? clients.filter((c) => c.lastVisit < cutoff) : clients;

  const admin = createAdminClient();

  for (const client of targets) {
    const { data: existing } = await admin
      .from("chats")
      .select("id")
      .eq("salon_id", salonId)
      .eq("client_phone", client.phone)
      .maybeSingle();

    let chatId = existing?.id as string | undefined;
    if (!chatId) {
      const { data: created } = await admin
        .from("chats")
        .insert({ salon_id: salonId, client_name: client.name, client_phone: client.phone })
        .select("id")
        .single();
      chatId = created?.id;
    }
    if (chatId) {
      await admin.from("chat_messages").insert({ chat_id: chatId, sender: "salon", text });
    }
  }

  revalidatePath("/pro/tableau-de-bord/messagerie");
}

export async function sendSalonReply(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const chatId = String(formData.get("chatId") ?? "");
  const text = String(formData.get("text") ?? "").trim();

  await requireSalonAccess(salonId);
  if (!text) return;

  const admin = createAdminClient();
  await admin.from("chat_messages").insert({ chat_id: chatId, sender: "salon", text });

  revalidatePath("/pro/tableau-de-bord/messagerie");
}
