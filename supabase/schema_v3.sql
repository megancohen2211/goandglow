-- Go & Glow — étape 6 : bons plans "heures creuses".
-- À exécuter après schema_v2.sql / policies_v2.sql.

alter table salons add column if not exists offpeak_enabled boolean not null default false;
alter table salons add column if not exists offpeak_percent numeric(5,2) not null default 15;
alter table salons add column if not exists offpeak_days int[] not null default '{1,2,3,4}'::int[];
alter table salons add column if not exists offpeak_start time not null default '09:00';
alter table salons add column if not exists offpeak_end time not null default '12:00';

-- Échange de points de fidélité contre une réduction (en plus du simple
-- affichage du solde déjà en place).
alter table salons add column if not exists loyalty_reward_threshold int not null default 100;
alter table salons add column if not exists loyalty_reward_value numeric(10,2) not null default 10;

-- Photo d'inspiration jointe à une réservation (coupe/couleur voulue).
alter table bookings add column if not exists inspiration_photo text;

insert into storage.buckets (id, name, public)
values ('inspiration-photos', 'inspiration-photos', true)
on conflict (id) do nothing;
