-- Go & Glow — étape 6 : espace de connexion pour les particuliers.
-- Contrairement au compte pro (qui doit déjà exister, créé par
-- inscription ou invitation avant la première connexion), le compte
-- client est auto-créé à la première connexion par code e-mail.
-- À exécuter après schema_v2.sql et policies_v2.sql.

alter table accounts add column if not exists full_name text;
alter table accounts add column if not exists phone text;

-- Utilisé pour rattacher automatiquement les réservations/le programme de
-- fidélité déjà faits par téléphone (avant création du compte) à un
-- compte client une fois le numéro renseigné dans le profil.
create index if not exists accounts_phone_idx on accounts (phone) where phone is not null;
