-- Go & Glow — schéma de base (à coller dans l'éditeur SQL de Supabase)
-- Étape 1 : tables principales. Les règles de sécurité (RLS) détaillées
-- viendront à l'étape suivante, une fois l'authentification branchée.

create extension if not exists "uuid-ossp";

-- Comptes et rôles (lié à auth.users de Supabase une fois l'auth branchée)
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  role text not null default 'pro' check (role in ('client','pro','admin','owner')),
  created_at timestamptz not null default now()
);

-- Fiches salons
create table salons (
  id uuid primary key default uuid_generate_v4(),
  owner_account_id uuid references accounts(id),
  name text not null,
  type text not null,
  city text not null,
  address text,
  phone text,
  description text,
  hue int default 0,
  home_service boolean default false,
  home_fee numeric(10,2),
  home_radius_km int,
  status text not null default 'pending' check (status in ('pending','invited','approved','rejected','suspended')),
  has_iban boolean default false,
  iban_last4 text,
  admin_note text,
  created_at timestamptz not null default now()
);

-- Abonnement de chaque salon (essai gratuit, reconduction tacite)
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  trial_start timestamptz,
  trial_end timestamptz,
  status text not null default 'trial' check (status in ('trial','active','cancelled')),
  tacit_renewal boolean default true,
  created_at timestamptz not null default now()
);

-- Prestations proposées par un salon
create table services (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  name text not null,
  duration_min int not null,
  price numeric(10,2) not null
);

-- Membres de l'équipe d'un salon
create table staff (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  name text not null
);

-- Jours de travail par membre (null = tous les jours ouvrés)
create table staff_days (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid references staff(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6)
);

-- Horaires d'ouverture par jour de la semaine
create table opening_hours (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null
);

-- Fermetures exceptionnelles
create table closures (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  closed_date date not null
);

-- Rendez-vous
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id),
  service_id uuid references services(id),
  staff_id uuid references staff(id),
  client_name text not null,
  client_phone text,
  client_account_id uuid references accounts(id),
  booking_date date not null,
  booking_time time not null,
  duration_min int not null,
  price numeric(10,2) not null,
  deposit numeric(10,2) default 0,
  status text not null default 'ok' check (status in ('ok','noshow','cancelled')),
  source text not null default 'goandglow',
  note text,
  address text,
  created_at timestamptz not null default now()
);

-- Liste d'attente
create table waitlist (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id),
  service_id uuid references services(id),
  wanted_date date,
  period text,
  client_name text not null,
  client_phone text,
  notified boolean default false,
  created_at timestamptz not null default now()
);

-- Messagerie salon ↔ client
create table chats (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id),
  client_account_id uuid references accounts(id),
  client_name text,
  created_at timestamptz not null default now()
);

create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references chats(id) on delete cascade,
  sender text not null check (sender in ('client','salon')),
  text text not null,
  created_at timestamptz not null default now()
);

-- Avis clients
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id),
  client_name text not null,
  rating int not null check (rating between 1 and 5),
  text text,
  reply text,
  created_at timestamptz not null default now()
);

-- Cartes cadeaux
create table giftcards (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id),
  code text unique not null,
  amount numeric(10,2) not null,
  balance numeric(10,2) not null,
  bought_for text,
  created_at timestamptz not null default now()
);

-- Produits en vente / stock
create table products (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id),
  name text not null,
  price numeric(10,2) not null,
  qty int not null default 0
);

-- Activer la sécurité par ligne (RLS) : à affiner dès que l'authentification
-- Supabase Auth sera branchée. Pour l'instant, ça bloque tout accès par défaut.
alter table accounts enable row level security;
alter table salons enable row level security;
alter table subscriptions enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table staff_days enable row level security;
alter table opening_hours enable row level security;
alter table closures enable row level security;
alter table bookings enable row level security;
alter table waitlist enable row level security;
alter table chats enable row level security;
alter table chat_messages enable row level security;
alter table reviews enable row level security;
alter table giftcards enable row level security;
alter table products enable row level security;
