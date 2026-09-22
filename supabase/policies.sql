-- Go & Glow — étape 3 : fonctions utilitaires + politiques RLS.
-- À exécuter après schema.sql et schema_extensions.sql.

-- ---------------------------------------------------------------------
-- Fonctions utilitaires (SECURITY DEFINER pour lire "accounts" malgré RLS)
-- ---------------------------------------------------------------------

create or replace function current_account_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from accounts where auth_user_id = auth.uid()
$$;

create or replace function current_account_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from accounts where auth_user_id = auth.uid()
$$;

create or replace function is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(current_account_role() in ('admin', 'owner'), false)
$$;

create or replace function owns_salon(target_salon_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from salons
    where id = target_salon_id
      and owner_account_id = current_account_id()
  )
$$;

-- ---------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------

create policy accounts_select_own on accounts
  for select using (auth_user_id = auth.uid() or is_staff());

create policy accounts_update_own on accounts
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy accounts_staff_manage on accounts
  for all using (is_staff())
  with check (is_staff());

-- ---------------------------------------------------------------------
-- salons
-- ---------------------------------------------------------------------

create policy salons_public_read_approved on salons
  for select using (status = 'approved');

create policy salons_owner_read on salons
  for select using (owner_account_id = current_account_id());

create policy salons_staff_read on salons
  for select using (is_staff());

create policy salons_owner_update on salons
  for update using (owner_account_id = current_account_id())
  with check (owner_account_id = current_account_id());

create policy salons_staff_manage on salons
  for all using (is_staff())
  with check (is_staff());

-- ---------------------------------------------------------------------
-- subscriptions (lecture par le salon propriétaire, écriture réservée au staff)
-- ---------------------------------------------------------------------

create policy subscriptions_owner_read on subscriptions
  for select using (owns_salon(salon_id) or is_staff());

create policy subscriptions_staff_manage on subscriptions
  for all using (is_staff())
  with check (is_staff());

-- ---------------------------------------------------------------------
-- services / staff / staff_days / opening_hours / closures / products
-- Lecture publique uniquement pour les salons publiés (page salon publique),
-- gestion réservée au propriétaire de la fiche.
-- ---------------------------------------------------------------------

create policy services_public_read on services
  for select using (
    exists (select 1 from salons s where s.id = services.salon_id and s.status = 'approved')
  );
create policy services_owner_manage on services
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

create policy staff_public_read on staff
  for select using (
    exists (select 1 from salons s where s.id = staff.salon_id and s.status = 'approved')
  );
create policy staff_owner_manage on staff
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

create policy staff_days_public_read on staff_days
  for select using (
    exists (
      select 1 from staff st join salons s on s.id = st.salon_id
      where st.id = staff_days.staff_id and s.status = 'approved'
    )
  );
create policy staff_days_owner_manage on staff_days
  for all using (
    exists (select 1 from staff st where st.id = staff_days.staff_id and (owns_salon(st.salon_id) or is_staff()))
  )
  with check (
    exists (select 1 from staff st where st.id = staff_days.staff_id and (owns_salon(st.salon_id) or is_staff()))
  );

create policy opening_hours_public_read on opening_hours
  for select using (
    exists (select 1 from salons s where s.id = opening_hours.salon_id and s.status = 'approved')
  );
create policy opening_hours_owner_manage on opening_hours
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

create policy closures_public_read on closures
  for select using (
    exists (select 1 from salons s where s.id = closures.salon_id and s.status = 'approved')
  );
create policy closures_owner_manage on closures
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

create policy products_public_read on products
  for select using (
    exists (select 1 from salons s where s.id = products.salon_id and s.status = 'approved')
  );
create policy products_owner_manage on products
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

-- ---------------------------------------------------------------------
-- bookings — créées uniquement via les server actions (clé service_role,
-- qui contourne RLS après validation applicative). Ici on protège la
-- lecture/écriture directe côté client au strict nécessaire.
-- ---------------------------------------------------------------------

create policy bookings_owner_read on bookings
  for select using (owns_salon(salon_id) or is_staff());

create policy bookings_owner_manage on bookings
  for update using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

create policy bookings_client_read_own on bookings
  for select using (
    client_account_id is not null and client_account_id = current_account_id()
  );

-- ---------------------------------------------------------------------
-- waitlist / chats / chat_messages / reviews / giftcards
-- Fonctionnalités hors périmètre du MVP immédiat : on réserve la lecture
-- et l'écriture au propriétaire de la fiche et au staff pour l'instant.
-- ---------------------------------------------------------------------

create policy waitlist_owner_manage on waitlist
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

create policy chats_owner_manage on chats
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

create policy chat_messages_owner_manage on chat_messages
  for all using (
    exists (select 1 from chats c where c.id = chat_messages.chat_id and (owns_salon(c.salon_id) or is_staff()))
  )
  with check (
    exists (select 1 from chats c where c.id = chat_messages.chat_id and (owns_salon(c.salon_id) or is_staff()))
  );

create policy reviews_public_read on reviews
  for select using (
    exists (select 1 from salons s where s.id = reviews.salon_id and s.status = 'approved')
  );
create policy reviews_owner_manage on reviews
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

create policy giftcards_owner_manage on giftcards
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

-- ---------------------------------------------------------------------
-- Garde-fou : il doit toujours rester au moins un compte "owner".
-- ---------------------------------------------------------------------

create or replace function guard_last_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE' and old.role = 'owner') or
     (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    if (select count(*) from accounts where role = 'owner' and id <> old.id) = 0 then
      raise exception 'Il doit toujours rester au moins un propriétaire (owner).';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_last_owner_trigger on accounts;
create trigger guard_last_owner_trigger
  before update or delete on accounts
  for each row execute function guard_last_owner();
