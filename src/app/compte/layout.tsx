import Link from "next/link";

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-brand-dark">
            Go & Glow <span className="text-ink/40">mon compte</span>
          </Link>
          <Link href="/" className="text-sm text-ink/50 hover:text-ink">
            Retour au site
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
