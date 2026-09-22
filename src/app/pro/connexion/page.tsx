import { sendLoginCode, verifyLoginCode } from "@/lib/actions/auth";

interface ConnexionPageProps {
  searchParams: { etape?: string; email?: string; suite?: string; erreur?: string };
}

export default function ConnexionPage({ searchParams }: ConnexionPageProps) {
  const redirectTo = searchParams.suite || "/pro/tableau-de-bord";
  const isCodeStep = searchParams.etape === "code" && searchParams.email;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">Connexion pro</h1>
      <p className="mt-2 text-sm text-ink/60">
        Pas de mot de passe : un code à usage unique vous est envoyé par e-mail.
      </p>

      {searchParams.erreur && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.erreur}
        </p>
      )}

      {!isCodeStep ? (
        <form action={sendLoginCode} className="mt-6 space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div>
            <label className="block text-sm font-medium">E-mail</label>
            <input
              type="email"
              name="email"
              required
              autoFocus
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
          >
            Recevoir mon code
          </button>
        </form>
      ) : (
        <form action={verifyLoginCode} className="mt-6 space-y-4">
          <input type="hidden" name="email" value={searchParams.email} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <p className="text-sm text-ink/60">
            Code envoyé à <strong>{searchParams.email}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium">Code reçu par e-mail</label>
            <input
              type="text"
              name="code"
              inputMode="numeric"
              required
              autoFocus
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 tracking-widest"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
          >
            Valider et me connecter
          </button>
        </form>
      )}
    </div>
  );
}
