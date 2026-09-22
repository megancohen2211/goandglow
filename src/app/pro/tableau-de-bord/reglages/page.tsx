import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getMySalons } from "@/lib/data/pro";
import { updateSalonSettings, regenerateCalendarToken } from "@/lib/actions/settings";
import { SalonSwitcher } from "@/components/SalonSwitcher";

interface ReglagesPageProps {
  searchParams: { salon?: string };
}

export default async function ReglagesPage({ searchParams }: ReglagesPageProps) {
  const account = await requireAccount();
  const salons = await getMySalons(account.id);
  const approved = salons.filter((s) => s.status === "approved");

  if (approved.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-ink/50">
        Aucune fiche publiée pour l&apos;instant.
      </p>
    );
  }

  const salonId = searchParams.salon ?? approved[0].id;
  const salon = approved.find((s) => s.id === salonId);
  if (!salon) redirect(`/pro/tableau-de-bord/reglages?salon=${approved[0].id}`);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Réglages — {salon!.name}</h1>
        {approved.length > 1 && <SalonSwitcher salons={approved} currentId={salon!.id} />}
      </div>

      <form
        action={updateSalonSettings}
        className="mt-6 max-w-md space-y-5 rounded-2xl border border-line bg-surface p-5"
      >
        <input type="hidden" name="salonId" value={salon!.id} />

        <div>
          <label className="block text-sm font-medium">Acompte à la réservation (%)</label>
          <input
            type="number"
            name="depositPercent"
            min={0}
            max={100}
            defaultValue={salon!.deposit_percent}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
          {!salon!.has_iban && (
            <p className="mt-1 text-xs text-ink/50">
              Ajoutez un IBAN à votre fiche pour pouvoir encaisser un acompte (à venir avec
              Stripe Connect).
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Délai d&apos;annulation (heures)</label>
          <input
            type="number"
            name="cancellationHours"
            min={0}
            defaultValue={salon!.cancellation_hours}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Rappel avant RDV (heures)</label>
          <input
            type="number"
            name="reminderHours"
            min={0}
            defaultValue={salon!.reminder_hours}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Points de fidélité par réservation</label>
          <input
            type="number"
            name="loyaltyPointsPerBooking"
            min={0}
            defaultValue={salon!.loyalty_points_per_booking}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
          <p className="mt-1 text-xs text-ink/50">0 = programme de fidélité désactivé.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Seuil pour une récompense (points)</label>
            <input
              type="number"
              name="loyaltyRewardThreshold"
              min={1}
              defaultValue={salon!.loyalty_reward_threshold}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Valeur de la récompense (€)</label>
            <input
              type="number"
              name="loyaltyRewardValue"
              min={0}
              step="0.01"
              defaultValue={salon!.loyalty_reward_value}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            />
          </div>
        </div>
        <p className="-mt-3 text-xs text-ink/50">
          Ex. 100 points = 10 € de réduction. Le client pourra les échanger à la réservation.
        </p>

        <div className="border-t border-line pt-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="offpeakEnabled" defaultChecked={salon!.offpeak_enabled} />
            Activer les bons plans heures creuses
          </label>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium">Réduction (%)</label>
              <input
                type="number"
                name="offpeakPercent"
                min={0}
                max={100}
                defaultValue={salon!.offpeak_percent}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium">De</label>
              <input
                type="time"
                name="offpeakStart"
                defaultValue={salon!.offpeak_start?.slice(0, 5)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium">À</label>
              <input
                type="time"
                name="offpeakEnd"
                defaultValue={salon!.offpeak_end?.slice(0, 5)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((label, i) => (
              <label key={i} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  name="offpeakDays"
                  value={i}
                  defaultChecked={salon!.offpeak_days?.includes(i)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
          Enregistrer
        </button>
      </form>

      <p className="mt-4 max-w-md text-xs text-ink/40">
        L&apos;encaissement réel de l&apos;acompte et l&apos;envoi automatique des rappels
        nécessitent Stripe et un fournisseur d&apos;e-mails/SMS configurés — ces réglages sont
        prêts à être branchés dès leur intégration.
      </p>

      <section className="mt-8 max-w-md rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-lg font-medium">Synchronisation calendrier</h2>
        <p className="mt-1 text-sm text-ink/60">
          Abonnez Google Agenda ou l&apos;app Calendrier de votre téléphone à ce lien
          (lecture seule) pour voir vos rendez-vous. Une vraie synchro Google Agenda à double
          sens nécessiterait une connexion Google (à venir).
        </p>
        <input
          readOnly
          value={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/ical/${salon!.calendar_token}`}
          className="mt-3 w-full rounded-lg border border-line bg-black/5 px-3 py-2 text-xs"
        />
        <form action={regenerateCalendarToken} className="mt-3">
          <input type="hidden" name="salonId" value={salon!.id} />
          <button className="text-xs text-ink/50 hover:underline">
            Générer un nouveau lien (invalide l&apos;ancien)
          </button>
        </form>
      </section>
    </div>
  );
}
