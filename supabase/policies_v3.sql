-- Go & Glow — étape 7 : politique RLS pour l'espace particulier.
-- La lecture/écriture du profil (accounts_select_own / accounts_update_own)
-- et la lecture des réservations liées à un compte (bookings_client_read_own)
-- existent déjà dans policies.sql ; il ne manque que le droit d'annulation.
-- À exécuter après schema_v3.sql.

create policy bookings_client_cancel_own on bookings
  for update using (
    client_account_id is not null and client_account_id = current_account_id()
  )
  with check (client_account_id = current_account_id());
