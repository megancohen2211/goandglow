-- Go & Glow — données de démonstration (Marseille) pour le développement.
-- Ne PAS exécuter sur un projet Supabase de production.

-- Compte propriétaire de la plateforme (à relier ensuite à un utilisateur
-- Supabase Auth réel : update accounts set auth_user_id = '...' where email = '...')
insert into accounts (id, email, role)
values ('00000000-0000-0000-0000-000000000001', 'rubenco26@icloud.com', 'owner')
on conflict (email) do nothing;

-- Un salon "propriétaire" fictif pour rattacher les fiches de démo
insert into accounts (id, email, role)
values ('00000000-0000-0000-0000-000000000002', 'demo-salon@goandglow.fr', 'pro')
on conflict (email) do nothing;

insert into salons (
  id, owner_account_id, name, type, city, address, phone, description,
  home_service, status, has_iban, slug, city_slug, category_slug
) values
  (
    '00000000-0000-0000-0000-0000000000a1',
    '00000000-0000-0000-0000-000000000002',
    'Salon Lumière', 'coiffeur', 'Marseille', '12 rue Paradis, 13001 Marseille',
    '0491000001', 'Coiffure femme & homme dans le centre-ville de Marseille.',
    false, 'approved', true, 'salon-lumiere', 'marseille', 'coiffeur'
  ),
  (
    '00000000-0000-0000-0000-0000000000a2',
    '00000000-0000-0000-0000-000000000002',
    'Barber Cannebière', 'barbier', 'Marseille', '45 la Canebière, 13001 Marseille',
    '0491000002', 'Barbier traditionnel, taille de barbe et coupe homme.',
    false, 'approved', false, 'barber-canebiere', 'marseille', 'barbier'
  ),
  (
    '00000000-0000-0000-0000-0000000000a3',
    '00000000-0000-0000-0000-000000000002',
    'Ongles du Vieux-Port', 'ongles', 'Marseille', '3 quai du Port, 13002 Marseille',
    '0491000003', 'Manucure, pose de gel et nail art.',
    true, 'approved', true, 'ongles-vieux-port', 'marseille', 'ongles'
  ),
  (
    '00000000-0000-0000-0000-0000000000a4',
    '00000000-0000-0000-0000-000000000002',
    'Institut Prado Beauté', 'esthetique', 'Marseille', '80 avenue du Prado, 13008 Marseille',
    '0491000004', 'Soins du visage, épilation, massages relaxants.',
    false, 'approved', true, 'institut-prado-beaute', 'marseille', 'esthetique'
  ),
  (
    '00000000-0000-0000-0000-0000000000a5',
    '00000000-0000-0000-0000-000000000002',
    'Nouvelle Fiche en attente', 'coiffeur', 'Marseille', '10 rue Sainte, 13001 Marseille',
    '0491000005', 'Fiche créée par le salon lui-même, en attente de validation admin.',
    false, 'pending', false, 'nouvelle-fiche-en-attente', 'marseille', 'coiffeur'
  )
on conflict (id) do nothing;

insert into services (salon_id, name, duration_min, price)
select v.salon_id, v.name, v.duration_min, v.price
from (values
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'Coupe femme', 45, 38::numeric),
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'Coupe homme', 30, 25::numeric),
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'Balayage', 120, 95::numeric),
  ('00000000-0000-0000-0000-0000000000a2'::uuid, 'Coupe + barbe', 40, 30::numeric),
  ('00000000-0000-0000-0000-0000000000a3'::uuid, 'Pose gel', 60, 40::numeric),
  ('00000000-0000-0000-0000-0000000000a4'::uuid, 'Soin du visage', 50, 55::numeric)
) as v(salon_id, name, duration_min, price)
where not exists (
  select 1 from services sv where sv.salon_id = v.salon_id and sv.name = v.name
);

insert into staff (id, salon_id, name) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'Camille'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1', 'Sofiane'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000a2', 'Karim'),
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000a3', 'Lina'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000a4', 'Julie')
on conflict (id) do nothing;

insert into opening_hours (salon_id, weekday, opens_at, closes_at)
select s.id, wd, '09:00', '19:00'
from salons s, generate_series(1, 6) as wd
where s.status = 'approved'
  and not exists (
    select 1 from opening_hours oh where oh.salon_id = s.id and oh.weekday = wd
  );

insert into subscriptions (salon_id, trial_start, trial_end, status)
select id, now(), now() + interval '365 days', 'trial' from salons s
where not exists (select 1 from subscriptions sub where sub.salon_id = s.id);
