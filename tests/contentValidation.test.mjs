import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultContent, sessionTimeRange } from '../src/data/defaultContent.js';
import { validateContent } from '../src/data/contentValidation.js';

const completeContent = () => {
  const content = structuredClone(defaultContent);
  content.audios = [];
  for (const day of content.days.slice(3)) {
    const dayNumber = Number(day.id.slice(1));
    const date = String(23 + dayNumber).padStart(2, '0');
    content.sessions.push({
      id: `release-${day.id}`,
      dayId: day.id,
      startISO: `2026-07-${date}T09:00+02:00`,
      endISO: `2026-07-${date}T10:00+02:00`,
      tFr: 'Session validée',
      tEn: 'Verified session',
      spFr: '',
      spEn: '',
      locFr: 'Lieu validé',
      locEn: 'Verified venue',
      tag: 'formation',
    });
  }
  return content;
};

test('le contenu complet et zoné est accepté', () => {
  const result = validateContent(completeContent());
  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('chaque journée annoncée doit avoir une session', () => {
  const result = validateContent(defaultContent);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes('aucune session pour d4')));
});

test('les dates sans fuseau et les médias fictifs sont refusés', () => {
  const content = completeContent();
  content.sessions[0].startISO = '2026-07-24T16:00';
  content.audios = [{ id: 'a1', titleFr: 'Titre', titleEn: 'Title', duration: '12:30', url: '' }];
  const result = validateContent(content);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes('startISO')));
  assert.ok(result.errors.some(error => error.includes('média réel requis')));
});

test("l'affichage horaire reste fixé au fuseau de Paris", () => {
  assert.equal(sessionTimeRange({
    startISO: '2026-07-24T14:00:00Z',
    endISO: '2026-07-24T15:30:00Z',
  }), '16h00 - 17h30');
});
