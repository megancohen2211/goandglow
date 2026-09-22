import { createClient } from "@/lib/supabase/server";
import type {
  Booking,
  Chat,
  ChatMessage,
  ClientNote,
  Giftcard,
  OpeningHours,
  Product,
  Sale,
  SaleItem,
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

export async function getProducts(salonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("salon_id", salonId)
    .order("name");

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getUncashedBookings(salonId: string) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("salon_id", salonId)
    .lte("booking_date", today)
    .eq("status", "ok")
    .order("booking_date", { ascending: false })
    .limit(50);

  if (error) throw error;

  const { data: sales } = await supabase
    .from("sales")
    .select("booking_id")
    .eq("salon_id", salonId)
    .not("booking_id", "is", null);

  const cashedIds = new Set((sales ?? []).map((s) => s.booking_id));
  return ((bookings ?? []) as Booking[]).filter((b) => !cashedIds.has(b.id));
}

export async function getRecentSales(salonId: string, limit = 30) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as (Sale & { sale_items: SaleItem[] })[];
}

export interface SalonStats {
  periodDays: number;
  revenueBooked: number;
  revenueCashed: number;
  bookingsCount: number;
  noShowCount: number;
  noShowRate: number;
  fillRate: number | null;
}

/** Statistiques simples sur les `periodDays` derniers jours. */
export async function getSalonStats(salonId: string, periodDays = 30): Promise<SalonStats> {
  const supabase = createClient();
  const end = new Date();
  const start = new Date(end.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const [{ data: bookings }, { data: sales }, { data: hours }, { data: closures }, { data: staff }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("duration_min, price, status, booking_date")
        .eq("salon_id", salonId)
        .gte("booking_date", startDate)
        .lte("booking_date", endDate),
      supabase.from("sales").select("total").eq("salon_id", salonId).gte("created_at", start.toISOString()),
      supabase.from("opening_hours").select("*").eq("salon_id", salonId),
      supabase
        .from("closures")
        .select("closed_date")
        .eq("salon_id", salonId)
        .gte("closed_date", startDate)
        .lte("closed_date", endDate),
      supabase.from("staff").select("id").eq("salon_id", salonId),
    ]);

  const bookingRows = (bookings ?? []) as { duration_min: number; price: number; status: string; booking_date: string }[];
  const closedDates = new Set((closures ?? []).map((c) => c.closed_date));
  const hoursByWeekday = new Map((hours ?? []).map((h: OpeningHours) => [h.weekday, h]));
  const staffCount = Math.max(1, (staff ?? []).length);

  const revenueBooked = bookingRows.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + Number(b.price), 0);
  const revenueCashed = ((sales ?? []) as { total: number }[]).reduce((sum, s) => sum + Number(s.total), 0);
  const bookingsCount = bookingRows.filter((b) => b.status !== "cancelled").length;
  const noShowCount = bookingRows.filter((b) => b.status === "noshow").length;
  const noShowRate = bookingsCount > 0 ? noShowCount / bookingsCount : 0;

  const bookedMinutes = bookingRows
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.duration_min, 0);

  let capacityMinutes = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (closedDates.has(iso)) continue;
    const dayHours = hoursByWeekday.get(d.getDay());
    if (!dayHours) continue;
    const [oh, om] = dayHours.opens_at.split(":").map(Number);
    const [ch, cm] = dayHours.closes_at.split(":").map(Number);
    capacityMinutes += (ch * 60 + cm - (oh * 60 + om)) * staffCount;
  }

  return {
    periodDays,
    revenueBooked: Number(revenueBooked.toFixed(2)),
    revenueCashed: Number(revenueCashed.toFixed(2)),
    bookingsCount,
    noShowCount,
    noShowRate,
    fillRate: capacityMinutes > 0 ? bookedMinutes / capacityMinutes : null,
  };
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

export async function getWeekBookings(salonId: string, startIso: string, endIso: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("salon_id", salonId)
    .gte("booking_date", startIso)
    .lte("booking_date", endIso)
    .neq("status", "cancelled")
    .order("booking_date")
    .order("booking_time");

  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function getWeekUnavailability(salonId: string, startIso: string, endIso: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("staff_unavailability")
    .select("*, staff!inner(salon_id, name)")
    .eq("staff.salon_id", salonId)
    .gte("unavailable_date", startIso)
    .lte("unavailable_date", endIso);

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
