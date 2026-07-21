const text = (value, max = 500) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;

const optionalText = (value, max = 500) =>
  value === '' || value == null || text(value, max);

const isoWithTimezone = (value) =>
  text(value, 40) &&
  /(Z|[+-]\d{2}:\d{2})$/i.test(value) &&
  Number.isFinite(Date.parse(value));

const bilingual = (value, max = 500) =>
  value && typeof value === 'object' && text(value.fr, max) && text(value.en, max);

const mapLocation = (value) =>
  value &&
  typeof value === 'object' &&
  text(value.nameFr) &&
  text(value.nameEn) &&
  text(value.addressFr) &&
  text(value.addressEn) &&
  text(value.mapQuery);

const mediaPath = (value) =>
  typeof value === 'string' &&
  (value.startsWith('/media/') || /^https:\/\//i.test(value));

export function validateContent(candidate, { requireCompleteSchedule = true } = {}) {
  const errors = [];
  const fail = (path, message) => errors.push(`${path}: ${message}`);

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { ok: false, errors: ['content: objet attendu'] };
  }

  if (!isoWithTimezone(candidate.countdownTargetISO)) {
    fail('countdownTargetISO', 'date ISO avec fuseau horaire requise');
  }

  const days = candidate.days;
  if (!Array.isArray(days) || days.length < 1 || days.length > 14) {
    fail('days', 'tableau de 1 à 14 jours requis');
  }
  const dayIds = new Set();
  if (Array.isArray(days)) {
    days.forEach((day, index) => {
      const path = `days[${index}]`;
      if (!day || typeof day !== 'object') return fail(path, 'objet attendu');
      if (!text(day.id, 40)) fail(`${path}.id`, 'identifiant requis');
      else if (dayIds.has(day.id)) fail(`${path}.id`, 'identifiant dupliqué');
      else dayIds.add(day.id);
      for (const key of ['dFr', 'dEn', 'fullFr', 'fullEn', 'phase']) {
        if (!text(day[key], 120)) fail(`${path}.${key}`, 'texte requis');
      }
    });
  }

  const sessions = candidate.sessions;
  if (!Array.isArray(sessions) || sessions.length < 1 || sessions.length > 250) {
    fail('sessions', 'tableau de 1 à 250 sessions requis');
  }
  const sessionIds = new Set();
  const coveredDays = new Set();
  if (Array.isArray(sessions)) {
    sessions.forEach((session, index) => {
      const path = `sessions[${index}]`;
      if (!session || typeof session !== 'object') return fail(path, 'objet attendu');
      if (!text(session.id, 40)) fail(`${path}.id`, 'identifiant requis');
      else if (sessionIds.has(session.id)) fail(`${path}.id`, 'identifiant dupliqué');
      else sessionIds.add(session.id);
      if (!dayIds.has(session.dayId)) fail(`${path}.dayId`, 'jour inconnu');
      else coveredDays.add(session.dayId);
      if (!isoWithTimezone(session.startISO)) fail(`${path}.startISO`, 'date ISO avec fuseau requise');
      if (!isoWithTimezone(session.endISO)) fail(`${path}.endISO`, 'date ISO avec fuseau requise');
      if (isoWithTimezone(session.startISO) && isoWithTimezone(session.endISO) && Date.parse(session.endISO) <= Date.parse(session.startISO)) {
        fail(`${path}.endISO`, 'doit être postérieure au début');
      }
      for (const key of ['tFr', 'tEn', 'locFr', 'locEn', 'tag']) {
        if (!text(session[key], 300)) fail(`${path}.${key}`, 'texte requis');
      }
      for (const key of ['spFr', 'spEn']) {
        if (!optionalText(session[key], 200)) fail(`${path}.${key}`, 'texte invalide');
      }
    });
  }
  if (requireCompleteSchedule && Array.isArray(days)) {
    for (const id of dayIds) {
      if (!coveredDays.has(id)) fail('sessions', `aucune session pour ${id}`);
    }
  }

  const stay = candidate.sejour;
  if (!stay || typeof stay !== 'object') {
    fail('sejour', 'objet requis');
  } else {
    for (const key of ['hotelName', 'hotelMapQuery', 'room', 'checkin', 'checkout']) {
      if (!text(stay[key], 300)) fail(`sejour.${key}`, 'texte requis');
    }
    if (!optionalText(stay.hotelPhotoUrl, 1000) || (stay.hotelPhotoUrl && !mediaPath(stay.hotelPhotoUrl))) {
      fail('sejour.hotelPhotoUrl', 'URL HTTPS ou chemin /media attendu');
    }
    for (const key of ['wifi', 'breakfast', 'shuttle', 'reception']) {
      if (!bilingual(stay.practical?.[key], 500)) fail(`sejour.practical.${key}`, 'traductions FR/EN requises');
    }
    if (!mapLocation(stay.venues?.novotel)) fail('sejour.venues.novotel', 'lieu complet requis');
    if (!mapLocation(stay.venues?.creteil)) fail('sejour.venues.creteil', 'lieu complet requis');
  }

  const paris = candidate.paris;
  if (!paris || typeof paris !== 'object') {
    fail('paris', 'objet requis');
  } else {
    for (const key of ['line1', 'line2', 'line3']) {
      if (!bilingual(paris.transport?.[key], 500)) fail(`paris.transport.${key}`, 'traductions FR/EN requises');
    }
    if (!Array.isArray(paris.landmarks) || paris.landmarks.length < 1 || paris.landmarks.length > 30) {
      fail('paris.landmarks', 'tableau non vide requis');
    } else {
      paris.landmarks.forEach((landmark, index) => {
        for (const key of ['id', 'nameFr', 'nameEn', 'descFr', 'descEn', 'mapQuery']) {
          if (!text(landmark?.[key], 500)) fail(`paris.landmarks[${index}].${key}`, 'texte requis');
        }
      });
    }
  }

  if (!Array.isArray(candidate.audios) || candidate.audios.length > 100) {
    fail('audios', 'tableau de 0 à 100 pistes requis');
  } else {
    candidate.audios.forEach((audio, index) => {
      for (const key of ['id', 'titleFr', 'titleEn', 'duration']) {
        if (!text(audio?.[key], 300)) fail(`audios[${index}].${key}`, 'texte requis');
      }
      if (!mediaPath(audio?.url)) fail(`audios[${index}].url`, 'média réel requis');
    });
  }

  const about = candidate.about;
  if (!about || typeof about !== 'object') {
    fail('about', 'objet requis');
  } else {
    for (const key of ['datesFr', 'datesEn', 'conventionFr', 'conventionEn', 'phone']) {
      if (!text(about[key], 300)) fail(`about.${key}`, 'texte requis');
    }
    if (!text(about.email, 320) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(about.email)) {
      fail('about.email', 'adresse email invalide');
    }
  }

  return { ok: errors.length === 0, errors };
}

export function assertValidContent(candidate, options) {
  const result = validateContent(candidate, options);
  if (!result.ok) {
    const error = new Error(`Contenu invalide : ${result.errors.join('; ')}`);
    error.validationErrors = result.errors;
    throw error;
  }
  return candidate;
}
