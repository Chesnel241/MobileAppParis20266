import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// La migration qui ferme les données personnelles du site sera collée dans le
// SQL Editor de Supabase, sur une base de production contenant 173 inscriptions.
// Elle doit donc s'exécuter du premier coup, et deux fois de suite sans dégât.
const sql = readFileSync(new URL('../supabase/site-security.sql', import.meta.url), 'utf8');

// pglite n'a ni schéma « auth » ni rôles Supabase : on les simule pour pouvoir
// exécuter la migration telle quelle, sans la modifier pour les besoins du test.
const AMORCE = `
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key, email text);
  create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  end $$;
  create table if not exists public.inscriptions (id uuid primary key default gen_random_uuid(), full_name text, email text, status text);
  create table if not exists public.internal_members (id uuid primary key default gen_random_uuid(), email text);
  -- Reproduction de la fonction du formulaire public, en SECURITY INVOKER :
  -- la migration doit la basculer elle-même en SECURITY DEFINER.
  create or replace function public.check_email_exists(check_email text)
  returns boolean language sql stable as $fn$
    select exists (select 1 from public.inscriptions where lower(email) = lower(check_email));
  $fn$;
`;

// Reproduit la situation réelle : le site avait déjà des policies, portant les
// noms proposés par défaut dans Supabase. Une première version de cette
// migration ne supprimait qu'une liste de noms devinés ; celles-ci ont survécu
// et, RLS additionnant les policies permissives, la fuite est restée ouverte.
const POLICIES_PREEXISTANTES = `
  alter table public.inscriptions enable row level security;
  alter table public.internal_members enable row level security;
  create policy "Enable read access for all users" on public.inscriptions for select using (true);
  create policy "Enable insert for all users" on public.inscriptions for insert with check (true);
  create policy "Enable read access for all users" on public.internal_members for select using (true);
`;

async function appliquer(fois = 1, { avecPoliciesExistantes = true } = {}) {
  const db = new PGlite();
  await db.exec(AMORCE);
  if (avecPoliciesExistantes) await db.exec(POLICIES_PREEXISTANTES);
  for (let i = 0; i < fois; i++) await db.exec(sql);
  return db;
}

test('la migration s’exécute sans erreur', async () => {
  const db = await appliquer();
  await db.close();
});

test('la migration est ré-exécutable sans dégât', async () => {
  const db = await appliquer(2);
  const { rows } = await db.query('select count(*)::int as n from public.app_admins');
  assert.equal(rows[0].n, 0, 'aucune donnée ne doit être créée par une seconde exécution');
  await db.close();
});

test('RLS est activé sur les trois tables sensibles', async () => {
  const db = await appliquer();
  const { rows } = await db.query(`
    select relname, relrowsecurity from pg_class
    where relname in ('inscriptions','internal_members','app_admins') and relnamespace = 'public'::regnamespace
  `);
  assert.equal(rows.length, 3);
  for (const r of rows) assert.equal(r.relrowsecurity, true, `RLS désactivé sur ${r.relname}`);
  await db.close();
});

test('un anonyme peut s’inscrire mais ne peut rien lire', async () => {
  const db = await appliquer();
  const { rows } = await db.query(`
    select cmd, roles::text as roles from pg_policies
    where schemaname = 'public' and tablename = 'inscriptions'
  `);
  const insert = rows.find(r => r.cmd === 'INSERT');
  assert.ok(insert, 'le formulaire public doit pouvoir insérer');
  assert.match(insert.roles, /anon/, 'l’insertion doit rester ouverte à anon');

  for (const cmd of ['SELECT', 'UPDATE', 'DELETE']) {
    const p = rows.find(r => r.cmd === cmd);
    assert.ok(p, `policy ${cmd} manquante`);
    assert.doesNotMatch(p.roles, /anon/, `${cmd} ne doit jamais être ouvert à anon`);
  }
  await db.close();
});

// Le vrai test de non-régression : aucune policy héritée ne doit subsister.
test('les policies préexistantes de lecture publique sont supprimées', async () => {
  const db = await appliquer();
  const { rows } = await db.query(`
    select tablename, policyname, cmd, roles::text as roles from pg_policies
    where schemaname = 'public' and tablename in ('inscriptions','internal_members')
  `);
  const heritees = rows.filter(r => /Enable (read|insert) access|Enable insert for/.test(r.policyname));
  assert.equal(heritees.length, 0, 'policies héritées encore présentes : ' + heritees.map(r => r.policyname).join(', '));

  // Aucune lecture ne doit rester ouverte à anon, sur aucune des deux tables.
  const lecturesAnon = rows.filter(r => r.cmd !== 'INSERT' && /anon/.test(r.roles));
  assert.equal(lecturesAnon.length, 0, 'lecture anonyme encore possible');
  await db.close();
});

test('internal_members est totalement fermé aux anonymes', async () => {
  const db = await appliquer();
  const { rows } = await db.query(`
    select roles::text as roles from pg_policies where schemaname='public' and tablename='internal_members'
  `);
  assert.ok(rows.length > 0, 'aucune policy sur internal_members');
  for (const r of rows) assert.doesNotMatch(r.roles, /anon/);
  await db.close();
});

// Sans cela, le formulaire public répondrait « e-mail inconnu » à tout le monde
// et laisserait passer les doublons.
test('la vérification de doublon du formulaire survit à la fermeture des lectures', async () => {
  const db = await appliquer();
  const { rows } = await db.query(`
    select p.prosecdef, p.proconfig::text as config
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'check_email_exists'
  `);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].prosecdef, true, 'check_email_exists doit passer en SECURITY DEFINER');
  assert.match(rows[0].config, /search_path/, 'search_path doit être figé');
  await db.close();
});

test('l’absence de check_email_exists ne bloque pas la migration', async () => {
  const db = new PGlite();
  await db.exec(AMORCE);
  await db.exec('drop function if exists public.check_email_exists(text)');
  await db.exec(sql); // ne doit pas lever
  await db.close();
});

test('is_app_admin contourne RLS mais n’est pas exposée aux anonymes', async () => {
  const db = await appliquer();
  const { rows } = await db.query(`
    select p.prosecdef, p.proconfig::text as config
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_app_admin'
  `);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].prosecdef, true, 'doit être SECURITY DEFINER');
  assert.match(rows[0].config, /search_path/, 'search_path doit être figé');

  const { rows: acl } = await db.query(`
    select has_function_privilege('anon', 'public.is_app_admin()', 'execute') as anon_peut
  `);
  assert.equal(acl[0].anon_peut, false, 'un anonyme ne doit pas pouvoir l’appeler');
  await db.close();
});
