import Link from "next/link";

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/pro" className="text-lg font-semibold">
            Go & Glow <span className="text-white/50">pro</span>
          </Link>
          <Link href="/" className="text-sm text-white/50 hover:text-white">
            Voir le site particuliers
          </Link>
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100vh-64px)] max-w-5xl bg-paper text-ink">
        {children}
      </main>
    </div>
  );
}
