"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { linkOrCreateClientAccount } from "@/lib/actions/account";

/** Étape 1 de la connexion particulier : envoie un code à usage unique par e-mail. */
export async function sendClientLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const redirectTo = String(formData.get("redirectTo") ?? "/compte/tableau-de-bord");

  if (!email || !email.includes("@")) {
    redirect(`/compte/connexion?erreur=${encodeURIComponent("Adresse e-mail invalide.")}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    redirect(`/compte/connexion?erreur=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/compte/connexion?etape=code&email=${encodeURIComponent(email)}&suite=${encodeURIComponent(redirectTo)}`
  );
}

/**
 * Étape 2 : vérifie le code reçu par e-mail et ouvre la session. Crée le
 * compte "client" au passage si c'est la première connexion de cette
 * adresse (contrairement à l'espace pro, aucune fiche n'a besoin d'exister
 * au préalable).
 */
export async function verifyClientLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/compte/tableau-de-bord");

  const fail = (message: string) => {
    redirect(
      `/compte/connexion?etape=code&email=${encodeURIComponent(email)}&suite=${encodeURIComponent(redirectTo)}&erreur=${encodeURIComponent(message)}`
    );
  };

  if (!email || !code) fail("Code manquant.");

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error) fail("Code invalide ou expiré.");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) fail("Session introuvable après vérification.");

  const { error: linkError } = await linkOrCreateClientAccount(email, user!.id);
  if (linkError) {
    await supabase.auth.signOut();
    fail(linkError);
  }

  redirect(redirectTo);
}

export async function clientSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
