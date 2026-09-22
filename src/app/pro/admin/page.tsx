import { getSalonsByStatus } from "@/lib/data/admin";
import { approveSalon, rejectSalon, suspendSalon } from "@/lib/actions/admin";

export default async function AdminQueuePage() {
  const [pending, invited, approved] = await Promise.all([
    getSalonsByStatus("pending"),
    getSalonsByStatus("invited"),
    getSalonsByStatus("approved"),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-xl font-semibold">
          Fiches en attente de validation ({pending.length})
        </h1>
        <div className="mt-4 space-y-3">
          {pending.length === 0 && <p className="text-ink/50">Rien à valider pour l&apos;instant.</p>}
          {pending.map((salon) => (
            <div key={salon.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{salon.name}</p>
                  <p className="text-sm text-ink/50">
                    {salon.type} · {salon.city} · {salon.phone ?? "sans téléphone"}
                  </p>
                  {salon.description && <p className="mt-1 text-sm text-ink/70">{salon.description}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={approveSalon}>
                    <input type="hidden" name="salonId" value={salon.id} />
                    <button className="rounded-full bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
                      Valider
                    </button>
                  </form>
                  <form action={rejectSalon}>
                    <input type="hidden" name="salonId" value={salon.id} />
                    <button className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-line/40">
                      Refuser
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Invitations envoyées, en attente d&apos;acceptation ({invited.length})</h2>
        <div className="mt-3 space-y-2">
          {invited.map((salon) => (
            <div key={salon.id} className="rounded-lg border border-line bg-surface px-4 py-2 text-sm">
              {salon.name} — {salon.city} — envoyée le{" "}
              {salon.invitation_sent_at
                ? new Date(salon.invitation_sent_at).toLocaleDateString("fr-FR")
                : "?"}
            </div>
          ))}
          {invited.length === 0 && <p className="text-sm text-ink/50">Aucune invitation en attente.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Fiches publiées ({approved.length})</h2>
        <div className="mt-3 space-y-2">
          {approved.map((salon) => (
            <div
              key={salon.id}
              className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-2 text-sm"
            >
              <span>
                {salon.name} — {salon.city}
              </span>
              <form action={suspendSalon}>
                <input type="hidden" name="salonId" value={salon.id} />
                <button className="text-ink/50 hover:underline">Suspendre</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
