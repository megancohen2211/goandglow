import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getMySalons } from "@/lib/data/pro";
import { getSalonReviews, averageRating } from "@/lib/data/salons";
import { replyToReview } from "@/lib/actions/reviews";
import { SalonSwitcher } from "@/components/SalonSwitcher";

interface AvisPageProps {
  searchParams: { salon?: string };
}

export default async function AvisPage({ searchParams }: AvisPageProps) {
  const account = await requireAccount();
  const salons = await getMySalons(account.id);
  const approved = salons.filter((s) => s.status === "approved");

  if (approved.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/10 p-6 text-ink/50">
        Aucune fiche publiée pour l&apos;instant.
      </p>
    );
  }

  const salonId = searchParams.salon ?? approved[0].id;
  const salon = approved.find((s) => s.id === salonId);
  if (!salon) redirect(`/pro/tableau-de-bord/avis?salon=${approved[0].id}`);

  const reviews = await getSalonReviews(salon!.id);
  const avg = averageRating(reviews);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Avis — {salon!.name}</h1>
        {approved.length > 1 && <SalonSwitcher salons={approved} currentId={salon!.id} />}
      </div>

      <p className="mt-1 text-sm text-ink/50">
        {reviews.length === 0
          ? "Aucun avis pour l'instant."
          : `${avg!.toFixed(1)} / 5 · ${reviews.length} avis`}
      </p>

      <div className="mt-6 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-black/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{review.client_name}</p>
              <p className="text-sm text-ink/50">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
            </div>
            {review.text && <p className="mt-2 text-sm text-ink/80">{review.text}</p>}
            {review.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {review.photos.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="Photo avant/après" className="h-20 w-20 rounded-lg object-cover" />
                ))}
              </div>
            )}

            {review.reply ? (
              <div className="mt-3 rounded-lg bg-black/5 p-3 text-sm">
                <p className="font-medium">Votre réponse</p>
                <p className="mt-1 text-ink/70">{review.reply}</p>
              </div>
            ) : (
              <form action={replyToReview} className="mt-3 flex gap-2">
                <input type="hidden" name="reviewId" value={review.id} />
                <input type="hidden" name="salonId" value={salon!.id} />
                <input
                  type="text"
                  name="reply"
                  placeholder="Répondre à cet avis..."
                  className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
                />
                <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
                  Répondre
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
