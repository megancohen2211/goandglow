import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendClientMessage } from "@/lib/actions/chats";
import type { Chat, ChatMessage } from "@/lib/types";

interface ChatThreadPageProps {
  params: { citySlug: string; categorySlug: string; salonSlug: string; chatId: string };
}

export default async function ChatThreadPage({ params }: ChatThreadPageProps) {
  const admin = createAdminClient();

  const { data: chat } = await admin
    .from("chats")
    .select("*")
    .eq("id", params.chatId)
    .maybeSingle<Chat>();

  if (!chat) notFound();

  const { data: messages } = await admin
    .from("chat_messages")
    .select("*")
    .eq("chat_id", params.chatId)
    .order("created_at")
    .returns<ChatMessage[]>();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-semibold">Votre conversation</h1>
      <p className="mt-1 text-sm text-ink/50">
        Gardez ce lien pour continuer d&apos;échanger avec le salon.
      </p>

      <div className="mt-6 space-y-3">
        {(messages ?? []).map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
              m.sender === "client" ? "ml-auto bg-brand text-white" : "bg-black/5 text-ink"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form
        action={sendClientMessage}
        className="mt-6 flex gap-2 border-t border-black/5 pt-4"
      >
        <input type="hidden" name="citySlug" value={params.citySlug} />
        <input type="hidden" name="categorySlug" value={params.categorySlug} />
        <input type="hidden" name="salonSlug" value={params.salonSlug} />
        <input type="hidden" name="chatId" value={params.chatId} />
        <input
          type="text"
          name="text"
          required
          placeholder="Votre message..."
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Envoyer
        </button>
      </form>
    </div>
  );
}
