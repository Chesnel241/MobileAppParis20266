// Contenu éditable par défaut (repli hors-ligne).
// Même forme que ce que renvoie l'API /api/content. L'organisateur modifie ces éléments
// depuis le panneau d'administration web ; l'app les récupère au démarrage.
// Les dates de session sont des chaînes ISO locales ("2026-07-24T16:00").

export const defaultContent = {
  countdownTargetISO: "2026-07-24T16:00",

  days: [
    { id: "d1", dFr: "Ven 24 Juil", dEn: "Fri Jul 24", fullFr: "Vendredi 24 juillet", fullEn: "Friday, July 24", phase: "convention" },
    { id: "d2", dFr: "Sam 25 Juil", dEn: "Sat Jul 25", fullFr: "Samedi 25 juillet", fullEn: "Saturday, July 25", phase: "convention" },
    { id: "d3", dFr: "Dim 26 Juil", dEn: "Sun Jul 26", fullFr: "Dimanche 26 juillet", fullEn: "Sunday, July 26", phase: "convention" },
    { id: "d4", dFr: "Lun 27 Juil", dEn: "Mon Jul 27", fullFr: "Lundi 27 juillet", fullEn: "Monday, July 27", phase: "formation" },
    { id: "d5", dFr: "Mar 28 Juil", dEn: "Tue Jul 28", fullFr: "Mardi 28 juillet", fullEn: "Tuesday, July 28", phase: "formation" },
    { id: "d6", dFr: "Mer 29 Juil", dEn: "Wed Jul 29", fullFr: "Mercredi 29 juillet", fullEn: "Wednesday, July 29", phase: "formation" },
    { id: "d7", dFr: "Jeu 30 Juil", dEn: "Thu Jul 30", fullFr: "Jeudi 30 juillet", fullEn: "Thursday, July 30", phase: "formation" },
    { id: "d8", dFr: "Ven 31 Juil", dEn: "Fri Jul 31", fullFr: "Vendredi 31 juillet", fullEn: "Friday, July 31", phase: "formation" },
  ],

  sessions: [
    { id: "s1", dayId: "d1", startISO: "2026-07-24T16:00", endISO: "2026-07-24T17:30", tFr: "Cérémonie d'ouverture", tEn: "Opening ceremony", spFr: "Orateur principal", spEn: "Main speaker", locFr: "Amphithéâtre Novotel, Charenton-le-Pont", locEn: "Novotel Amphitheatre, Charenton-le-Pont", tag: "ceremonie" },
    { id: "s2", dayId: "d1", startISO: "2026-07-24T17:30", endISO: "2026-07-24T18:15", tFr: "Louange & adoration", tEn: "Worship & praise", spFr: "Équipe de louange LWMF&D", spEn: "LWMF&D worship team", locFr: "Amphithéâtre Novotel, Charenton-le-Pont", locEn: "Novotel Amphitheatre, Charenton-le-Pont", tag: "louange" },
    { id: "s3", dayId: "d1", startISO: "2026-07-24T18:15", endISO: "2026-07-24T19:45", tFr: "Message d'ouverture : Né mort, mourir vivant", tEn: "Opening message: Dead in Christ, Alive Forever", spFr: "Orateur principal", spEn: "Main speaker", locFr: "Amphithéâtre Novotel, Charenton-le-Pont", locEn: "Novotel Amphitheatre, Charenton-le-Pont", tag: "enseignement" },
    { id: "s4", dayId: "d1", startISO: "2026-07-24T19:45", endISO: "2026-07-24T21:00", tFr: "Accueil & fraternisation", tEn: "Welcome reception", spFr: "", spEn: "", locFr: "Amphithéâtre Novotel, Charenton-le-Pont", locEn: "Novotel Amphitheatre, Charenton-le-Pont", tag: "accueil" },
    { id: "s5", dayId: "d2", startISO: "2026-07-25T09:00", endISO: "2026-07-25T10:00", tFr: "Temps de prière matinale", tEn: "Morning prayer time", spFr: "", spEn: "", locFr: "Amphithéâtre Novotel, Charenton-le-Pont", locEn: "Novotel Amphitheatre, Charenton-le-Pont", tag: "priere" },
    { id: "s6", dayId: "d2", startISO: "2026-07-25T10:00", endISO: "2026-07-25T12:00", tFr: "Enseignement principal", tEn: "Main teaching session", spFr: "Orateur principal", spEn: "Main speaker", locFr: "Amphithéâtre Novotel, Charenton-le-Pont", locEn: "Novotel Amphitheatre, Charenton-le-Pont", tag: "enseignement" },
    { id: "s7", dayId: "d2", startISO: "2026-07-25T12:00", endISO: "2026-07-25T13:30", tFr: "Pause déjeuner", tEn: "Lunch break", spFr: "", spEn: "", locFr: "Amphithéâtre Novotel, Charenton-le-Pont", locEn: "Novotel Amphitheatre, Charenton-le-Pont", tag: "pause" },
    { id: "s8", dayId: "d2", startISO: "2026-07-25T13:30", endISO: "2026-07-25T15:30", tFr: "Ateliers parallèles", tEn: "Parallel workshops", spFr: "", spEn: "", locFr: "Amphithéâtre Novotel, Charenton-le-Pont", locEn: "Novotel Amphitheatre, Charenton-le-Pont", tag: "atelier" },
    { id: "s9", dayId: "d2", startISO: "2026-07-25T15:30", endISO: "2026-07-25T17:00", tFr: "Session de louange", tEn: "Worship session", spFr: "Équipe de louange LWMF&D", spEn: "LWMF&D worship team", locFr: "Amphithéâtre Novotel, Charenton-le-Pont", locEn: "Novotel Amphitheatre, Charenton-le-Pont", tag: "louange" },
    { id: "s10", dayId: "d3", startISO: "2026-07-26T10:00", endISO: "2026-07-26T12:00", tFr: "Culte dominical", tEn: "Sunday service", spFr: "Orateur principal", spEn: "Main speaker", locFr: "Amphithéâtre Novotel, Charenton-le-Pont", locEn: "Novotel Amphitheatre, Charenton-le-Pont", tag: "culte" },
  ],

  sejour: {
    hotelName: "Novotel Paris Est",
    hotelPhotoUrl: "",
    hotelMapQuery: "Novotel+Paris+Est+Charenton",
    room: "Double Standard",
    checkin: "24 juillet, 14h00",
    checkout: "31 juillet, 11h00",
    practical: {
      wifi: { fr: "LWMFD-Convention / mdp: paris2026", en: "LWMFD-Convention / pwd: paris2026" },
      breakfast: { fr: "7h00 - 10h00, Restaurant de l'hôtel", en: "7:00 AM - 10:00 AM, Hotel restaurant" },
      shuttle: { fr: "Disponible vers Créteil, voir planning", en: "Available to Créteil, see schedule" },
      reception: { fr: "+33 1 23 45 67 89", en: "+33 1 23 45 67 89" },
    },
    venues: {
      novotel: { nameFr: "Novotel Paris Est", nameEn: "Novotel Paris Est", addressFr: "1 Avenue de la République, 94220 Charenton-le-Pont", addressEn: "1 Avenue de la République, 94220 Charenton-le-Pont", mapQuery: "Novotel+Paris+Est+Charenton" },
      creteil: { nameFr: "Centre de formation - Créteil", nameEn: "Training center - Créteil", addressFr: "Créteil, Île-de-France", addressEn: "Créteil, Greater Paris", mapQuery: "Creteil+France" },
    },
  },

  paris: {
    transport: {
      line1: { fr: "🚇 Métro - Lignes 1, 8 à proximité", en: "🚇 Metro - Lines 1, 8 nearby" },
      line2: { fr: "🚌 Bus - Lignes 24, 111", en: "🚌 Bus - Lines 24, 111" },
      line3: { fr: "🚊 RER A - Station Liberté", en: "🚊 RER A - Liberté station" },
    },
    landmarks: [
      { id: "l1", nameFr: "Tour Eiffel", nameEn: "Eiffel Tower", descFr: "Monument emblématique de Paris", descEn: "Iconic Paris monument", mapQuery: "Tour+Eiffel+Paris" },
      { id: "l2", nameFr: "Arc de Triomphe", nameEn: "Arc de Triomphe", descFr: "Monument historique sur les Champs-Élysées", descEn: "Historic monument on Champs-Élysées", mapQuery: "Arc+de+Triomphe+Paris" },
      { id: "l3", nameFr: "Notre-Dame", nameEn: "Notre-Dame", descFr: "Cathédrale gothique emblématique", descEn: "Iconic Gothic cathedral", mapQuery: "Notre+Dame+Paris" },
      { id: "l4", nameFr: "Montmartre", nameEn: "Montmartre", descFr: "Quartier artistique et bohème", descEn: "Artistic and bohemian neighborhood", mapQuery: "Montmartre+Paris" },
    ],
  },

  audios: [
    { id: "a1", titleFr: "Message d'ouverture - Jour 1", titleEn: "Opening message - Day 1", duration: "45:30", url: "" },
    { id: "a2", titleFr: "Enseignement - La foi", titleEn: "Teaching - Faith", duration: "38:15", url: "" },
    { id: "a3", titleFr: "Louange et adoration", titleEn: "Worship and praise", duration: "52:00", url: "" },
  ],

  about: {
    datesFr: "24 - 31 juillet 2026",
    datesEn: "July 24 - 31, 2026",
    conventionFr: "Convention : 24-26 juillet",
    conventionEn: "Convention: July 24-26",
    formationFr: "Formation : 27-31 juillet",
    formationEn: "Training: July 27-31",
    phone: "+33 6 76 56 51 57",
    email: "sfdrm.lwm@gmail.com",
  },
};

// Prochaine session à partir de maintenant (utilise startISO)
export function upcomingSessions(content, limit = 3) {
  const now = new Date();
  return (content.sessions || [])
    .filter(s => new Date(s.startISO) > now)
    .sort((a, b) => new Date(a.startISO) - new Date(b.startISO))
    .slice(0, limit);
}

// "16h00 - 17h30" à partir des ISO
export function sessionTimeRange(session) {
  const fmt = (iso) => {
    const d = new Date(iso);
    return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
  };
  return `${fmt(session.startISO)} - ${fmt(session.endISO)}`;
}
