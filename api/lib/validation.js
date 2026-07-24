const COUNTRY_CODES = new Set([
  'FR', 'CG', 'CD', 'CM', 'CI', 'SN', 'GA', 'BJ', 'TG', 'BF', 'ML', 'GN',
  'NE', 'TD', 'CF', 'MG', 'RW', 'BI', 'AO', 'NG', 'GH', 'ZA', 'BE', 'CH',
  'GB', 'DE', 'IT', 'ES', 'PT', 'US', 'CA', 'BR', 'HT', 'OTHER',
]);

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’ -]*$/u;
const COUNTRY_LABEL_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’ .()-]*$/u;
const hasForbiddenControl = (value) => [...value].some((character) => {
  const code = character.codePointAt(0);
  return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
});

export class InputValidationError extends Error {
  constructor(field, reason = 'invalid', code = 'invalid_input') {
    super(`${field}: ${reason}`);
    this.name = 'InputValidationError';
    this.field = field;
    this.reason = reason;
    this.code = code;
    this.status = 400;
  }
}

function fail(field, reason, code) {
  throw new InputValidationError(field, reason, code);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function object(value, field, requiredKeys, optionalKeys = []) {
  if (!isPlainObject(value)) fail(field, 'must_be_an_object');
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${field}.${key}`, 'unknown_field');
  }
  for (const key of requiredKeys) {
    if (!Object.hasOwn(value, key)) fail(`${field}.${key}`, 'required');
  }
  return value;
}

function array(value, field, { min = 0, max }) {
  if (!Array.isArray(value)) fail(field, 'must_be_an_array');
  if (value.length < min) fail(field, 'too_few_items');
  if (value.length > max) fail(field, 'too_many_items');
  return value;
}

function string(value, field, { min = 1, max = 255, trim = true } = {}) {
  if (typeof value !== 'string') fail(field, 'must_be_a_string');
  const out = trim ? value.trim() : value;
  if (out.length < min) fail(field, min === 1 ? 'required' : 'too_short');
  if (out.length > max) fail(field, 'too_long');
  if (hasForbiddenControl(out)) fail(field, 'contains_control_characters');
  return out;
}

function optionalString(value, field, max) {
  return string(value ?? '', field, { min: 0, max });
}

function name(value, field, { optional = false } = {}) {
  const out = string(value ?? '', field, { min: optional ? 0 : 1, max: 80 })
    .replace(/\s+/g, ' ');
  if (out && !NAME_RE.test(out)) fail(field, 'invalid_name');
  return out;
}

export function normalizePhone(value, field = 'phone', { optional = false } = {}) {
  const out = string(value ?? '', field, { min: optional ? 0 : 1, max: 32 });
  if (!out && optional) return '';
  if (!/^\+?[0-9() .-]+$/.test(out)) fail(field, 'invalid_phone');
  const digits = out.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) fail(field, 'invalid_phone');
  return out;
}

function participantCountry(value, field = 'country') {
  const out = string(value, field, { min: 2, max: 5 }).toUpperCase();
  if (!COUNTRY_CODES.has(out)) fail(field, 'unknown_country');
  return out;
}

function optionalCountryLabel(value, field) {
  const out = optionalString(value, field, 80);
  if (out && !COUNTRY_LABEL_RE.test(out)) fail(field, 'invalid_country');
  return out;
}

function uuid(value, field) {
  const out = string(value, field, { min: 36, max: 36 });
  if (!UUID_RE.test(out)) fail(field, 'invalid_id');
  return out;
}

function identifier(value, field) {
  const out = string(value, field, { max: 64 });
  if (!ID_RE.test(out)) fail(field, 'invalid_identifier');
  return out;
}

function offsetDateTime(value, field) {
  const out = string(value, field, { max: 40 });
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(out);
  if (!match) fail(field, 'invalid_datetime');
  const [, year, month, day, hour, minute, second = '0'] = match;
  const parts = [year, month, day, hour, minute, second].map(Number);
  const check = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  if (check.getUTCFullYear() !== parts[0] || check.getUTCMonth() !== parts[1] - 1
      || check.getUTCDate() !== parts[2] || parts[3] > 23 || parts[4] > 59 || parts[5] > 59
      || Number.isNaN(Date.parse(out))) {
    fail(field, 'invalid_datetime');
  }
  return out;
}

function mediaUrl(value, field) {
  const out = optionalString(value, field, 2048);
  if (!out) return '';
  if (/^\/media\/[A-Za-z0-9._-]{1,200}$/.test(out)) return out;
  try {
    const parsed = new URL(out);
    if (parsed.protocol === 'https:') return out;
  } catch { /* erreur uniforme ci-dessous */ }
  fail(field, 'invalid_url');
}

function bilingual(value, field, max = 500) {
  const input = object(value, field, ['fr', 'en']);
  return {
    fr: string(input.fr, `${field}.fr`, { max }),
    en: string(input.en, `${field}.en`, { max }),
  };
}

function uniqueIds(items, field) {
  const ids = new Set();
  for (const [index, item] of items.entries()) {
    if (ids.has(item.id)) fail(`${field}[${index}].id`, 'duplicate_id');
    ids.add(item.id);
  }
}

export function validateParticipantInput(value) {
  const input = object(value, 'body', ['firstName', 'lastName', 'phone', 'country']);
  return {
    firstName: name(input.firstName, 'firstName'),
    lastName: name(input.lastName, 'lastName'),
    phone: normalizePhone(input.phone),
    country: participantCountry(input.country),
  };
}

export function participantIdentityKey(participant) {
  const normalizeName = (value) => String(value || '').normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').replace(/\s+/g, ' ').trim();
  const phone = String(participant.phone || '').replace(/\D/g, '');
  return `${normalizeName(participant.firstName ?? participant.first_name)}|${normalizeName(participant.lastName ?? participant.last_name)}|${phone}`;
}

export function validateQuestionInput(value) {
  const input = object(value, 'body', ['text', 'consent']);
  if (input.consent !== true) fail('consent', 'explicit_consent_required');
  return { text: string(input.text, 'text', { max: 2000 }), consent: true };
}

export function validateAdminLoginInput(value) {
  // Deux modes exclusifs : jeton Supabase (comptes existants) ou code partagé.
  const input = object(value, 'body', [], ['code', 'supabaseAccessToken']);
  const supabaseAccessToken = optionalString(input.supabaseAccessToken, 'supabaseAccessToken', 4096);
  if (supabaseAccessToken) return { code: null, supabaseAccessToken };
  return { code: string(input.code, 'code', { max: 256 }), supabaseAccessToken: null };
}

export function validatePushSubscriptionInput(value) {
  const input = object(value, 'body', ['subscription'], ['lang']);
  const sub = object(input.subscription, 'subscription', ['endpoint', 'keys']);
  const endpoint = string(sub.endpoint, 'subscription.endpoint', { max: 1024 });
  if (!/^https:\/\//i.test(endpoint)) fail('subscription.endpoint', 'must_be_https');
  const keys = object(sub.keys, 'subscription.keys', ['p256dh', 'auth']);
  return {
    subscription: {
      endpoint,
      keys: {
        p256dh: string(keys.p256dh, 'subscription.keys.p256dh', { max: 256 }),
        auth: string(keys.auth, 'subscription.keys.auth', { max: 256 }),
      },
    },
    lang: optionalString(input.lang, 'lang', 5),
  };
}

export function validatePushUnsubscribeInput(value) {
  const input = object(value, 'body', ['endpoint']);
  return { endpoint: string(input.endpoint, 'endpoint', { max: 1024 }) };
}

export function validateNotificationInput(value) {
  const input = object(value, 'body', ['textFr'], ['textEn']);
  const textFr = string(input.textFr, 'textFr', { max: 1000 });
  return { textFr, textEn: optionalString(input.textEn, 'textEn', 1000) || textFr };
}

export function validateQuestionAssignmentInput(value) {
  const input = object(value, 'body', ['pastorName', 'place', 'time']);
  return {
    pastorName: string(input.pastorName, 'pastorName', { max: 120 }),
    place: string(input.place, 'place', { max: 160 }),
    time: string(input.time, 'time', { max: 80 }),
  };
}

function housingValues(input, field) {
  const firstName = name(input.firstName, `${field}.firstName`, { optional: true });
  const lastName = name(input.lastName, `${field}.lastName`, { optional: true });
  if (!firstName && !lastName) fail(field, 'name_required');
  return {
    firstName,
    lastName,
    phone: normalizePhone(input.phone, `${field}.phone`, { optional: true }),
    country: optionalCountryLabel(input.country, `${field}.country`),
    address: optionalString(input.address, `${field}.address`, 500),
    notes: optionalString(input.notes, `${field}.notes`, 1000),
  };
}

export function validateHousingImportInput(value) {
  const input = object(value, 'body', ['rows']);
  const rows = array(input.rows, 'rows', { min: 1, max: 500 }).map((row, index) => {
    const path = `rows[${index}]`;
    const item = object(row, path, ['firstName', 'lastName'], ['phone', 'country', 'address', 'notes']);
    return housingValues(item, path);
  });
  return { rows };
}

export function validateHousingUpdateInput(value, current) {
  const input = object(value, 'body', [], [
    'firstName', 'lastName', 'phone', 'country', 'address', 'notes',
    // Le panneau admin renvoie aussi ces propriétés en lecture seule.
    'id', 'participant', 'createdAt', 'updatedAt',
  ]);
  return housingValues({
    firstName: input.firstName ?? current.first_name,
    lastName: input.lastName ?? current.last_name,
    phone: input.phone ?? current.phone,
    country: input.country ?? current.country,
    address: input.address ?? current.address,
    notes: input.notes ?? current.notes,
  }, 'body');
}

export function validateHousingLinkInput(value) {
  const input = object(value, 'body', ['participantId']);
  if (input.participantId === null) return { participantId: null };
  return { participantId: uuid(input.participantId, 'participantId') };
}

function validateDays(value) {
  const days = array(value, 'days', { min: 1, max: 31 }).map((entry, index) => {
    const field = `days[${index}]`;
    const day = object(entry, field, ['id', 'dFr', 'dEn', 'fullFr', 'fullEn', 'phase']);
    const phase = string(day.phase, `${field}.phase`, { max: 20 });
    if (!['convention', 'formation'].includes(phase)) fail(`${field}.phase`, 'invalid_phase');
    return {
      id: identifier(day.id, `${field}.id`),
      dFr: string(day.dFr, `${field}.dFr`, { max: 80 }),
      dEn: string(day.dEn, `${field}.dEn`, { max: 80 }),
      fullFr: string(day.fullFr, `${field}.fullFr`, { max: 120 }),
      fullEn: string(day.fullEn, `${field}.fullEn`, { max: 120 }),
      phase,
    };
  });
  uniqueIds(days, 'days');
  return days;
}

function validateSessions(value) {
  const sessions = array(value, 'sessions', { max: 250 }).map((entry, index) => {
    const field = `sessions[${index}]`;
    const session = object(entry, field, [
      'id', 'dayId', 'startISO', 'endISO', 'tFr', 'tEn', 'spFr', 'spEn', 'locFr', 'locEn', 'tag',
    ]);
    const startISO = offsetDateTime(session.startISO, `${field}.startISO`);
    const endISO = offsetDateTime(session.endISO, `${field}.endISO`);
    if (Date.parse(endISO) <= Date.parse(startISO)) fail(`${field}.endISO`, 'must_be_after_start');
    return {
      id: identifier(session.id, `${field}.id`),
      dayId: identifier(session.dayId, `${field}.dayId`),
      startISO,
      endISO,
      tFr: string(session.tFr, `${field}.tFr`, { max: 200 }),
      tEn: string(session.tEn, `${field}.tEn`, { max: 200 }),
      spFr: optionalString(session.spFr, `${field}.spFr`, 160),
      spEn: optionalString(session.spEn, `${field}.spEn`, 160),
      locFr: string(session.locFr, `${field}.locFr`, { max: 250 }),
      locEn: string(session.locEn, `${field}.locEn`, { max: 250 }),
      tag: string(session.tag, `${field}.tag`, { max: 64 }),
    };
  });
  uniqueIds(sessions, 'sessions');
  return sessions;
}

function validateSejour(value) {
  const input = object(value, 'sejour', [
    'hotelName', 'hotelPhotoUrl', 'hotelMapQuery', 'room', 'checkin', 'checkout', 'practical', 'venues',
  ]);
  const practical = object(input.practical, 'sejour.practical', ['wifi', 'breakfast', 'shuttle', 'reception']);
  const venues = object(input.venues, 'sejour.venues', ['novotel', 'creteil']);
  const venue = (entry, field) => {
    const item = object(entry, field, ['nameFr', 'nameEn', 'addressFr', 'addressEn', 'mapQuery']);
    return {
      nameFr: string(item.nameFr, `${field}.nameFr`, { max: 160 }),
      nameEn: string(item.nameEn, `${field}.nameEn`, { max: 160 }),
      addressFr: string(item.addressFr, `${field}.addressFr`, { max: 300 }),
      addressEn: string(item.addressEn, `${field}.addressEn`, { max: 300 }),
      mapQuery: string(item.mapQuery, `${field}.mapQuery`, { max: 300 }),
    };
  };
  return {
    hotelName: string(input.hotelName, 'sejour.hotelName', { max: 160 }),
    hotelPhotoUrl: mediaUrl(input.hotelPhotoUrl, 'sejour.hotelPhotoUrl'),
    hotelMapQuery: string(input.hotelMapQuery, 'sejour.hotelMapQuery', { max: 300 }),
    room: string(input.room, 'sejour.room', { max: 120 }),
    checkin: string(input.checkin, 'sejour.checkin', { max: 120 }),
    checkout: string(input.checkout, 'sejour.checkout', { max: 120 }),
    practical: {
      wifi: bilingual(practical.wifi, 'sejour.practical.wifi'),
      breakfast: bilingual(practical.breakfast, 'sejour.practical.breakfast'),
      shuttle: bilingual(practical.shuttle, 'sejour.practical.shuttle'),
      reception: bilingual(practical.reception, 'sejour.practical.reception'),
    },
    venues: {
      novotel: venue(venues.novotel, 'sejour.venues.novotel'),
      creteil: venue(venues.creteil, 'sejour.venues.creteil'),
    },
  };
}

// Photo d'un site : facultative. Chemin d'application (/paris/…, /media/…) ou
// URL HTTPS. On refuse les chemins traversants et les schémas exotiques.
function sitePhoto(value, field) {
  const out = optionalString(value, field, 2048);
  if (!out) return '';
  if (/^\/[A-Za-z0-9._/-]{1,300}$/.test(out) && !out.includes('..')) return out;
  try {
    if (new URL(out).protocol === 'https:') return out;
  } catch { /* erreur uniforme ci-dessous */ }
  fail(field, 'invalid_url');
}

function validateParis(value) {
  const input = object(value, 'paris', ['transport', 'categories'], ['landmarks']);
  const transport = object(input.transport, 'paris.transport', ['line1', 'line2', 'line3']);
  const categories = array(input.categories, 'paris.categories', { max: 20 }).map((entry, ci) => {
    const cf = `paris.categories[${ci}]`;
    const cat = object(entry, cf, ['id', 'titleFr', 'titleEn', 'sites'], ['descFr', 'descEn']);
    const sites = array(cat.sites, `${cf}.sites`, { max: 40 }).map((sEntry, si) => {
      const sf = `${cf}.sites[${si}]`;
      const s = object(sEntry, sf,
        ['id', 'nameFr', 'nameEn', 'mapQuery'],
        ['descFr', 'descEn', 'address', 'transitFr', 'transitEn', 'priceFr', 'priceEn', 'photo']);
      return {
        id: identifier(s.id, `${sf}.id`),
        nameFr: string(s.nameFr, `${sf}.nameFr`, { max: 200 }),
        nameEn: string(s.nameEn, `${sf}.nameEn`, { max: 200 }),
        descFr: optionalString(s.descFr, `${sf}.descFr`, 600),
        descEn: optionalString(s.descEn, `${sf}.descEn`, 600),
        address: optionalString(s.address, `${sf}.address`, 300),
        transitFr: optionalString(s.transitFr, `${sf}.transitFr`, 300),
        transitEn: optionalString(s.transitEn, `${sf}.transitEn`, 300),
        priceFr: optionalString(s.priceFr, `${sf}.priceFr`, 200),
        priceEn: optionalString(s.priceEn, `${sf}.priceEn`, 200),
        photo: sitePhoto(s.photo, `${sf}.photo`),
        mapQuery: string(s.mapQuery, `${sf}.mapQuery`, { max: 300 }),
      };
    });
    uniqueIds(sites, `${cf}.sites`);
    return {
      id: identifier(cat.id, `${cf}.id`),
      titleFr: string(cat.titleFr, `${cf}.titleFr`, { max: 120 }),
      titleEn: string(cat.titleEn, `${cf}.titleEn`, { max: 120 }),
      descFr: optionalString(cat.descFr, `${cf}.descFr`, 500),
      descEn: optionalString(cat.descEn, `${cf}.descEn`, 500),
      sites,
    };
  });
  uniqueIds(categories, 'paris.categories');
  return {
    transport: {
      line1: bilingual(transport.line1, 'paris.transport.line1'),
      line2: bilingual(transport.line2, 'paris.transport.line2'),
      line3: bilingual(transport.line3, 'paris.transport.line3'),
    },
    categories,
  };
}

function validateAudios(value) {
  const audios = array(value, 'audios', { max: 100 }).map((entry, index) => {
    const field = `audios[${index}]`;
    const item = object(entry, field, ['id', 'titleFr', 'titleEn', 'duration', 'url']);
    const duration = string(item.duration, `${field}.duration`, { max: 12 });
    if (!/^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(duration)) fail(`${field}.duration`, 'invalid_duration');
    return {
      id: identifier(item.id, `${field}.id`),
      titleFr: string(item.titleFr, `${field}.titleFr`, { max: 200 }),
      titleEn: string(item.titleEn, `${field}.titleEn`, { max: 200 }),
      duration,
      url: mediaUrl(item.url, `${field}.url`),
    };
  });
  uniqueIds(audios, 'audios');
  return audios;
}

function validateAbout(value) {
  const input = object(value, 'about', [
    'datesFr', 'datesEn', 'conventionFr', 'conventionEn', 'formationFr', 'formationEn', 'phone', 'email',
  ]);
  const email = string(input.email, 'about.email', { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('about.email', 'invalid_email');
  return {
    datesFr: string(input.datesFr, 'about.datesFr', { max: 160 }),
    datesEn: string(input.datesEn, 'about.datesEn', { max: 160 }),
    conventionFr: string(input.conventionFr, 'about.conventionFr', { max: 200 }),
    conventionEn: string(input.conventionEn, 'about.conventionEn', { max: 200 }),
    formationFr: string(input.formationFr, 'about.formationFr', { max: 200 }),
    formationEn: string(input.formationEn, 'about.formationEn', { max: 200 }),
    phone: normalizePhone(input.phone, 'about.phone'),
    email,
  };
}

export function validateContentSection(section, value) {
  switch (section) {
    case 'countdownTargetISO': return offsetDateTime(value, 'countdownTargetISO');
    case 'days': return validateDays(value);
    case 'sessions': return validateSessions(value);
    case 'sejour': return validateSejour(value);
    case 'paris': return validateParis(value);
    case 'audios': return validateAudios(value);
    case 'about': return validateAbout(value);
    default: fail('section', 'unknown_section', 'unknown_section');
  }
}
