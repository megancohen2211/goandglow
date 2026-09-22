"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalonAccess } from "@/lib/auth";

const CAISSE_PATH = "/pro/tableau-de-bord/caisse";

export async function addProduct(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const qty = Math.max(0, Number(formData.get("qty") ?? 0));

  await requireSalonAccess(salonId);
  if (!name || price < 0) return;

  const admin = createAdminClient();
  await admin.from("products").insert({ salon_id: salonId, name, price, qty });
  revalidatePath(CAISSE_PATH);
}

export async function restockProduct(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const delta = Number(formData.get("delta") ?? 0);

  await requireSalonAccess(salonId);

  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("qty").eq("id", productId).maybeSingle();
  if (!product) return;

  await admin
    .from("products")
    .update({ qty: Math.max(0, product.qty + delta) })
    .eq("id", productId);

  revalidatePath(CAISSE_PATH);
}

/** Encaisse un rendez-vous existant (prestation + pourboire). */
export async function cashBooking(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const bookingId = String(formData.get("bookingId") ?? "");
  const tip = Math.max(0, Number(formData.get("tip") ?? 0));
  const paymentMethod = String(formData.get("paymentMethod") ?? "cb");

  await requireSalonAccess(salonId);

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("*, services(name)")
    .eq("id", bookingId)
    .eq("salon_id", salonId)
    .maybeSingle();
  if (!booking) return;

  const { data: sale, error } = await admin
    .from("sales")
    .insert({
      salon_id: salonId,
      staff_id: booking.staff_id,
      booking_id: bookingId,
      client_name: booking.client_name,
      tip,
      payment_method: paymentMethod,
      total: Number(booking.price) + tip,
    })
    .select("id")
    .single();

  if (!error && sale) {
    await admin.from("sale_items").insert({
      sale_id: sale.id,
      service_id: booking.service_id,
      label: booking.services?.name ?? "Prestation",
      qty: 1,
      unit_price: booking.price,
    });
  }

  revalidatePath(CAISSE_PATH);
}

/** Vente libre de produits (hors rendez-vous), avec décrément du stock. */
export async function cashFreeSale(formData: FormData) {
  const salonId = String(formData.get("salonId") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim() || null;
  const tip = Math.max(0, Number(formData.get("tip") ?? 0));
  const paymentMethod = String(formData.get("paymentMethod") ?? "cb");

  await requireSalonAccess(salonId);
  const admin = createAdminClient();

  const items: { productId: string; qty: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const qty = Number(value);
    if (qty > 0) items.push({ productId: key.slice(4), qty });
  }
  if (items.length === 0) return;

  const { data: products } = await admin
    .from("products")
    .select("*")
    .in("id", items.map((i) => i.productId));

  const productsById = new Map((products ?? []).map((p) => [p.id, p]));
  let total = tip;
  const saleItems: { product_id: string; label: string; qty: number; unit_price: number }[] = [];

  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product) continue;
    const qty = Math.min(item.qty, product.qty);
    if (qty <= 0) continue;
    total += qty * Number(product.price);
    saleItems.push({ product_id: product.id, label: product.name, qty, unit_price: product.price });
  }
  if (saleItems.length === 0) return;

  const { data: sale, error } = await admin
    .from("sales")
    .insert({ salon_id: salonId, client_name: clientName, tip, payment_method: paymentMethod, total })
    .select("id")
    .single();

  if (!error && sale) {
    await admin.from("sale_items").insert(saleItems.map((item) => ({ ...item, sale_id: sale.id })));
    for (const item of saleItems) {
      const product = productsById.get(item.product_id)!;
      await admin.from("products").update({ qty: product.qty - item.qty }).eq("id", product.id);
    }
  }

  revalidatePath(CAISSE_PATH);
}
