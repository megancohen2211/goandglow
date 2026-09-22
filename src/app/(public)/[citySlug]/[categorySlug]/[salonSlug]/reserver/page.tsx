import { notFound } from "next/navigation";
import { getSalonBySlug, getSalonServices, getSalonStaff } from "@/lib/data/salons";
import { createBooking } from "@/lib/actions/bookings";
import { joinWaitlist } from "@/lib/actions/waitlist";

interface ReserverPageProps {
  params: { citySlug: string; categorySlug: string; salonSlug: string };
  searchParams: { erreur?: string; "liste-attente"?: string };
}

export default async function ReserverPage({ params, searchParams }: ReserverPageProps) {
  const salon = await getSalonBySlug(params.citySlug, params.categorySlug, params.salonSlug);
  if (!salon) notFound();

  const [services, staff] = await Promise.all([
    getSalonServices(salon.id),
    getSalonStaff(salon.id),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Réserver chez {salon.name}</h1>

      {searchParams.erreur && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.erreur}
        </p>
      )}

      <form action={createBooking} className="mt-6 space-y-5">
        <input type="hidden" name="citySlug" value={params.citySlug} />
        <input type="hidden" name="categorySlug" value={params.categorySlug} />
        <input type="hidden" name="salonSlug" value={params.salonSlug} />
        <input type="hidden" name="salonId" value={salon.id} />

        <div>
          <label className="block text-sm font-medium">Prestation</label>
          <select name="serviceId" required className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2">
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.duration_min} min — {s.price} €
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Professionnel</label>
          <select name="staffId" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2">
            <option value="">Peu importe</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              name="date"
              required
              min={today}
              defaultValue={today}
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Heure</label>
            <input
              type="time"
              name="time"
              required
              defaultValue="10:00"
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Nombre de personnes</label>
          <select name="peopleCount" defaultValue={1} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2">
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink/50">
            Réserver pour plusieurs personnes crée des créneaux à la suite avec le même
            professionnel. Ne renseignez que le nombre de personnes choisi ci-dessus.
          </p>
        </div>

        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Nom {i > 0 ? `— personne ${i + 1}` : ""}
              </label>
              <input
                type="text"
                name={`name_${i}`}
                required={i === 0}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Téléphone</label>
              <input
                type="tel"
                name={`phone_${i}`}
                required={i === 0}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium">Code cadeau (optionnel)</label>
          <input
            type="text"
            name="giftcardCode"
            placeholder="ex. A1B2C3D4"
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 uppercase"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Confirmer la réservation
        </button>
      </form>

      <section className="mt-10 border-t border-black/5 pt-8">
        <h2 className="text-lg font-medium">Aucun créneau ne convient ?</h2>
        <p className="mt-1 text-sm text-ink/60">
          Laissez vos coordonnées, le salon vous préviendra si une place se libère.
        </p>

        {searchParams["liste-attente"] === "envoyee" && (
          <p className="mt-3 rounded-lg bg-brand-light px-4 py-3 text-sm text-brand-dark">
            C&apos;est noté, le salon vous contactera si un créneau se libère.
          </p>
        )}

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-brand-dark">
            Rejoindre la liste d&apos;attente
          </summary>
          <form action={joinWaitlist} className="mt-4 space-y-4 rounded-xl border border-black/10 bg-white p-4">
            <input type="hidden" name="citySlug" value={params.citySlug} />
            <input type="hidden" name="categorySlug" value={params.categorySlug} />
            <input type="hidden" name="salonSlug" value={params.salonSlug} />
            <input type="hidden" name="salonId" value={salon.id} />

            <div>
              <label className="block text-sm font-medium">Prestation souhaitée</label>
              <select name="serviceId" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2">
                <option value="">Peu importe</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Date souhaitée</label>
                <input
                  type="date"
                  name="wantedDate"
                  min={today}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Période</label>
                <input
                  type="text"
                  name="period"
                  placeholder="ex. samedi matin"
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Nom</label>
                <input
                  type="text"
                  name="clientName"
                  required
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Téléphone</label>
                <input
                  type="tel"
                  name="clientPhone"
                  required
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg border border-black/10 px-5 py-2.5 text-sm font-medium hover:bg-black/5"
            >
              Rejoindre la liste d&apos;attente
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}
