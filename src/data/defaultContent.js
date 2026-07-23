// Contenu éditable par défaut (repli hors-ligne).
// Même forme que ce que renvoie l'API /api/content. L'organisateur modifie ces éléments
// depuis le panneau d'administration web ; l'app les récupère au démarrage.
// Les dates incluent explicitement le fuseau de Paris en juillet (UTC+02:00).

export const defaultContent = {
  countdownTargetISO: "2026-07-24T16:00+02:00",

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
    { id: "d1s1",dayId: "d1",startISO: "2026-07-24T14:35+02:00",endISO: "2026-07-24T16:00+02:00",tFr: "Mise en place et installation des invités",tEn: "Setup and seating of guests",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "accueil" },
    { id: "d1s2",dayId: "d1",startISO: "2026-07-24T16:00+02:00",endISO: "2026-07-24T16:03+02:00",tFr: "Animation communication • Prière d'ouverture",tEn: "Announcements • Opening prayer",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "priere" },
    { id: "d1s3",dayId: "d1",startISO: "2026-07-24T16:03+02:00",endISO: "2026-07-24T16:06+02:00",tFr: "Prière pour la nation",tEn: "Prayer for the nation",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "priere" },
    { id: "d1s4",dayId: "d1",startISO: "2026-07-24T16:06+02:00",endISO: "2026-07-24T16:09+02:00",tFr: "Prière pour les autorités administratives",tEn: "Prayer for the civil authorities",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "priere" },
    { id: "d1s5",dayId: "d1",startISO: "2026-07-24T16:09+02:00",endISO: "2026-07-24T16:12+02:00",tFr: "Prière pour les autorités religieuses",tEn: "Prayer for the religious authorities",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "priere" },
    { id: "d1s6",dayId: "d1",startISO: "2026-07-24T16:12+02:00",endISO: "2026-07-24T16:15+02:00",tFr: "Prière pour la propagation de l'Évangile",tEn: "Prayer for the spread of the Gospel",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "priere" },
    { id: "d1s7",dayId: "d1",startISO: "2026-07-24T16:15+02:00",endISO: "2026-07-24T16:20+02:00",tFr: "Lecture de l'autorisation de manifestation publique",tEn: "Reading of the public gathering authorisation",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "accueil" },
    { id: "d1s8",dayId: "d1",startISO: "2026-07-24T16:20+02:00",endISO: "2026-07-24T16:25+02:00",tFr: "Exécution de l'hymne national de la France",tEn: "French national anthem",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "ceremonie" },
    { id: "d1s9",dayId: "d1",startISO: "2026-07-24T16:25+02:00",endISO: "2026-07-24T16:35+02:00",tFr: "Communication élément 1",tEn: "Announcements, part 1",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "accueil" },
    { id: "d1s10",dayId: "d1",startISO: "2026-07-24T16:35+02:00",endISO: "2026-07-24T16:45+02:00",tFr: "Mot de bienvenue du coordonnateur de la diaspora",tEn: "Welcome address by the diaspora coordinator",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "ceremonie" },
    { id: "d1s11",dayId: "d1",startISO: "2026-07-24T16:45+02:00",endISO: "2026-07-24T16:55+02:00",tFr: "Communication élément 2",tEn: "Announcements, part 2",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "accueil" },
    { id: "d1s12",dayId: "d1",startISO: "2026-07-24T17:00+02:00",endISO: "2026-07-24T18:00+02:00",tFr: "Cérémonie d'ouverture",tEn: "Opening ceremony",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "ceremonie" },
    { id: "d1s13",dayId: "d1",startISO: "2026-07-24T18:00+02:00",endISO: "2026-07-24T18:15+02:00",tFr: "Présentation des délégations présentes",tEn: "Presentation of the delegations",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "ceremonie" },
    { id: "d1s14",dayId: "d1",startISO: "2026-07-24T18:15+02:00",endISO: "2026-07-24T18:20+02:00",tFr: "Ouverture officielle de la convention par le PA",tEn: "Official opening of the convention by the PA",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "ceremonie" },
    { id: "d1s15",dayId: "d1",startISO: "2026-07-24T18:20+02:00",endISO: "2026-07-24T20:00+02:00",tFr: "Prédication inaugurale",tEn: "Inaugural preaching",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "enseignement" },
    { id: "d1s16",dayId: "d1",startISO: "2026-07-24T20:00+02:00",endISO: "2026-07-24T20:30+02:00",tFr: "Informations générales et prière de clôture",tEn: "General information and closing prayer",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "priere" },
    { id: "d1s17",dayId: "d1",startISO: "2026-07-24T20:30+02:00",endISO: "2026-07-24T21:15+02:00",tFr: "Repas (dîner)",tEn: "Dinner",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "pause" },
    { id: "d2s1",dayId: "d2",startISO: "2026-07-25T07:00+02:00",endISO: "2026-07-25T08:30+02:00",tFr: "Petit-déjeuner",tEn: "Breakfast",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "pause" },
    { id: "d2s2",dayId: "d2",startISO: "2026-07-25T08:30+02:00",endISO: "2026-07-25T11:30+02:00",tFr: "L'urgence de la convocation : les jugements exercés dans le passé",tEn: "The urgency of the call: judgements of the past",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "enseignement" },
    { id: "d2s3",dayId: "d2",startISO: "2026-07-25T11:30+02:00",endISO: "2026-07-25T12:00+02:00",tFr: "Pause + déjeuner",tEn: "Break and lunch",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "pause" },
    { id: "d2s4",dayId: "d2",startISO: "2026-07-25T12:00+02:00",endISO: "2026-07-25T15:00+02:00",tFr: "Les origines de la mort • Le sort du témoin",tEn: "The origins of death • The fate of the witness",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "enseignement" },
    { id: "d2s5",dayId: "d2",startISO: "2026-07-25T15:00+02:00",endISO: "2026-07-25T16:00+02:00",tFr: "La destination des morts",tEn: "The destination of the dead",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "enseignement" },
    { id: "d2s6",dayId: "d2",startISO: "2026-07-25T16:30+02:00",endISO: "2026-07-25T19:00+02:00",tFr: "De la mort à la vie",tEn: "From death to life",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "enseignement" },
    { id: "d2s7",dayId: "d2",startISO: "2026-07-25T19:00+02:00",endISO: "2026-07-25T20:00+02:00",tFr: "Dîner",tEn: "Dinner",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "pause" },
    { id: "d3s1",dayId: "d3",startISO: "2026-07-26T07:15+02:00",endISO: "2026-07-26T08:15+02:00",tFr: "Petit-déjeuner",tEn: "Breakfast",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "pause" },
    { id: "d3s2",dayId: "d3",startISO: "2026-07-26T08:00+02:00",endISO: "2026-07-26T08:30+02:00",tFr: "Installation des matériels et mise en place des différents ministères",tEn: "Equipment setup and ministry teams in place",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "accueil" },
    { id: "d3s3",dayId: "d3",startISO: "2026-07-26T08:30+02:00",endISO: "2026-07-26T09:00+02:00",tFr: "Accueil des participants et animations",tEn: "Welcome of participants and activities",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "accueil" },
    { id: "d3s4",dayId: "d3",startISO: "2026-07-26T09:00+02:00",endISO: "2026-07-26T09:05+02:00",tFr: "Début du culte",tEn: "Start of the service",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "culte" },
    { id: "d3s5",dayId: "d3",startISO: "2026-07-26T09:05+02:00",endISO: "2026-07-26T09:15+02:00",tFr: "Sujet prière",tEn: "Prayer topic",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "priere" },
    { id: "d3s6",dayId: "d3",startISO: "2026-07-26T09:15+02:00",endISO: "2026-07-26T09:25+02:00",tFr: "Cantiques",tEn: "Hymns",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "louange" },
    { id: "d3s7",dayId: "d3",startISO: "2026-07-26T09:25+02:00",endISO: "2026-07-26T09:50+02:00",tFr: "Témoignages d'hier",tEn: "Yesterday's testimonies",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "culte" },
    { id: "d3s8",dayId: "d3",startISO: "2026-07-26T09:50+02:00",endISO: "2026-07-26T10:15+02:00",tFr: "Prestation des plus petits",tEn: "Children's performance",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "culte" },
    { id: "d3s9",dayId: "d3",startISO: "2026-07-26T10:15+02:00",endISO: "2026-07-26T10:25+02:00",tFr: "Communication",tEn: "Announcements",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "accueil" },
    { id: "d3s10",dayId: "d3",startISO: "2026-07-26T10:55+02:00",endISO: "2026-07-26T11:10+02:00",tFr: "Louanges",tEn: "Praise",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "louange" },
    { id: "d3s11",dayId: "d3",startISO: "2026-07-26T11:10+02:00",endISO: "2026-07-26T13:00+02:00",tFr: "Sermon",tEn: "Sermon",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "enseignement" },
    { id: "d3s12",dayId: "d3",startISO: "2026-07-26T13:00+02:00",endISO: "2026-07-26T13:10+02:00",tFr: "Informations générales et prière de clôture",tEn: "General information and closing prayer",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "priere" },
    { id: "d3s13",dayId: "d3",startISO: "2026-07-26T13:15+02:00",endISO: "2026-07-26T14:15+02:00",tFr: "Mini concert",tEn: "Mini concert",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "louange" },
    { id: "d3s14",dayId: "d3",startISO: "2026-07-26T14:20+02:00",endISO: "2026-07-26T15:00+02:00",tFr: "Déjeuner",tEn: "Lunch",spFr: "",spEn: "",locFr: "Amphithéâtre Novotel, Charenton-le-Pont",locEn: "Novotel Amphitheatre, Charenton-le-Pont",tag: "pause" },
  ],

  sejour: {
    hotelName: "Novotel Paris Charenton le Pont",
    hotelPhotoUrl: "",
    hotelMapQuery: "Novotel+Paris+Charenton+le+Pont",
    room: "Double Standard",
    checkin: "24 juillet, 14h00",
    checkout: "31 juillet, 11h00",
    practical: {
      wifi: { fr: "LWMFD-Convention / mdp: paris2026", en: "LWMFD-Convention / pwd: paris2026" },
      breakfast: { fr: "7h00 - 10h00, Restaurant de l'hôtel", en: "7:00 AM - 10:00 AM, Hotel restaurant" },
      shuttle: { fr: "Disponible vers Créteil, voir planning", en: "Available to Créteil, see schedule" },
      reception: { fr: "+33 1 46 76 60 60", en: "+33 1 46 76 60 60" },
    },
    venues: {
      novotel: { nameFr: "Novotel Paris Charenton le Pont", nameEn: "Novotel Paris Charenton le Pont", addressFr: "3-5 place des Marseillais, 94227 Charenton-le-Pont", addressEn: "3-5 place des Marseillais, 94227 Charenton-le-Pont", mapQuery: "Novotel+Paris+Charenton+le+Pont" },
      creteil: { nameFr: "Centre de formation - Créteil", nameEn: "Training center - Créteil", addressFr: "Créteil, Île-de-France", addressEn: "Créteil, Greater Paris", mapQuery: "Creteil+France" },
    },
  },

  paris: {
    transport: {
      line1: { fr: "🚇 Métro ligne 8 - station Liberté", en: "🚇 Metro line 8 - Liberté station" },
      line2: { fr: "🗺️ Vérifiez votre itinéraire avant le départ", en: "🗺️ Check your route before departure" },
      line3: { fr: "♿ Consultez Île-de-France Mobilités pour l'accessibilité", en: "♿ Check Île-de-France Mobilités for accessibility" },
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
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d).replace(':', 'h');
  };
  return `${fmt(session.startISO)} - ${fmt(session.endISO)}`;
}
