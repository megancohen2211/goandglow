-- Go & Glow — étape 2 : colonnes nécessaires pour brancher l'authentification
-- Supabase (connexion par e-mail + code) et le référencement (URLs
-- ville / quartier / catégorie / salon). À exécuter après schema.sql.

-- Lien entre une fiche "accounts" et l'utilisateur Supabase Auth
-- correspondant. Reste null tant que la personne n'a pas confirmé son
-- e-mail par code (compte pré-créé par un admin en attente d'acceptation).
alter table accounts add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

-- URLs lisibles et stables : /{city_slug}/{category_slug}/{slug}
alter table salons add column if not exists slug text;
alter table salons add column if not exists city_slug text;
alter table salons add column if not exists category_slug text;

-- Circuit d'invitation par un administrateur (démarchage) : lien à
-- usage unique envoyé par e-mail, distinct du code de connexion.
alter table salons add column if not exists invitation_token uuid;
alter table salons add column if not exists invitation_sent_at timestamptz;
alter table salons add column if not exists invitation_accepted_at timestamptz;

alter table salons alter column owner_account_id set not null;

update salons set slug = id::text where slug is null;
update salons set city_slug = lower(city) where city_slug is null;
update salons set category_slug = lower(type) where category_slug is null;

alter table salons alter column slug set not null;
alter table salons alter column city_slug set not null;
alter table salons alter column category_slug set not null;

create unique index if not exists salons_slug_key on salons (slug);
create unique index if not exists salons_invitation_token_key on salons (invitation_token) where invitation_token is not null;
create index if not exists salons_city_category_status_idx on salons (city_slug, category_slug, status);

-- Une fiche encore "pending"/"invited" ne doit jamais apparaître dans les
-- résultats publics : seul "approved" (et éventuellement "suspended" pour
-- l'historique interne) sort du champ des politiques publiques ci-dessous.
