import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await requireRole(["admin", "owner"]);

  return (
    <div>
      <nav className="mb-6 flex gap-4 border-b border-line pb-4 text-sm">
        <Link href="/pro/admin" className="hover:underline">
          Fiches en attente
        </Link>
        <Link href="/pro/admin/nouveau" className="hover:underline">
          Inviter un salon
        </Link>
        {account.role === "owner" && (
          <Link href="/pro/admin/administrateurs" className="hover:underline">
            Administrateurs
          </Link>
        )}
      </nav>
      {children}
    </div>
  );
}
