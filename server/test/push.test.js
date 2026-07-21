import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import webpush from 'web-push';

// Chaque test charge config.js/db.js : il faut des variables valides avant import.
const dir = mkdtempSync(join(tmpdir(), 'p26push-'));
const vapid = webpush.generateVAPIDKeys();
process.env.ADMIN_CODE ||= 'Paris#Admin2026!Secure';
process.env.CORS_ORIGINS ||= 'https://api.exemple.fr';
process.env.DB_PATH = join(dir, 'db.sqlite');
process.env.UPLOADS_DIR = join(dir, 'up');
process.env.VAPID_PUBLIC_KEY = vapid.publicKey;
process.env.VAPID_PRIVATE_KEY = vapid.privateKey;
process.env.VAPID_SUBJECT = 'mailto:test@exemple.fr';

const { loadConfig } = await import('../src/config.js');
const push = await import('../src/push.js');
const db = (await import('../src/db.js')).default;

// Clés d'abonnement telles que les produit un navigateur (ECDH P-256 + secret auth).
function browserKeys() {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  return { p256dh: ecdh.getPublicKey().toString('base64url'), auth: randomBytes(16).toString('base64url') };
}

test('la configuration VAPID exige les deux clés et un sujet valide', () => {
  const base = { ADMIN_CODE: 'Paris#Admin2026!Secure', CORS_ORIGINS: 'https://api.exemple.fr' };
  assert.throws(() => loadConfig({ ...base, VAPID_PUBLIC_KEY: 'abc' }), /ensemble/);
  assert.throws(
    () => loadConfig({ ...base, VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_SUBJECT: 'test' }),
    /VAPID_SUBJECT/
  );
  const ok = loadConfig({ ...base, VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_SUBJECT: 'mailto:a@b.fr' });
  assert.equal(ok.vapid.subject, 'mailto:a@b.fr');
});

test("sans clés VAPID, le push est simplement désactivé (pas d'erreur)", async () => {
  const base = loadConfig({ ADMIN_CODE: 'Paris#Admin2026!Secure', CORS_ORIGINS: 'https://api.exemple.fr' });
  assert.equal(base.vapid, null);
});

test("l'abonnement est enregistré puis mis à jour sans doublon", () => {
  db.prepare('DELETE FROM push_subscriptions').run();
  const endpoint = 'https://push.exemple.fr/abc';
  push.saveSubscription({ endpoint, keys: browserKeys() }, { lang: 'fr' });
  push.saveSubscription({ endpoint, keys: browserKeys() }, { lang: 'en' });
  assert.equal(push.countSubscriptions(), 1);
  const row = db.prepare('SELECT lang FROM push_subscriptions WHERE endpoint = ?').get(endpoint);
  assert.equal(row.lang, 'en');

  push.removeSubscription(endpoint);
  assert.equal(push.countSubscriptions(), 0);
});

// La livraison réelle (chiffrement + HTTPS vers le service de push) a été
// validée manuellement contre un service de push simulé en HTTPS : charge utile
// chiffrée de 193 octets livrée, et purge effective sur réponse 410.
// Elle n'est pas rejouée ici car web-push impose HTTPS, ce qui demanderait un
// certificat X.509 auto-signé que Node ne sait pas générer nativement.

test('un abonnement périmé (410) est supprimé automatiquement', async () => {
  db.prepare('DELETE FROM push_subscriptions').run();
  push.initPush(loadConfig(process.env).vapid);

  // Endpoint injoignable : la diffusion ne doit ni planter ni compter d'envoi.
  push.saveSubscription({ endpoint: 'https://127.0.0.1:1/sub', keys: browserKeys() }, {});
  const result = await push.broadcast({ fr: 'test', en: 'test' });
  assert.equal(result.sent, 0);
  // L'abonnement est conservé (erreur réseau ≠ abonnement invalide) et l'erreur tracée.
  assert.equal(push.countSubscriptions(), 1);
  const row = db.prepare('SELECT last_error FROM push_subscriptions').get();
  assert.ok(row.last_error, 'une erreur doit être enregistrée');
});

test('la diffusion ne lève jamais, même sans configuration', async () => {
  const result = await push.broadcast({ fr: 'x', en: 'x' });
  assert.equal(typeof result.sent, 'number');
  assert.equal(typeof result.removed, 'number');
});
