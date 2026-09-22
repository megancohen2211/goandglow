import { createClient } from "@/lib/supabase/server";
import type {
  Booking,
  Chat,
  ChatMessage,
  ClientNote,
  Giftcard,
  Salon,
  StaffUnavailability,
  Subscription,
  Waitlist,
} from "@/lib/types";

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

export async function getChats(salonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Chat[];
}

export async function getChatMessages(chatId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at");

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export interface ClientSummary {
  phone: string;
  name: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
}

/** Fiches clients dérivées des réservations (pas de compte client formel dans ce MVP). */
export async function getClients(salonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("client_name, client_phone, booking_date, price, status")
    .eq("salon_id", salonId)
    .order("booking_date", { ascending: false });

  if (error) throw error;

  const byPhone = new Map<string, ClientSummary>();
  for (const b of (data ?? []) as Pick<Booking, "client_name" | "client_phone" | "booking_date" | "price" | "status">[]) {
    if (!b.client_phone) continue;
    const existing = byPhone.get(b.client_phone);
    if (existing) {
      existing.visits += 1;
      if (b.status !== "cancelled") existing.totalSpent += Number(b.price);
      if (b.booking_date > existing.lastVisit) existing.lastVisit = b.booking_date;
    } else {
      byPhone.set(b.client_phone, {
        phone: b.client_phone,
        name: b.client_name,
        visits: 1,
        totalSpent: b.status !== "cancelled" ? Number(b.price) : 0,
        lastVisit: b.booking_date,
      });
    }
  }

  return Array.from(byPhone.values()).sort((a, b) => (a.lastVisit < b.lastVisit ? 1 : -1));
}

export async function getClientBookings(salonId: string, clientPhone: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("salon_id", salonId)
    .eq("client_phone", clientPhone)
    .order("booking_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function getClientNotes(salonId: string, clientPhone: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_notes")
    .select("*")
    .eq("salon_id", salonId)
    .eq("client_phone", clientPhone)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClientNote[];
}

export async function getUpcomingUnavailability(salonId: string) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("staff_unavailability")
    .select("*, staff!inner(salon_id, name)")
    .eq("staff.salon_id", salonId)
    .gte("unavailable_date", today)
    .order("unavailable_date");

  if (error) throw error;
  return (data ?? []) as (StaffUnavailability & { staff: { name: string } })[];
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
