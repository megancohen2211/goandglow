import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getMySalons, getProducts, getUncashedBookings, getRecentSales } from "@/lib/data/pro";
import { addProduct, restockProduct, cashBooking, cashFreeSale } from "@/lib/actions/register";
import { SalonSwitcher } from "@/components/SalonSwitcher";

interface CaissePageProps {
  searchParams: { salon?: string };
}

const PAYMENT_LABELS: Record<string, string> = { cb: "Carte", especes: "Espèces", autre: "Autre" };

export default async function CaissePage({ searchParams }: CaissePageProps) {
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
  if (!salon) redirect(`/pro/tableau-de-bord/caisse?salon=${approved[0].id}`);

  const [products, uncashedBookings, sales] = await Promise.all([
    getProducts(salon!.id),
    getUncashedBookings(salon!.id),
    getRecentSales(salon!.id),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Caisse — {salon!.name}</h1>
        {approved.length > 1 && <SalonSwitcher salons={approved} currentId={salon!.id} />}
      </div>

      <section>
        <h2 className="text-lg font-medium">Rendez-vous à encaisser</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
          {uncashedBookings.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span>
                {new Date(`${b.booking_date}T00:00:00`).toLocaleDateString("fr-FR")} — {b.client_name} — {b.price} €
              </span>
              <form action={cashBooking} className="flex items-center gap-2">
                <input type="hidden" name="salonId" value={salon!.id} />
                <input type="hidden" name="bookingId" value={b.id} />
                <input
                  type="number"
                  name="tip"
                  placeholder="Pourboire"
                  min={0}
                  step="0.01"
                  className="w-24 rounded-lg border border-line px-2 py-1"
                />
                <select name="paymentMethod" className="rounded-lg border border-line px-2 py-1">
                  <option value="cb">Carte</option>
                  <option value="especes">Espèces</option>
                  <option value="autre">Autre</option>
                </select>
                <button className="rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark">
                  Encaisser
                </button>
              </form>
            </li>
          ))}
          {uncashedBookings.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink/50">Rien à encaisser pour l&apos;instant.</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium">Produits</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {p.name} — {p.price} € — stock : {p.qty}
              </span>
              <div className="flex gap-1">
                <form action={restockProduct}>
                  <input type="hidden" name="salonId" value={salon!.id} />
                  <input type="hidden" name="productId" value={p.id} />
                  <input type="hidden" name="delta" value="1" />
                  <button className="rounded-full border border-line px-2 py-1 text-xs hover:bg-line/40">+1</button>
                </form>
                <form action={restockProduct}>
                  <input type="hidden" name="salonId" value={salon!.id} />
                  <input type="hidden" name="productId" value={p.id} />
                  <input type="hidden" name="delta" value="-1" />
                  <button className="rounded-full border border-line px-2 py-1 text-xs hover:bg-line/40">-1</button>
                </form>
              </div>
            </li>
          ))}
          {products.length === 0 && <li className="px-4 py-3 text-sm text-ink/50">Aucun produit.</li>}
        </ul>
        <form action={addProduct} className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
          <input type="hidden" name="salonId" value={salon!.id} />
          <div>
            <label className="block text-xs font-medium">Nom</label>
            <input type="text" name="name" required className="mt-1 rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium">Prix</label>
            <input type="number" name="price" min={0} step="0.01" required className="mt-1 w-24 rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium">Stock initial</label>
            <input type="number" name="qty" min={0} defaultValue={0} className="mt-1 w-24 rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <button className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            Ajouter au catalogue
          </button>
        </form>
      </section>

      {products.length > 0 && (
        <section>
          <h2 className="text-lg font-medium">Vente libre</h2>
          <form action={cashFreeSale} className="mt-3 space-y-3 rounded-2xl border border-line bg-surface p-4">
            <input type="hidden" name="salonId" value={salon!.id} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((p) => (
                <div key={p.id}>
                  <label className="block text-xs font-medium">
                    {p.name} ({p.price} €)
                  </label>
                  <input
                    type="number"
                    name={`qty_${p.id}`}
                    min={0}
                    max={p.qty}
                    defaultValue={0}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium">Client (optionnel)</label>
                <input type="text" name="clientName" className="mt-1 rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium">Pourboire</label>
                <input type="number" name="tip" min={0} step="0.01" className="mt-1 w-24 rounded-lg border border-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium">Paiement</label>
                <select name="paymentMethod" className="mt-1 rounded-lg border border-line px-3 py-2 text-sm">
                  <option value="cb">Carte</option>
                  <option value="especes">Espèces</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <button className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
                Encaisser la vente
              </button>
            </div>
          </form>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium">Encaissements récents</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
          {sales.map((sale) => (
            <li key={sale.id} className="px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  {new Date(sale.created_at).toLocaleString("fr-FR")} — {sale.client_name ?? "Client"}
                </span>
                <span className="font-medium">
                  {sale.total} € ({PAYMENT_LABELS[sale.payment_method]})
                </span>
              </div>
              <p className="mt-1 text-xs text-ink/50">
                {sale.sale_items.map((i) => `${i.label} ×${i.qty}`).join(", ")}
                {sale.tip > 0 ? ` · dont ${sale.tip} € de pourboire` : ""}
              </p>
            </li>
          ))}
          {sales.length === 0 && <li className="px-4 py-3 text-sm text-ink/50">Aucun encaissement.</li>}
        </ul>
      </section>
    </div>
  );
}
