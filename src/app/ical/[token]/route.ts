import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Flux .ics en lecture seule, abonnable depuis Google Agenda / iPhone
 * ("s'abonner à partir d'une URL"). Protégé par le jeton `calendar_token`
 * du salon, distinct du token d'invitation. Une vraie synchro Google
 * Calendar (OAuth, écriture bidirectionnelle) nécessiterait des
 * identifiants Google externes et n'est pas incluse dans ce MVP.
 */
function toIcsDate(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(/:/g, "").slice(0, 6)}`;
}

function escapeIcsText(text: string) {
  return text.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const admin = createAdminClient();

  const { data: salon } = await admin
    .from("salons")
    .select("id, name")
    .eq("calendar_token", params.token)
    .maybeSingle();

  if (!salon) {
    return new NextResponse("Calendrier introuvable.", { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: bookings } = await admin
    .from("bookings")
    .select("*, services(name), staff(name)")
    .eq("salon_id", salon.id)
    .gte("booking_date", today)
    .neq("status", "cancelled")
    .order("booking_date");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Go & Glow//Agenda//FR",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(salon.name)} — Go & Glow`,
  ];

  for (const b of bookings ?? []) {
    const start = toIcsDate(b.booking_date, b.booking_time);
    const endTime = new Date(`${b.booking_date}T${b.booking_time}`);
    endTime.setMinutes(endTime.getMinutes() + b.duration_min);
    const end = toIcsDate(
      endTime.toISOString().slice(0, 10),
      endTime.toISOString().slice(11, 19)
    );
    const summary = `${b.services?.name ?? "Rendez-vous"} — ${b.client_name}`;
    const staffLine = b.staff?.name ? `Avec ${b.staff.name}. ` : "";

    lines.push(
      "BEGIN:VEVENT",
      `UID:${b.id}@goandglow.fr`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(`${staffLine}${b.price} €`)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${salon.id}.ics"`,
    },
  });
}
