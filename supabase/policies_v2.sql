-- Go & Glow — étape 5 : politiques RLS pour les tables ajoutées par
-- schema_v2.sql. À exécuter après schema_v2.sql (donc après policies.sql).

-- ---------------------------------------------------------------------
-- loyalty_points / loyalty_transactions — données internes au salon,
-- jamais de lecture publique directe (la consultation client passe par
-- une Server Action avec le client service_role, après saisie du
-- téléphone, comme les réservations).
-- ---------------------------------------------------------------------

create policy loyalty_points_owner_manage on loyalty_points
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

create policy loyalty_transactions_owner_read on loyalty_transactions
  for select using (owns_salon(salon_id) or is_staff());

create policy loyalty_transactions_staff_manage on loyalty_transactions
  for all using (is_staff())
  with check (is_staff());

-- ---------------------------------------------------------------------
-- staff_unavailability — lecture publique pour les salons publiés (sert
-- au calcul de disponibilité côté réservation), gestion réservée au
-- propriétaire de la fiche.
-- ---------------------------------------------------------------------

create policy staff_unavailability_public_read on staff_unavailability
  for select using (
    exists (
      select 1 from staff st join salons s on s.id = st.salon_id
      where st.id = staff_unavailability.staff_id and s.status = 'approved'
    )
  );

create policy staff_unavailability_owner_manage on staff_unavailability
  for all using (
    exists (select 1 from staff st where st.id = staff_unavailability.staff_id and (owns_salon(st.salon_id) or is_staff()))
  )
  with check (
    exists (select 1 from staff st where st.id = staff_unavailability.staff_id and (owns_salon(st.salon_id) or is_staff()))
  );

-- ---------------------------------------------------------------------
-- client_notes — strictement interne au salon.
-- ---------------------------------------------------------------------

create policy client_notes_owner_manage on client_notes
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

-- ---------------------------------------------------------------------
-- sales / sale_items — caisse, strictement interne au salon.
-- ---------------------------------------------------------------------

create policy sales_owner_manage on sales
  for all using (owns_salon(salon_id) or is_staff())
  with check (owns_salon(salon_id) or is_staff());

create policy sale_items_owner_manage on sale_items
  for all using (
    exists (select 1 from sales sa where sa.id = sale_items.sale_id and (owns_salon(sa.salon_id) or is_staff()))
  )
  with check (
    exists (select 1 from sales sa where sa.id = sale_items.sale_id and (owns_salon(sa.salon_id) or is_staff()))
  );

-- ---------------------------------------------------------------------
-- giftcard_redemptions — strictement interne au salon.
-- ---------------------------------------------------------------------

create policy giftcard_redemptions_owner_manage on giftcard_redemptions
  for all using (
    exists (select 1 from giftcards g where g.id = giftcard_redemptions.giftcard_id and (owns_salon(g.salon_id) or is_staff()))
  )
  with check (
    exists (select 1 from giftcards g where g.id = giftcard_redemptions.giftcard_id and (owns_salon(g.salon_id) or is_staff()))
  );
