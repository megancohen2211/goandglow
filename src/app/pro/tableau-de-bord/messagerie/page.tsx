import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getMySalons, getChats, getChatMessages } from "@/lib/data/pro";
import { sendSalonReply } from "@/lib/actions/chats";
import { SalonSwitcher } from "@/components/SalonSwitcher";

interface MessageriePageProps {
  searchParams: { salon?: string; chat?: string };
}

const QUICK_REPLIES = [
  "Bonjour, merci pour votre message, nous revenons vers vous rapidement.",
  "Oui, nous avons de la disponibilité, souhaitez-vous réserver en ligne ?",
  "Désolé, nous sommes complets sur cette période, voulez-vous rejoindre la liste d'attente ?",
];

export default async function MessageriePage({ searchParams }: MessageriePageProps) {
  const account = await requireAccount();
  const salons = await getMySalons(account.id);
  const approved = salons.filter((s) => s.status === "approved");

  if (approved.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/10 p-6 text-ink/50">
        Aucune fiche publiée pour l&apos;instant.
      </p>
    );
  }

  const salonId = searchParams.salon ?? approved[0].id;
  const salon = approved.find((s) => s.id === salonId);
  if (!salon) redirect(`/pro/tableau-de-bord/messagerie?salon=${approved[0].id}`);

  const chats = await getChats(salon!.id);
  const activeChatId = searchParams.chat ?? chats[0]?.id;
  const messages = activeChatId ? await getChatMessages(activeChatId) : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Messagerie — {salon!.name}</h1>
        {approved.length > 1 && <SalonSwitcher salons={approved} currentId={salon!.id} />}
      </div>

      <div className="mt-6 grid grid-cols-[220px_1fr] gap-4">
        <ul className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/pro/tableau-de-bord/messagerie?salon=${salon!.id}&chat=${chat.id}`}
                className={`block px-3 py-2 text-sm hover:bg-black/5 ${
                  chat.id === activeChatId ? "bg-brand-light font-medium text-brand-dark" : ""
                }`}
              >
                {chat.client_name ?? "Client"}
                <br />
                <span className="text-xs text-ink/50">{chat.client_phone}</span>
              </Link>
            </li>
          ))}
          {chats.length === 0 && <li className="px-3 py-2 text-sm text-ink/50">Aucun message.</li>}
        </ul>

        <div className="rounded-xl border border-black/10 bg-white p-4">
          {activeChatId ? (
            <>
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                      m.sender === "salon" ? "ml-auto bg-brand text-white" : "bg-black/5 text-ink"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-4">
                {QUICK_REPLIES.map((reply) => (
                  <form key={reply} action={sendSalonReply}>
                    <input type="hidden" name="salonId" value={salon!.id} />
                    <input type="hidden" name="chatId" value={activeChatId} />
                    <input type="hidden" name="text" value={reply} />
                    <button className="rounded-full border border-black/10 px-3 py-1 text-xs hover:bg-black/5">
                      {reply.length > 40 ? `${reply.slice(0, 40)}…` : reply}
                    </button>
                  </form>
                ))}
              </div>

              <form action={sendSalonReply} className="mt-3 flex gap-2">
                <input type="hidden" name="salonId" value={salon!.id} />
                <input type="hidden" name="chatId" value={activeChatId} />
                <input
                  type="text"
                  name="text"
                  placeholder="Votre réponse..."
                  className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
                />
                <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
                  Envoyer
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-ink/50">Aucune conversation pour l&apos;instant.</p>
          )}
        </div>
      </div>
    </div>
  );
}
