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

-- Les policies existantes portent des noms que nous ne connaissons pas (celui
-- que Supabase propose par défaut, par exemple « Enable read access for all
-- users »). Il ne suffit donc pas d'en supprimer une liste devinée : sous RLS,
-- les policies s'additionnent, et une seule permissive suffit à tout rouvrir.
-- On fait table rase, puis on recrée exactement ce qui est voulu.

do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('inscriptions', 'internal_members')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
    raise notice 'policy supprimée : %.%', p.tablename, p.policyname;
  end loop;
end $$;

-- --- inscriptions : formulaire public ---------------------------------------
alter table public.inscriptions enable row level security;
alter table public.inscriptions force row level security;

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
alter table public.internal_members force row level security;

create policy internal_members_admin_all on public.internal_members
  for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());


-- ----------------------------------------------------------------------------
-- 3 bis. Ne pas casser la vérification de doublon du formulaire
-- ----------------------------------------------------------------------------
-- Le formulaire public appelle check_email_exists() avant d'envoyer une
-- inscription. Cette fonction lit « inscriptions » : maintenant que la lecture
-- anonyme est fermée, elle doit s'exécuter avec les droits de son propriétaire,
-- sans quoi le formulaire signalerait à tort « e-mail inconnu ».
-- On ne touche pas à son contenu, seulement à son mode d'exécution.

do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'check_email_exists'
  loop
    execute format('alter function %s security definer', fn.signature);
    execute format('alter function %s set search_path = public, pg_temp', fn.signature);
    raise notice 'check_email_exists sécurisée : %', fn.signature;
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 4. Déclarer les administrateurs
-- ----------------------------------------------------------------------------
-- Tous les comptes existants de Authentication ▸ Users sont des organisateurs :
-- ils sont donc tous déclarés administrateurs, sans intervention.
--
-- ⚠️ Cette reprise en bloc n'est valable que parce que ces comptes ont été créés
-- par vous. Une fois l'inscription libre fermée (§6), les comptes suivants
-- devront être ajoutés un par un — voir la requête en fin de fichier.

insert into public.app_admins (user_id, email, label)
select u.id, u.email, 'organisation'
from auth.users u
where u.email is not null
on conflict (user_id) do nothing;


-- ----------------------------------------------------------------------------
-- 5. Vérification
-- ----------------------------------------------------------------------------
-- Doit lister vos organisateurs. Si le résultat est vide, ne quittez pas :
-- plus personne n'accéderait aux inscriptions. Créez d'abord les comptes dans
-- Authentication ▸ Users, puis relancez l'étape 4.

select a.email, a.label, a.created_at from public.app_admins a order by a.created_at;

-- Contrôle : plus aucune policy ne doit laisser « anon » lire ces tables.
-- La seule ligne mentionnant anon doit être l'INSERT du formulaire public.
select tablename, policyname, cmd, roles::text
from pg_policies
where schemaname = 'public' and tablename in ('inscriptions', 'internal_members')
order by tablename, cmd;


-- ----------------------------------------------------------------------------
-- 6. Ensuite : fermer l'inscription libre
-- ----------------------------------------------------------------------------
-- Authentication ▸ Sign In / Providers ▸ Email ▸ décochez
-- « Allow new users to sign up ».
--
-- Sans cela, n'importe qui peut créer un compte Supabase. Il ne serait pas
-- administrateur (il n'est pas dans app_admins), mais autant fermer la porte.
--
-- Pour ajouter un organisateur par la suite, créez son compte dans
-- Authentication ▸ Users (cochez « Auto Confirm User »), puis :
--
--   insert into public.app_admins (user_id, email, label)
--   select id, email, 'organisation' from auth.users
--   where lower(email) = 'nouvel.organisateur@exemple.fr'
--   on conflict (user_id) do nothing;
--
-- Pour retirer un accès :
--
--   delete from public.app_admins where lower(email) = 'ancien@exemple.fr';
