import { getCurrentAccount } from "@/lib/auth";
import { updateMyProfile } from "@/lib/actions/clientAccount";

interface ProfilPageProps {
  searchParams: { enregistre?: string; erreur?: string };
}

export default async function ProfilPage({ searchParams }: ProfilPageProps) {
  const account = await getCurrentAccount();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Mon profil</h1>

      {searchParams.enregistre && (
        <p className="mt-4 rounded-lg bg-brand-light px-4 py-3 text-sm text-brand-dark">
          Profil enregistré.
        </p>
      )}
      {searchParams.erreur && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.erreur}
        </p>
      )}

      <form action={updateMyProfile} className="mt-6 max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-medium">E-mail</label>
          <input
            type="email"
            value={account?.email ?? ""}
            disabled
            className="mt-1 w-full rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-ink/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Nom</label>
          <input
            type="text"
            name="fullName"
            defaultValue={account?.full_name ?? ""}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Téléphone</label>
          <input
            type="tel"
            name="phone"
            defaultValue={account?.phone ?? ""}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"
          />
          <p className="mt-1 text-xs text-ink/50">
            Renseigner le numéro utilisé lors de vos précédentes réservations les
            rattache automatiquement à votre compte (historique et fidélité).
          </p>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
