import Link from "next/link";
import { getCurrentAccount } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-semibold text-brand-dark">
            Go & Glow
          </Link>
          <nav className="flex items-center gap-4 text-sm text-ink/70">
            <Link href="/">Rechercher</Link>
            <Link href="/compte" className="font-medium text-brand-dark">
              {account ? "Mon compte" : "Se connecter"}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-black/5 py-8 text-center text-xs text-ink/40">
        <p>© {new Date().getFullYear()} Go & Glow</p>
        <p className="mt-1 space-x-3">
          <Link href="/cartes-cadeaux" className="hover:underline">
            Cartes cadeaux
          </Link>
          <Link href="/pro" className="hover:underline">
            Espace pro
          </Link>
        </p>
      </footer>
    </div>
  );
}
