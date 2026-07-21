import test from 'node:test';
import assert from 'node:assert/strict';

process.env.ADMIN_CODE ||= 'Paris#Admin2026!Secure';
const { assertStrongAdminCode, loadConfig } = await import('../src/config.js');
const { validateContentSection, validateParticipantInput, validateQuestionInput } = await import('../src/validation.js');

test('les secrets administrateur faibles sont rejetés', () => {
  for (const code of ['', 'LWMFD2026', 'Weak123!', 'CHANGE_ME_WITH_A_RANDOM_SECRET_32_CHARS']) {
    assert.throws(() => assertStrongAdminCode(code), /\[CONFIG\]/);
  }
  assert.equal(assertStrongAdminCode('Paris#Admin2026!Secure'), 'Paris#Admin2026!Secure');
});

test('les origines CORS sont obligatoires et sûres en production', () => {
  assert.throws(() => loadConfig({ NODE_ENV: 'production', ADMIN_CODE: 'Paris#Admin2026!Secure' }), /CORS_ORIGINS/);
  assert.throws(() => loadConfig({ NODE_ENV: 'production', ADMIN_CODE: 'Paris#Admin2026!Secure', CORS_ORIGINS: 'http://remote.test' }), /non sécurisée/);
  const config = loadConfig({
    NODE_ENV: 'production',
    ADMIN_CODE: 'Paris#Admin2026!Secure',
    CORS_ORIGINS: 'https://api.example.test,capacitor://localhost,http://localhost',
  });
  assert.equal(config.corsOrigins.length, 3);
});

test('participants, consentement et dates sont validés strictement', () => {
  assert.throws(() => validateParticipantInput({ firstName: 'A', lastName: 'B', phone: 'abc', country: 'FR' }));
  assert.throws(() => validateQuestionInput({ text: 'Question', consent: false }));
  assert.deepEqual(validateQuestionInput({ text: ' Question ', consent: true }), { text: 'Question', consent: true });
  assert.throws(() => validateContentSection('countdownTargetISO', '2026-07-24T16:00'));
  assert.equal(validateContentSection('countdownTargetISO', '2026-07-24T16:00+02:00'), '2026-07-24T16:00+02:00');
});
