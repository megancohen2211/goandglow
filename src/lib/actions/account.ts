import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Account } from "@/lib/types";

/**
 * Relie (ou refuse) le compte "accounts" correspondant à l'e-mail qui
 * vient de vérifier son code à usage unique. Utilise la clé service_role
 * car la ligne "accounts" n'a pas encore de auth_user_id à ce stade (RLS
 * la rendrait invisible/non modifiable via le client normal).
 */
export async function linkAccountToAuthUser(
  email: string,
  authUserId: string
): Promise<{ account: Account | null; error?: string }> {
  const admin = createAdminClient();

  const { data: account, error } = await admin
    .from("accounts")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) return { account: null, error: error.message };
  if (!account) {
    return {
      account: null,
      error: "Aucun compte pro n'existe pour cette adresse. Créez d'abord votre fiche salon.",
    };
  }

  if (!account.auth_user_id) {
    const { data: updated, error: updateError } = await admin
      .from("accounts")
      .update({ auth_user_id: authUserId })
      .eq("id", account.id)
      .select("*")
      .single();

    if (updateError) return { account: null, error: updateError.message };
    return { account: updated as Account };
  }

  if (account.auth_user_id !== authUserId) {
    return { account: null, error: "Ce compte est déjà lié à une autre connexion." };
  }

  return { account: account as Account };
}

/**
 * Équivalent client de `linkAccountToAuthUser` : contrairement au compte
 * pro (qui doit déjà exister via inscription/invitation), le compte
 * particulier est créé automatiquement à la première connexion.
 */
export async function linkOrCreateClientAccount(
  email: string,
  authUserId: string
): Promise<{ account: Account | null; error?: string }> {
  const admin = createAdminClient();

  const { data: account, error } = await admin
    .from("accounts")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) return { account: null, error: error.message };

  if (!account) {
    const { data: created, error: insertError } = await admin
      .from("accounts")
      .insert({ email, role: "client", auth_user_id: authUserId })
      .select("*")
      .single();

    if (insertError) return { account: null, error: insertError.message };
    return { account: created as Account };
  }

  if (!account.auth_user_id) {
    const { data: updated, error: updateError } = await admin
      .from("accounts")
      .update({ auth_user_id: authUserId })
      .eq("id", account.id)
      .select("*")
      .single();

    if (updateError) return { account: null, error: updateError.message };
    return { account: updated as Account };
  }

  if (account.auth_user_id !== authUserId) {
    return { account: null, error: "Ce compte est déjà lié à une autre connexion." };
  }

  return { account: account as Account };
}
