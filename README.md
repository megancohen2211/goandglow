# Go & Glow

Plateforme de réservation en ligne pour les métiers de la beauté (coiffure,
barbier, ongles, esthétique, massage), sans commission pour la plateforme :
abonnement fixe pour les salons.

Ce dépôt contient le **MVP sans paiement** : comptes (client/pro/admin/
propriétaire), fiches salons avec circuit de validation, agenda et
réservations, e-mails transactionnels simples. Stripe (acompte, facturation)
viendra dans un second temps.

## Stack

- **Next.js 14** (App Router), un seul projet pour les deux points d'entrée :
  - site particuliers : `/`, `/[ville]`, `/[ville]/[categorie]`, `/[ville]/[categorie]/[salon]`
  - espace pro + admin : `/pro/*` (à terme servi sur `pro.goandglow.fr`)
- **Supabase** (Postgres + Auth) : connexion par e-mail + code à usage
  unique (pas de mot de passe), sécurité par ligne (RLS) pour séparer les
  données par rôle et par salon.
- **Tailwind CSS** pour le style.
- E-mails transactionnels : simulés (journalisés dans la console) tant que
  `RESEND_API_KEY` n'est pas configurée — voir `src/lib/email.ts`.

## Démarrer en local

1. **Créer un projet Supabase** sur [supabase.com](https://supabase.com).
2. Dans l'éditeur SQL du projet, exécuter dans l'ordre :
   1. `supabase/schema.sql` — tables de base.
   2. `supabase/schema_extensions.sql` — colonnes d'authentification et de
      référencement (slugs, invitation).
   3. `supabase/policies.sql` — fonctions utilitaires et politiques RLS.
   4. `supabase/seed.sql` (optionnel, développement uniquement) — salons de
      démonstration à Marseille.
3. Copier `.env.example` vers `.env.local` et renseigner :
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project
     Settings → API).
   - `SUPABASE_SERVICE_ROLE_KEY` (même page — **ne jamais** exposer côté
     client, uniquement utilisée dans les Server Actions).
4. Dans Supabase Auth, activer la connexion par e-mail avec **OTP / code à
   6 chiffres** (Authentication → Providers → Email → décocher "Confirm
   email" magic link si besoin, le template par défaut envoie déjà un code).
5. Si vous avez exécuté `seed.sql`, reliez le compte propriétaire à un vrai
   utilisateur Supabase Auth une fois que vous vous êtes connecté une
   première fois : `update accounts set auth_user_id = '...' where email = '...'`.
6. `npm install`
7. `npm run dev` puis ouvrir http://localhost:3000

## Structure

```
src/app/(public)/...          site particuliers (recherche, fiche salon, réservation)
src/app/pro/...               espace pro (connexion, inscription, tableau de bord)
src/app/pro/admin/...         espace admin (validation des fiches, invitations, propriétaires)
src/lib/supabase/             clients Supabase (server/browser/service_role)
src/lib/actions/              Server Actions (auth, salons, réservations, admin)
src/lib/data/                 requêtes de lecture (recherche publique, pro, admin)
supabase/                     schéma SQL, politiques RLS, données de démo
```

## Rôles et circuits de validation

- **Client** : pas de compte formel dans ce MVP (nom + téléphone à la
  réservation).
- **Pro** : connexion par e-mail + code. Deux façons de créer une fiche :
  1. **Auto-inscription** (`/pro/inscription`) : la fiche part au statut
     `pending`, à valider par un admin avant publication.
  2. **Invitation admin** (`/pro/admin/nouveau`) : la fiche part au statut
     `invited`, invisible du public. Le salon reçoit un e-mail avec un lien
     `/pro/invitation/[token]` ; en acceptant les CGU et en confirmant son
     e-mail par code, sa fiche passe directement à `approved`.
- **Admin** : valide/refuse/suspend les fiches `pending`, peut créer des
  invitations.
- **Owner** (propriétaire) : seul rôle pouvant ajouter/retirer des
  administrateurs (`/pro/admin/administrateurs`). Un déclencheur SQL
  (`guard_last_owner_trigger`) empêche de supprimer ou rétrograder le
  dernier compte `owner`.

## SEO

- Hiérarchie d'URL ville → catégorie → salon, rendue côté serveur (Next.js
  App Router = SSR par défaut).
- Une page catégorie/ville n'est indexée (`generateMetadata` → `robots`)
  qu'à partir de `MIN_SALONS_FOR_INDEX` fiches validées (`src/lib/types.ts`),
  sinon elle reste en `noindex` plutôt que d'être une page vide.
- Démarrage volontairement concentré sur Marseille (`src/app/(public)/page.tsx`).

## Ce qui n'est pas encore fait

- Paiement (Stripe Connect pour l'acompte, Stripe Billing pour
  l'abonnement plateforme) — prévu pour une V2.
- Messagerie client ↔ salon, avis clients, cartes cadeaux, fidélité, liste
  d'attente : tables déjà prêtes côté schéma (RLS incluse), UI à construire.
- Caisse, statistiques, synchronisation Google Agenda/iCal.
- E-mails transactionnels réels (confirmation de RDV, rappels) — le module
  `src/lib/email.ts` est prêt à brancher Resend/Postmark, mais seuls les
  e-mails d'invitation salon l'utilisent pour l'instant.
- `npm audit` signale des CVE Next.js/PostCSS dont le correctif complet
  nécessite Next 16 (changement majeur) ; aucune n'est exploitable dans ce
  MVP (pas d'usage de `next/image`, pas d'hébergement Windows), mais à
  planifier avant la mise en production.
