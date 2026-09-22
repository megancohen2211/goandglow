import Link from "next/link";

export default function ProLandingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">Développez votre salon avec Go & Glow</h1>
      <p className="mt-3 text-ink/60">
        Agenda, caisse, clients et statistiques. Sans commission sur vos réservations : un
        abonnement fixe de 29 €/mois, après 1 an offert.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/pro/inscription"
          className="rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Créer ma fiche salon
        </Link>
        <Link
          href="/pro/connexion"
          className="rounded-lg border border-black/10 px-6 py-3 font-medium hover:bg-black/5"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}
