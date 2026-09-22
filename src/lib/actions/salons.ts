"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { slugify } from "@/lib/slugify";
import { CATEGORIES } from "@/lib/types";

async function uniqueSlug(admin: ReturnType<typeof createAdminClient>, base: string) {
  const root = slugify(base) || "salon";
  let candidate = root;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await admin.from("salons").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${root}-${i++}`;
  }
}

function fail(path: string, message: string): never {
  redirect(`${path}?erreur=${encodeURIComponent(message)}`);
}

/** Circuit 1 : le salon crée lui-même sa fiche (statut "pending"). */
export async function createSalonSelfSignup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const city = String(formData.get("city") ?? "Marseille").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const homeService = formData.get("homeService") === "on";
  const homeFee = formData.get("homeFee") ? Number(formData.get("homeFee")) : null;
  const iban = String(formData.get("iban") ?? "").replace(/\s+/g, "");

  if (!email || !email.includes("@")) fail("/pro/inscription", "Adresse e-mail invalide.");
  if (!name) fail("/pro/inscription", "Le nom du salon est requis.");
  if (!CATEGORIES.some((c) => c.slug === type)) {
    fail("/pro/inscription", "Choisissez une catégorie valide.");
  }

  const admin = createAdminClient();

  const { data: existingAccount } = await admin
    .from("accounts")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  let accountId: string;
  if (existingAccount) {
    if (existingAccount.role !== "pro") {
      fail("/pro/inscription", "Cette adresse e-mail est déjà utilisée par un autre type de compte.");
    }
    accountId = existingAccount.id;
  } else {
    const { data: created, error } = await admin
      .from("accounts")
      .insert({ email, role: "pro" })
      .select("id")
      .single();
    if (error || !created) fail("/pro/inscription", "Impossible de créer le compte, réessayez.");
    accountId = created!.id;
  }

  const slug = await uniqueSlug(admin, name);

  const { data: salon, error: salonError } = await admin
    .from("salons")
    .insert({
      owner_account_id: accountId,
      name,
      type,
      city,
      address,
      phone,
      description,
      home_service: homeService,
      home_fee: homeFee,
      status: "pending",
      has_iban: iban.length >= 4,
      iban_last4: iban.length >= 4 ? iban.slice(-4) : null,
      slug,
      city_slug: slugify(city),
      category_slug: type,
    })
    .select("id")
    .single();

  if (salonError || !salon) fail("/pro/inscription", "Impossible de créer la fiche salon, réessayez.");

  const serviceRows = [0, 1, 2]
    .map((i) => ({
      name: String(formData.get(`service_name_${i}`) ?? "").trim(),
      duration_min: Number(formData.get(`service_duration_${i}`) ?? 0),
      price: Number(formData.get(`service_price_${i}`) ?? 0),
    }))
    .filter((s) => s.name && s.duration_min > 0 && s.price >= 0)
    .map((s) => ({ ...s, salon_id: salon!.id }));

  if (serviceRows.length > 0) {
    await admin.from("services").insert(serviceRows);
  }

  const staffRows = [0, 1, 2]
    .map((i) => String(formData.get(`staff_name_${i}`) ?? "").trim())
    .filter(Boolean)
    .map((staffName) => ({ salon_id: salon!.id, name: staffName }));

  if (staffRows.length > 0) {
    await admin.from("staff").insert(staffRows);
  }

  await admin.from("subscriptions").insert({
    salon_id: salon!.id,
    trial_start: new Date().toISOString(),
    trial_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: "trial",
    tacit_renewal: true,
  });

  // Confirmation immédiate par e-mail + code, comme pour une connexion pro.
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = createClient();
  await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });

  redirect(
    `/pro/connexion?etape=code&email=${encodeURIComponent(email)}&suite=${encodeURIComponent("/pro/inscription/envoyee")}`
  );
}

/** Circuit 2 : un administrateur crée la fiche pour le salon (démarchage). */
export async function createSalonInvitation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const city = String(formData.get("city") ?? "Marseille").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!email || !email.includes("@")) fail("/pro/admin/nouveau", "Adresse e-mail invalide.");
  if (!name) fail("/pro/admin/nouveau", "Le nom du salon est requis.");
  if (!CATEGORIES.some((c) => c.slug === type)) {
    fail("/pro/admin/nouveau", "Choisissez une catégorie valide.");
  }

  const admin = createAdminClient();

  const { data: existingAccount } = await admin
    .from("accounts")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  let accountId: string;
  if (existingAccount) {
    accountId = existingAccount.id;
  } else {
    const { data: created, error } = await admin
      .from("accounts")
      .insert({ email, role: "pro" })
      .select("id")
      .single();
    if (error || !created) fail("/pro/admin/nouveau", "Impossible de créer le compte, réessayez.");
    accountId = created!.id;
  }

  const slug = await uniqueSlug(admin, name);
  const token = randomUUID();

  const { error: salonError } = await admin.from("salons").insert({
    owner_account_id: accountId,
    name,
    type,
    city,
    phone,
    status: "invited",
    slug,
    city_slug: slugify(city),
    category_slug: type,
    invitation_token: token,
    invitation_sent_at: new Date().toISOString(),
  });

  if (salonError) fail("/pro/admin/nouveau", "Impossible de créer la fiche salon, réessayez.");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = `${siteUrl}/pro/invitation/${token}`;

  await sendEmail({
    to: email,
    subject: `${name} est invité sur Go & Glow`,
    text: [
      `Bonjour,`,
      ``,
      `Go & Glow vous invite à rejoindre la plateforme de réservation en ligne, sans commission.`,
      `Vous bénéficiez de 6 mois offerts, sans carte bancaire.`,
      ``,
      `Pour activer votre fiche « ${name} », rendez-vous ici : ${link}`,
      ``,
      `Vous trouverez en pièce jointe (simulée) notre politique de confidentialité et nos`,
      `conditions générales d'utilisation. En confirmant, vous les acceptez.`,
      ``,
      `L'équipe Go & Glow`,
    ].join("\n"),
  });

  redirect("/pro/admin/nouveau/envoyee");
}
