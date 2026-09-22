interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Envoi d'e-mail transactionnel. Sans RESEND_API_KEY configurée (cas par
 * défaut en développement), l'e-mail est simplement journalisé — c'est la
 * "simulation" décrite pour l'invitation salon et les codes de connexion
 * (Supabase Auth gère déjà l'envoi du code lui-même ; ce module sert aux
 * e-mails "métier" comme l'invitation admin).
 */
export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Go & Glow <bonjour@goandglow.fr>";

  if (!apiKey) {
    console.log("[email:simulé]", { to, from, subject, text });
    return { simulated: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Échec envoi e-mail (${res.status}): ${body}`);
  }

  return { simulated: false };
}
