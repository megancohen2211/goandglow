import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { startInvitationAcceptance, confirmInvitationAcceptance } from "@/lib/actions/invitations";

interface InvitationPageProps {
  params: { token: string };
  searchParams: { etape?: string; erreur?: string };
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const admin = createAdminClient();
  const { data: salon } = await admin
    .from("salons")
    .select("*")
    .eq("invitation_token", params.token)
    .maybeSingle();

  if (!salon) notFound();

  const alreadyUsed = salon.status !== "invited";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold">Bienvenue sur Go & Glow</h1>
      <p className="mt-2 text-ink/70">
        Go & Glow vous invite à publier la fiche de <strong>{salon.name}</strong>, sans
        commission sur vos réservations. 6 mois offerts, sans carte bancaire.
      </p>

      {alreadyUsed ? (
        <p className="mt-6 rounded-lg bg-black/5 px-4 py-3 text-sm">
          Cette invitation a déjà été utilisée. Connectez-vous depuis{" "}
          <a href="/pro/connexion" className="underline">
            l&apos;espace pro
          </a>
          .
        </p>
      ) : (
        <>
          {searchParams.erreur && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {searchParams.erreur}
            </p>
          )}

          {searchParams.etape !== "code" ? (
            <form action={startInvitationAcceptance} className="mt-6 space-y-4">
              <input type="hidden" name="token" value={params.token} />
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="accepted" className="mt-1" />
                <span>
                  J&apos;accepte les{" "}
                  <a href="/cgu" className="underline" target="_blank">
                    conditions générales d&apos;utilisation
                  </a>{" "}
                  et la{" "}
                  <a href="/confidentialite" className="underline" target="_blank">
                    politique de confidentialité
                  </a>{" "}
                  de Go & Glow.
                </span>
              </label>
              <button
                type="submit"
                className="w-full rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
              >
                Accepter et recevoir mon code
              </button>
            </form>
          ) : (
            <form action={confirmInvitationAcceptance} className="mt-6 space-y-4">
              <input type="hidden" name="token" value={params.token} />
              <div>
                <label className="block text-sm font-medium">Code reçu par e-mail</label>
                <input
                  type="text"
                  name="code"
                  inputMode="numeric"
                  required
                  autoFocus
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 tracking-widest"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
              >
                Valider et publier ma fiche
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
