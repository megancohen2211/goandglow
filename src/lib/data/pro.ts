import { createClient } from "@/lib/supabase/server";
import type { Booking, Giftcard, Salon, Subscription, Waitlist } from "@/lib/types";

/** Fiches possédées par le compte connecté (RLS : owner_account_id = soi-même). */
export async function getMySalons(accountId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("owner_account_id", accountId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Salon[];
}

export async function getSalonSubscription(salonId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("salon_id", salonId)
    .maybeSingle();
  return data as Subscription | null;
}

export async function getWaitlist(salonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("waitlist")
    .select("*")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Waitlist[];
}

export async function getGiftcards(salonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("giftcards")
    .select("*")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Giftcard[];
}

export async function getUpcomingBookings(salonId: string) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("salon_id", salonId)
    .gte("booking_date", today)
    .neq("status", "cancelled")
    .order("booking_date")
    .order("booking_time");

  if (error) throw error;
  return (data ?? []) as Booking[];
}
