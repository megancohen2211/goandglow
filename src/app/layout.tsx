import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Go & Glow — Réservez votre rendez-vous beauté",
    template: "%s · Go & Glow",
  },
  description:
    "Go & Glow, la réservation en ligne pour les salons de coiffure, barbiers, instituts, ongleries et masseurs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
