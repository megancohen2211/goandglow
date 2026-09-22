import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Booking } from "@/lib/types";

interface ConfirmationPageProps {
  params: { citySlug: string; categorySlug: string; salonSlug: string };
  searchParams: { id?: string };
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  if (!searchParams.id) notFound();

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("*")
    .eq("id", searchParams.id)
    .maybeSingle<Booking>();

  if (!booking) notFound();

  const { data: salon } = await admin
    .from("salons")
    .select("loyalty_points_per_booking")
    .eq("id", booking.salon_id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-brand-dark">Réservation confirmée</h1>
      <p className="mt-3 text-ink/70">
        Rendez-vous le {new Date(`${booking.booking_date}T00:00:00`).toLocaleDateString("fr-FR")}
        {" "}à {booking.booking_time.slice(0, 5)}.
      </p>
      <p className="mt-1 text-sm text-ink/50">
        Un SMS/e-mail de confirmation sera bientôt envoyé automatiquement.
      </p>
      {salon && salon.loyalty_points_per_booking > 0 && (
        <p className="mt-3 text-sm text-brand-dark">
          Vous avez gagné {salon.loyalty_points_per_booking} point(s) de fidélité.
        </p>
      )}

      <Link
        href={`/${params.citySlug}/${params.categorySlug}/${params.salonSlug}`}
        className="mt-8 inline-block rounded-lg border border-black/10 px-5 py-2 text-sm font-medium hover:bg-black/5"
      >
        Retour à la fiche du salon
      </Link>
    </div>
  );
}
