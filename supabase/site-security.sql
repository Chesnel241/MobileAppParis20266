-- ============================================================================
--  Fermeture des données personnelles du site de la convention
-- ============================================================================
--
--  Constat (22 juillet 2026) : la table « inscriptions » était lisible par
--  n'importe quel internaute. Le site interroge Supabase directement depuis le
--  navigateur avec sa clé publiable, laquelle est écrite en clair dans son
--  JavaScript ; il suffisait de la reprendre pour obtenir nom, e-mail,
--  téléphone, ville et adresse d'hébergement des 173 inscrits.
--
--  Principe retenu : un anonyme peut S'INSCRIRE, il ne peut rien LIRE.
--  La lecture et la modification sont réservées aux administrateurs déclarés,
--  identifiés par une table dédiée — et non par le simple fait d'avoir un compte.
--
--  À exécuter dans Supabase ▸ SQL Editor. Le script est ré-exécutable sans
--  risque : il ne détruit aucune donnée.
--
--  ⚠️ L'ÉTAPE 4 est obligatoire : sans elle, plus personne ne lit les
--     inscriptions, y compris vous. Ne fermez pas l'éditeur avant de l'avoir
--     exécutée et vérifiée.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Qui est administrateur
-- ----------------------------------------------------------------------------
-- Être authentifié ne suffit pas : il faut être inscrit ici. C'est la seule
-- source de vérité, partagée par le site et par l'application mobile.

create table if not exists public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  label      text,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

-- Aucune policy en lecture : personne n'interroge cette table depuis un
-- navigateur. Le site passe par la fonction ci-dessous, l'application mobile
-- par sa clé service_role côté serveur.
drop policy if exists app_admins_self_read on public.app_admins;
create policy app_admins_self_read on public.app_admins
  for select to authenticated
  using (user_id = auth.uid());   -- chacun peut vérifier son propre statut


-- ----------------------------------------------------------------------------
-- 2. La fonction utilisée par toutes les policies
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER : elle lit app_admins en contournant RLS, sinon la policy
-- s'appellerait elle-même. search_path figé pour éviter tout détournement.

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.app_admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;


-- ----------------------------------------------------------------------------
-- 3. Les policies
-- ----------------------------------------------------------------------------

-- --- inscriptions : formulaire public ---------------------------------------
alter table public.inscriptions enable row level security;

drop policy if exists inscriptions_public_read   on public.inscriptions;
drop policy if exists inscriptions_public_write  on public.inscriptions;
drop policy if exists inscriptions_anon_insert   on public.inscriptions;
drop policy if exists inscriptions_admin_select  on public.inscriptions;
drop policy if exists inscriptions_admin_update  on public.inscriptions;
drop policy if exists inscriptions_admin_delete  on public.inscriptions;

-- Un visiteur peut déposer son inscription…
create policy inscriptions_anon_insert on public.inscriptions
  for insert to anon, authenticated
  with check (true);

-- …mais ne peut pas la relire. Le formulaire n'en a pas besoin : il insère
-- sans demander la ligne en retour.
create policy inscriptions_admin_select on public.inscriptions
  for select to authenticated using (public.is_app_admin());

create policy inscriptions_admin_update on public.inscriptions
  for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

create policy inscriptions_admin_delete on public.inscriptions
  for delete to authenticated using (public.is_app_admin());

-- --- internal_members : personnes internes ----------------------------------
-- Aucune raison qu'un anonyme y touche, dans un sens ou dans l'autre.
alter table public.internal_members enable row level security;

drop policy if exists internal_members_public_read  on public.internal_members;
drop policy if exists internal_members_public_write on public.internal_members;
drop policy if exists internal_members_admin_all    on public.internal_members;

create policy internal_members_admin_all on public.internal_members
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());


-- ----------------------------------------------------------------------------
-- 4. OBLIGATOIRE — se déclarer administrateur
-- ----------------------------------------------------------------------------
-- Remplacez les adresses par celles des organisateurs, puis exécutez.
-- Les comptes doivent déjà exister (Authentication ▸ Users).

insert into public.app_admins (user_id, email, label)
select u.id, u.email, 'organisation'
from auth.users u
where lower(u.email) in (
  -- 👇 À REMPLACER
  'exemple@dlwm-convention2026.fr'
)
on conflict (user_id) do nothing;


-- ----------------------------------------------------------------------------
-- 5. Vérification
-- ----------------------------------------------------------------------------
-- Doit renvoyer au moins une ligne. Si le résultat est vide, l'étape 4 n'a pas
-- fonctionné (adresse mal orthographiée, ou compte inexistant) : corrigez-la
-- avant de quitter, sinon l'espace logistique du site n'affichera plus rien.

select a.email, a.label, a.created_at from public.app_admins a order by a.created_at;
