// Types correspondant à supabase/schema.sql + schema_extensions.sql.
// Écrits à la main pour ce MVP ; à régénérer avec `supabase gen types`
// une fois le projet Supabase créé.

export type AccountRole = "client" | "pro" | "admin" | "owner";
export type SalonStatus = "pending" | "invited" | "approved" | "rejected" | "suspended";
export type BookingStatus = "ok" | "noshow" | "cancelled";

export interface Account {
  id: string;
  email: string;
  role: AccountRole;
  auth_user_id: string | null;
  created_at: string;
}

export interface Salon {
  id: string;
  owner_account_id: string;
  name: string;
  type: string;
  city: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  hue: number | null;
  home_service: boolean | null;
  home_fee: number | null;
  home_radius_km: number | null;
  status: SalonStatus;
  has_iban: boolean | null;
  iban_last4: string | null;
  admin_note: string | null;
  slug: string;
  city_slug: string;
  category_slug: string;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  invitation_accepted_at: string | null;
  deposit_percent: number;
  cancellation_hours: number;
  reminder_hours: number;
  loyalty_points_per_booking: number;
  calendar_token: string;
  offpeak_enabled: boolean;
  offpeak_percent: number;
  offpeak_days: number[];
  offpeak_start: string;
  offpeak_end: string;
  loyalty_reward_threshold: number;
  loyalty_reward_value: number;
  created_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  duration_min: number;
  price: number;
}

export interface Staff {
  id: string;
  salon_id: string;
  name: string;
}

export interface StaffDay {
  id: string;
  staff_id: string;
  weekday: number;
}

export interface OpeningHours {
  id: string;
  salon_id: string;
  weekday: number;
  opens_at: string;
  closes_at: string;
}

export interface Closure {
  id: string;
  salon_id: string;
  closed_date: string;
}

export interface Booking {
  id: string;
  salon_id: string;
  service_id: string;
  staff_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_account_id: string | null;
  booking_date: string;
  booking_time: string;
  duration_min: number;
  price: number;
  deposit: number | null;
  status: BookingStatus;
  source: string;
  note: string | null;
  address: string | null;
  inspiration_photo: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  salon_id: string;
  client_name: string;
  rating: number;
  text: string | null;
  reply: string | null;
  photos: string[];
  created_at: string;
}

export interface Waitlist {
  id: string;
  salon_id: string;
  service_id: string | null;
  wanted_date: string | null;
  period: string | null;
  client_name: string;
  client_phone: string | null;
  notified: boolean;
  created_at: string;
}

export interface Chat {
  id: string;
  salon_id: string;
  client_account_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender: "client" | "salon";
  text: string;
  created_at: string;
}

export interface Giftcard {
  id: string;
  salon_id: string;
  code: string;
  amount: number;
  balance: number;
  bought_for: string | null;
  created_at: string;
}

export interface GiftcardRedemption {
  id: string;
  giftcard_id: string;
  booking_id: string | null;
  amount: number;
  created_at: string;
}

export interface Product {
  id: string;
  salon_id: string;
  name: string;
  price: number;
  qty: number;
}

export interface LoyaltyPoints {
  id: string;
  salon_id: string;
  client_phone: string;
  client_name: string | null;
  points: number;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  salon_id: string;
  client_phone: string;
  points: number;
  reason: string;
  booking_id: string | null;
  created_at: string;
}

export interface StaffUnavailability {
  id: string;
  staff_id: string;
  unavailable_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at: string;
}

export interface ClientNote {
  id: string;
  salon_id: string;
  client_phone: string;
  client_name: string | null;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  salon_id: string;
  staff_id: string | null;
  booking_id: string | null;
  client_name: string | null;
  tip: number;
  payment_method: "cb" | "especes" | "autre";
  total: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  service_id: string | null;
  label: string;
  qty: number;
  unit_price: number;
}

export interface Subscription {
  id: string;
  salon_id: string;
  trial_start: string | null;
  trial_end: string | null;
  status: "trial" | "active" | "cancelled";
  tacit_renewal: boolean | null;
  created_at: string;
}

// Placeholder minimal pour satisfaire le générique attendu par
// @supabase/ssr / supabase-js. À remplacer par `supabase gen types typescript`
// une fois le projet Supabase relié.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export const CATEGORIES = [
  { slug: "coiffeur", label: "Coiffeur" },
  { slug: "barbier", label: "Barbier" },
  { slug: "ongles", label: "Onglerie" },
  { slug: "esthetique", label: "Institut de beauté" },
  { slug: "massage", label: "Massage" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

// Règle SEO : une page ville/quartier/catégorie n'est indexable qu'à
// partir de ce nombre de fiches validées ; en dessous, on la laisse en
// noindex plutôt que de publier une page vide.
export const MIN_SALONS_FOR_INDEX = 4;
