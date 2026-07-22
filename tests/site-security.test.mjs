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
`;

async function appliquer(fois = 1) {
  const db = new PGlite();
  await db.exec(AMORCE);
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

test('internal_members est totalement fermé aux anonymes', async () => {
  const db = await appliquer();
  const { rows } = await db.query(`
    select roles::text as roles from pg_policies where schemaname='public' and tablename='internal_members'
  `);
  assert.ok(rows.length > 0, 'aucune policy sur internal_members');
  for (const r of rows) assert.doesNotMatch(r.roles, /anon/);
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
