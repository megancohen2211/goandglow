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
   4. `supabase/schema_v2.sql` — avis avec photos (+ bucket Storage
      `avis-photos`), fidélité, indisponibilités d'agenda, caisse, fiches
      clients, réglages salon, messagerie par téléphone, jeton calendrier.
   5. `supabase/policies_v2.sql` — politiques RLS des tables de
      `schema_v2.sql`.
   6. `supabase/seed.sql` (optionnel, développement uniquement) — salons de
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

## Fonctionnalités du site particuliers

- Recherche de salons par ville/catégorie/nom, fiche salon avec prestations
  et équipe.
- Réservation en ligne (créneau, professionnel, plusieurs personnes),
  application d'un code cadeau en réduction, liste d'attente si aucun
  créneau ne convient.
- Avis clients avec photos avant/après et réponse du salon.
- Messagerie salon ↔ client, sans compte : une conversation est identifiée
  par un lien à usage personnel (`/[ville]/[categorie]/[salon]/messages/[id]`),
  à conserver pour continuer d'échanger — même logique que le lien
  d'invitation salon.
- Programme de fidélité par points (si activé par le salon), consultable
  par numéro de téléphone.
- Vérification de solde de carte cadeau (`/cartes-cadeaux`).

## Espace pro (`/pro/tableau-de-bord`)

- **Agenda** : rendez-vous à venir, blocage de créneaux par membre
  d'équipe (indisponibilités ponctuelles, en plus des fermetures
  exceptionnelles du salon).
- **Avis** : réponse aux avis clients.
- **Liste d'attente** : suivi des demandes, marquage "prévenu".
- **Cartes cadeaux** : émission et suivi des soldes.
- **Messagerie** : boîte de réception par conversation, réponses rapides
  prédéfinies, message groupé par segment (tous les clients, ou sans RDV
  depuis 60 jours).
- **Équipe & horaires** : membres d'équipe, horaires d'ouverture par jour,
  fermetures exceptionnelles.
- **Réglages** : pourcentage d'acompte, délai d'annulation, délai de
  rappel, points de fidélité par réservation, lien d'abonnement calendrier
  (.ics).
- **Clients** : fiches dérivées de l'historique de réservation (nombre de
  visites, total dépensé) avec notes libres du salon.
- **Caisse** : encaissement d'un rendez-vous (avec pourboire et moyen de
  paiement) ou vente libre de produits, avec décrément automatique du
  stock.
- **Statistiques** : CA encaissé (caisse) et prévisionnel (réservations),
  taux de remplissage estimé, taux d'absence, sur 30 jours.

## SEO

- Hiérarchie d'URL ville → catégorie → salon, rendue côté serveur (Next.js
  App Router = SSR par défaut).
- Une page catégorie/ville n'est indexée (`generateMetadata` → `robots`)
  qu'à partir de `MIN_SALONS_FOR_INDEX` fiches validées (`src/lib/types.ts`),
  sinon elle reste en `noindex` plutôt que d'être une page vide.
- Démarrage volontairement concentré sur Marseille (`src/app/(public)/page.tsx`).

## Ce qui n'est pas encore fait

- Paiement (Stripe Connect pour l'acompte, Stripe Billing pour
  l'abonnement plateforme) — prévu pour une V2. Les réglages d'acompte
  sont configurables mais non encore appliqués faute d'intégration Stripe.
- Synchronisation Google Agenda à double sens (OAuth) : remplacée pour
  l'instant par un export **iCal en lecture seule** (`/ical/[token]`,
  lien disponible dans Réglages), suffisant pour s'abonner depuis Google
  Agenda ou un téléphone, mais qui ne remonte pas les RDV pris ailleurs
  dans Go & Glow.
- E-mails/SMS transactionnels réels (confirmation de RDV, rappels avant
  RDV, notification de liste d'attente) — le module `src/lib/email.ts`
  est prêt à brancher Resend/Postmark, mais seuls les e-mails
  d'invitation salon l'utilisent pour l'instant. Les clients n'ayant
  qu'un numéro de téléphone (pas d'e-mail) dans ce MVP, les rappels
  nécessiteront un fournisseur SMS.
- Gestion du catalogue de prestations après la création de la fiche (les
  prestations se saisissent aujourd'hui uniquement à l'inscription/
  l'invitation) — seul le catalogue de **produits** a une UI de gestion
  (page Caisse).
- Simulation de réservations venant de Planity (remplacée par une vraie
  synchronisation calendrier).
- `npm audit` signale des CVE Next.js/PostCSS dont le correctif complet
  nécessite Next 16 (changement majeur) ; aucune n'est exploitable dans ce
  MVP (pas d'usage de `next/image`, pas d'hébergement Windows), mais à
  planifier avant la mise en production.
