import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";

export default async function ComptePage() {
  const account = await getCurrentAccount();
  redirect(account ? "/compte/tableau-de-bord" : "/compte/connexion");
}
