import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Le repo interroge Supabase par noms de tables et de colonnes en chaînes de
// caractères : une faute de frappe ne se verrait qu'en production. Ce test
// confronte ce que le code utilise à ce que le schéma définit réellement.
const schemaRaw = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const schemaSql = schemaRaw.split('-- ---------- Storage')[0];
const repoSrc = readFileSync(new URL('../api/lib/repo.js', import.meta.url), 'utf8');

// Tables que l'application lit sans les posséder. Elles appartiennent au site de
// la convention, qui partage le même projet Supabase : « inscriptions » et
// « internal_members » sont tenues par le site, « app_admins » est créée par
// supabase/site-security.sql (elle référence auth.users, absent ici).
// Les citer explicitement rend cette dépendance visible plutôt que tacite ; la
// lecture de ces tables est défensive dans repo.js, justement parce que nous
// n'en maîtrisons pas la forme.
const TABLES_DU_SITE = new Set(['inscriptions', 'internal_members', 'app_admins']);
const COLONNES_DU_SITE = new Set(['user_id']);

async function introspect() {
  const db = new PGlite();
  await db.exec(schemaSql);
  const { rows } = await db.query(`
    select table_name, column_name from information_schema.columns where table_schema = 'public'
  `);
  const { rows: fns } = await db.query(`
    select routine_name from information_schema.routines where routine_schema = 'public'
  `);
  await db.close();
  const columns = new Map();
  for (const r of rows) {
    if (!columns.has(r.table_name)) columns.set(r.table_name, new Set());
    columns.get(r.table_name).add(r.column_name);
  }
  return { columns, functions: new Set(fns.map(f => f.routine_name)) };
}

test('toutes les tables utilisées par le repo existent dans le schéma', async () => {
  const { columns } = await introspect();
  const used = [...repoSrc.matchAll(/\.from\('([a-z_]+)'\)/g)].map(m => m[1]);
  const unique = [...new Set(used)]
    .filter(t => t !== 'media')              // 'media' = bucket Storage
    .filter(t => !TABLES_DU_SITE.has(t));
  assert.ok(unique.length > 0, 'aucune table détectée dans le repo');
  for (const table of unique) {
    assert.ok(columns.has(table), `table inconnue utilisée par le repo : ${table}`);
  }
});

test('les colonnes référencées dans les filtres du repo existent', async () => {
  const { columns } = await introspect();
  const all = new Set([...columns.values()].flatMap(set => [...set]));
  // Colonnes citées dans .eq()/.gte()/.lt()/.is()/.not()/.neq()/.order()
  const referenced = [...repoSrc.matchAll(/\.(?:eq|gte|lt|is|neq|order)\('([a-z_]+)'/g)].map(m => m[1]);
  for (const col of new Set(referenced)) {
    if (COLONNES_DU_SITE.has(col)) continue;
    assert.ok(all.has(col), `colonne inconnue référencée par le repo : ${col}`);
  }
});

test('la fonction du limiteur de débit appelée par le repo existe', async () => {
  const { functions } = await introspect();
  const rpcs = [...repoSrc.matchAll(/\.rpc\('([a-z_]+)'/g)].map(m => m[1]);
  for (const fn of new Set(rpcs)) {
    assert.ok(functions.has(fn), `fonction Postgres manquante : ${fn}`);
  }
});

test('les clés de conflit des upsert correspondent à une contrainte unique', async () => {
  const { columns } = await introspect();
  const conflicts = [...repoSrc.matchAll(/onConflict:\s*'([a-z_]+)'/g)].map(m => m[1]);
  const all = new Set([...columns.values()].flatMap(set => [...set]));
  for (const col of new Set(conflicts)) {
    assert.ok(all.has(col), `colonne onConflict inconnue : ${col}`);
  }
});
