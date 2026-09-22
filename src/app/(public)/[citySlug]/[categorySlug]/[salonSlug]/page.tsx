import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getSalonBySlug,
  getSalonServices,
  getSalonStaff,
  getSalonReviews,
  averageRating,
} from "@/lib/data/salons";
import { submitReview } from "@/lib/actions/reviews";
import { startOrContinueChat } from "@/lib/actions/chats";
import { checkLoyaltyPoints } from "@/lib/actions/loyalty";
import { createAdminClient } from "@/lib/supabase/admin";

interface SalonPageProps {
  params: { citySlug: string; categorySlug: string; salonSlug: string };
  searchParams: { erreur?: string; avis?: string; phone?: string };
}

export async function generateMetadata({ params }: SalonPageProps): Promise<Metadata> {
  const salon = await getSalonBySlug(params.citySlug, params.categorySlug, params.salonSlug);
  if (!salon) return {};
  return {
    title: salon.name,
    description: salon.description ?? `${salon.name} à ${salon.city}`,
  };
}

export default async function SalonPage({ params, searchParams }: SalonPageProps) {
  const salon = await getSalonBySlug(params.citySlug, params.categorySlug, params.salonSlug);
  if (!salon) notFound();

  const [services, staff, reviews] = await Promise.all([
    getSalonServices(salon.id),
    getSalonStaff(salon.id),
    getSalonReviews(salon.id),
  ]);
  const avg = averageRating(reviews);

  let loyaltyPoints: number | null = null;
  if (searchParams.phone && salon.loyalty_points_per_booking > 0) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("loyalty_points")
      .select("points")
      .eq("salon_id", salon.id)
      .eq("client_phone", searchParams.phone)
      .maybeSingle();
    loyaltyPoints = data?.points ?? 0;
  }

  const bookHref = `/${params.citySlug}/${params.categorySlug}/${params.salonSlug}/reserver`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{salon.name}</h1>
          <p className="text-ink/60">{salon.address ?? salon.city}</p>
          {avg !== null && (
            <p className="mt-1 text-sm text-ink/60">
              ★ {avg.toFixed(1)} / 5 · {reviews.length} avis
            </p>
          )}
        </div>
        {salon.phone && (
          <a
            href={`tel:${salon.phone}`}
            className="shrink-0 rounded-full bg-brand-light px-4 py-2 text-sm font-medium text-brand-dark"
          >
            Appeler le salon
          </a>
        )}
      </div>

      {salon.description && <p className="mt-4 text-ink/80">{salon.description}</p>}

      <div className="mt-2 flex flex-wrap gap-1 text-xs">
        {salon.offpeak_enabled && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent-ink">
            -{salon.offpeak_percent}% en heures creuses
          </span>
        )}
        {salon.home_service && (
          <span className="rounded-full bg-black/5 px-2 py-0.5">
            À domicile{salon.home_fee ? ` (+${salon.home_fee} €)` : ""}
          </span>
        )}
        {salon.has_iban && (
          <span className="rounded-full bg-black/5 px-2 py-0.5">Acompte à la réservation</span>
        )}
      </div>

      {salon.offpeak_enabled && (
        <p className="mt-2 text-xs text-ink/50">
          Bons plans : -{salon.offpeak_percent}% le{" "}
          {salon.offpeak_days
            .map((d: number) => ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"][d])
            .join(", ")}{" "}
          de {salon.offpeak_start.slice(0, 5)} à {salon.offpeak_end.slice(0, 5)}.
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-medium">Prestations</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
          {services.map((service) => (
            <li key={service.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-ink/50">{service.duration_min} min</p>
              </div>
              <p className="font-medium">{service.price} €</p>
            </li>
          ))}
          {services.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink/50">Aucune prestation renseignée.</li>
          )}
        </ul>
      </section>

      {staff.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Équipe</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {staff.map((member) => (
              <span
                key={member.id}
                className="rounded-full bg-black/5 px-3 py-1 text-sm"
              >
                {member.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <Link
        href={bookHref}
        className="mt-8 inline-block w-full rounded-full bg-brand px-5 py-3 text-center font-medium text-white hover:bg-brand-dark sm:w-auto"
      >
        Réserver un rendez-vous
      </Link>

      {salon.loyalty_points_per_booking > 0 && (
        <section id="fidelite" className="mt-12 scroll-mt-8">
          <h2 className="text-lg font-medium">Programme de fidélité</h2>
          <p className="mt-1 text-sm text-ink/60">
            {salon.loyalty_points_per_booking} point(s) gagné(s) à chaque rendez-vous.
          </p>

          <form action={checkLoyaltyPoints} className="mt-4 flex gap-2">
            <input type="hidden" name="citySlug" value={params.citySlug} />
            <input type="hidden" name="categorySlug" value={params.categorySlug} />
            <input type="hidden" name="salonSlug" value={params.salonSlug} />
            <input
              type="tel"
              name="phone"
              placeholder="Votre téléphone"
              defaultValue={searchParams.phone ?? ""}
              className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
            />
            <button className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-line/40">
              Voir mes points
            </button>
          </form>

          {loyaltyPoints !== null && (
            <p className="mt-3 rounded-2xl bg-brand-light px-4 py-3 text-sm text-brand-dark">
              Vous avez {loyaltyPoints} point(s) chez {salon.name}.
            </p>
          )}
        </section>
      )}

      <section id="contact" className="mt-12 scroll-mt-8">
        <h2 className="text-lg font-medium">Une question ?</h2>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-brand-dark">
            Contacter le salon par message
          </summary>
          <form
            action={startOrContinueChat}
            className="mt-4 space-y-3 rounded-2xl border border-line bg-surface p-4"
          >
            <input type="hidden" name="citySlug" value={params.citySlug} />
            <input type="hidden" name="categorySlug" value={params.categorySlug} />
            <input type="hidden" name="salonSlug" value={params.salonSlug} />
            <input type="hidden" name="salonId" value={salon.id} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Nom</label>
                <input
                  type="text"
                  name="clientName"
                  required
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Téléphone</label>
                <input
                  type="tel"
                  name="clientPhone"
                  required
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Message</label>
              <textarea
                name="text"
                required
                rows={3}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              />
            </div>
            <p className="text-xs text-ink/50">
              Vous recevrez un lien pour suivre la conversation ; conservez-le, il n&apos;y a pas
              de compte client dans cette version.
            </p>
            <button className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
              Envoyer le message
            </button>
          </form>
        </details>
      </section>

      <section id="avis" className="mt-12 scroll-mt-8">
        <h2 className="text-lg font-medium">Avis clients</h2>

        {searchParams.avis === "envoye" && (
          <p className="mt-3 rounded-2xl bg-brand-light px-4 py-3 text-sm text-brand-dark">
            Merci, votre avis a été publié.
          </p>
        )}
        {searchParams.erreur && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {searchParams.erreur}
          </p>
        )}

        <div className="mt-4 space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{review.client_name}</p>
                <p className="text-sm text-ink/50">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </p>
              </div>
              {review.text && <p className="mt-2 text-sm text-ink/80">{review.text}</p>}
              {review.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.photos.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt="Photo avant/après"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
              {review.reply && (
                <div className="mt-3 rounded-lg bg-black/5 p-3 text-sm">
                  <p className="font-medium">Réponse du salon</p>
                  <p className="mt-1 text-ink/70">{review.reply}</p>
                </div>
              )}
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-sm text-ink/50">Aucun avis pour l&apos;instant, soyez le premier.</p>
          )}
        </div>

        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-brand-dark">
            Laisser un avis
          </summary>
          <form
            action={submitReview}
            encType="multipart/form-data"
            className="mt-4 space-y-3 rounded-2xl border border-line bg-surface p-4"
          >
            <input type="hidden" name="citySlug" value={params.citySlug} />
            <input type="hidden" name="categorySlug" value={params.categorySlug} />
            <input type="hidden" name="salonSlug" value={params.salonSlug} />
            <input type="hidden" name="salonId" value={salon.id} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Votre nom</label>
                <input
                  type="text"
                  name="clientName"
                  required
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Note</label>
                <select
                  name="rating"
                  defaultValue={5}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Votre avis</label>
              <textarea
                name="text"
                rows={3}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Photos avant/après (optionnel)</label>
              <input
                type="file"
                name="photos"
                accept="image/*"
                multiple
                className="mt-1 w-full text-sm"
              />
            </div>

            <button
              type="submit"
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Publier mon avis
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}
