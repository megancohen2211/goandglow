-- Go & Glow — étape 4 : nouvelles fonctionnalités (avis avec photos,
-- fidélité, agenda avec indisponibilités, caisse, fiches clients,
-- réglages salon, messagerie identifiée par téléphone, export calendrier).
-- À exécuter après schema.sql, schema_extensions.sql et policies.sql.

-- ---------------------------------------------------------------------
-- Avis : photos avant/après (URLs Supabase Storage)
-- ---------------------------------------------------------------------
alter table reviews add column if not exists photos text[] not null default '{}'::text[];

-- Bucket public pour les photos avant/après jointes à un avis. Les envois
-- passent toujours par la clé service_role (Server Action), donc aucune
-- politique de storage.objects supplémentaire n'est nécessaire ; la
-- lecture publique est assurée par `public = true`.
insert into storage.buckets (id, name, public)
values ('avis-photos', 'avis-photos', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Messagerie : le client n'a pas de compte formel dans ce MVP, on
-- identifie une conversation par numéro de téléphone en plus du nom.
-- ---------------------------------------------------------------------
alter table chats add column if not exists client_phone text;
create index if not exists chats_salon_phone_idx on chats (salon_id, client_phone);

-- ---------------------------------------------------------------------
-- Réglages salon : acompte, délai d'annulation, rappels, fidélité.
-- ---------------------------------------------------------------------
alter table salons add column if not exists deposit_percent numeric(5,2) not null default 0;
alter table salons add column if not exists cancellation_hours int not null default 24;
alter table salons add column if not exists reminder_hours int not null default 24;
alter table salons add column if not exists loyalty_points_per_booking int not null default 0;

-- ---------------------------------------------------------------------
-- Export calendrier (iCal) : jeton d'accès au flux .ics, distinct du
-- token d'invitation. Une vraie synchro Google Calendar (OAuth) nécessite
-- des identifiants externes et n'est pas incluse dans ce MVP.
-- ---------------------------------------------------------------------
alter table salons add column if not exists calendar_token uuid not null default uuid_generate_v4();
create unique index if not exists salons_calendar_token_key on salons (calendar_token);

-- ---------------------------------------------------------------------
-- Fidélité par points (par salon + numéro de téléphone client)
-- ---------------------------------------------------------------------
create table if not exists loyalty_points (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  client_phone text not null,
  client_name text,
  points int not null default 0,
  updated_at timestamptz not null default now(),
  unique (salon_id, client_phone)
);

create table if not exists loyalty_transactions (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  client_phone text not null,
  points int not null,
  reason text not null,
  booking_id uuid references bookings(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Agenda : indisponibilités ponctuelles par membre d'équipe (en plus des
-- jours travaillés de staff_days et des fermetures exceptionnelles du
-- salon dans closures).
-- ---------------------------------------------------------------------
create table if not exists staff_unavailability (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid references staff(id) on delete cascade,
  unavailable_date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists staff_unavailability_staff_date_idx
  on staff_unavailability (staff_id, unavailable_date);

-- ---------------------------------------------------------------------
-- Fiches clients : notes libres du salon sur un client (identifié par
-- téléphone, comme les réservations).
-- ---------------------------------------------------------------------
create table if not exists client_notes (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  client_phone text not null,
  client_name text,
  note text not null,
  created_by uuid references accounts(id),
  created_at timestamptz not null default now()
);
create index if not exists client_notes_salon_phone_idx on client_notes (salon_id, client_phone);

-- ---------------------------------------------------------------------
-- Caisse : encaissements (RDV ou vente libre) et leur détail.
-- ---------------------------------------------------------------------
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  staff_id uuid references staff(id),
  booking_id uuid references bookings(id),
  client_name text,
  tip numeric(10,2) not null default 0,
  payment_method text not null default 'cb' check (payment_method in ('cb', 'especes', 'autre')),
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id),
  service_id uuid references services(id),
  label text not null,
  qty int not null default 1,
  unit_price numeric(10,2) not null
);

-- ---------------------------------------------------------------------
-- Cartes cadeaux : journal d'utilisation (une carte peut être utilisée
-- partiellement sur plusieurs réservations).
-- ---------------------------------------------------------------------
create table if not exists giftcard_redemptions (
  id uuid primary key default uuid_generate_v4(),
  giftcard_id uuid references giftcards(id) on delete cascade,
  booking_id uuid references bookings(id),
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

alter table loyalty_points enable row level security;
alter table loyalty_transactions enable row level security;
alter table staff_unavailability enable row level security;
alter table client_notes enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table giftcard_redemptions enable row level security;
