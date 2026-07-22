import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Valide supabase/schema.sql contre un vrai moteur Postgres (embarqué), pour
// détecter toute erreur AVANT de l'exécuter dans le projet Supabase.
// La partie Storage est retirée : le schéma « storage » n'existe que chez Supabase.
const raw = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const sql = raw.split('-- ---------- Storage')[0];

async function freshDb() {
  const db = new PGlite();
  await db.exec(sql);
  return db;
}

test('le schéma Supabase s’exécute sans erreur sur Postgres', async () => {
  const db = await freshDb();
  const { rows } = await db.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `);
  const tables = rows.map(r => r.table_name);
  for (const expected of [
    'participants', 'questions', 'admin_sessions', 'checkins', 'content',
    'notifications', 'housing', 'push_subscriptions', 'photos', 'rate_limits',
  ]) {
    assert.ok(tables.includes(expected), `table manquante : ${expected}`);
  }
  await db.close();
});

test('le schéma est ré-exécutable sans erreur (idempotent)', async () => {
  const db = await freshDb();
  await db.exec(sql); // deuxième passage : if not exists / or replace
  await db.close();
});

test('RLS est activé sur toutes les tables et aucune policy n’ouvre l’accès', async () => {
  const db = await freshDb();
  const { rows } = await db.query(`
    select relname, relrowsecurity from pg_class
    where relnamespace = 'public'::regnamespace and relkind = 'r'
  `);
  for (const row of rows) {
    assert.equal(row.relrowsecurity, true, `RLS désactivé sur ${row.relname}`);
  }
  const { rows: policies } = await db.query('select policyname from pg_policies where schemaname = $1', ['public']);
  assert.equal(policies.length, 0, 'aucune policy ne doit exposer les tables au client');
  await db.close();
});

test('la contrainte d’unicité empêche deux logements pour le même participant', async () => {
  const db = await freshDb();
  const { rows } = await db.query(
    `insert into participants (token, first_name, last_name, phone, country)
     values ('t1', 'Grace', 'Mabiala', '0611', 'CG') returning id`
  );
  const pid = rows[0].id;
  await db.query(`insert into housing (first_name, last_name, participant_id) values ('Grace','Mabiala',$1)`, [pid]);
  await assert.rejects(
    () => db.query(`insert into housing (first_name, last_name, participant_id) values ('Autre','Nom',$1)`, [pid]),
    /duplicate key|unique/i
  );
  // Plusieurs logements NON liés restent possibles (index partiel).
  await db.query(`insert into housing (first_name, last_name) values ('A','B')`);
  await db.query(`insert into housing (first_name, last_name) values ('C','D')`);
  await db.close();
});

test('supprimer un participant supprime ses questions en cascade', async () => {
  const db = await freshDb();
  const { rows } = await db.query(
    `insert into participants (token, first_name, last_name, phone, country)
     values ('t2','Jean','Dupont','0612','FR') returning id`
  );
  const pid = rows[0].id;
  await db.query(`insert into questions (participant_id, text) values ($1, 'ma question')`, [pid]);
  await db.query('delete from participants where id = $1', [pid]);
  const { rows: left } = await db.query('select count(*)::int as c from questions');
  assert.equal(left[0].c, 0);
  await db.close();
});

test('le limiteur de débit compte puis se réinitialise après la fenêtre', async () => {
  const db = await freshDb();
  const hit = async (windowSeconds = 60) => {
    const { rows } = await db.query('select rl_hit($1,$2,$3) as n', ['login', '1.2.3.4', windowSeconds]);
    return rows[0].n;
  };
  assert.equal(await hit(), 1);
  assert.equal(await hit(), 2);
  assert.equal(await hit(), 3);

  // Fenêtre de 0 seconde : chaque appel repart à 1.
  assert.equal(await hit(0), 1);

  // Une autre IP a son propre compteur.
  const { rows } = await db.query('select rl_hit($1,$2,$3) as n', ['login', '9.9.9.9', 60]);
  assert.equal(rows[0].n, 1);
  await db.close();
});

test('le contenu est stocké en JSON et relu tel quel', async () => {
  const db = await freshDb();
  const payload = { hotelName: 'Novotel', practical: { wifi: { fr: 'a', en: 'b' } } };
  await db.query('insert into content (section, data) values ($1, $2)', ['sejour', JSON.stringify(payload)]);
  const { rows } = await db.query('select data from content where section = $1', ['sejour']);
  assert.deepEqual(rows[0].data, payload);
  await db.close();
});
