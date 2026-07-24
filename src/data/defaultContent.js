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
      line1: {
        fr: "🚇 Ligne 8 du métro depuis Charenton-Écoles",
        en: "🚇 Metro line 8 from Charenton-Écoles"
      },
      line2: {
        fr: "🗺️ Touchez une carte pour l’itinéraire depuis votre position",
        en: "🗺️ Tap a map for directions from your location"
      },
      line3: {
        fr: "♿ Consultez Île-de-France Mobilités pour l’accessibilité",
        en: "♿ Check Île-de-France Mobilités for accessibility"
      }
    },
    categories: [
      {
        id: "proximite",
        titleFr: "À proximité de Charenton",
        titleEn: "Near Charenton",
        descFr: "Sites culturels et espaces de nature à quelques stations, sur ou autour de la ligne 8 du métro.",
        descEn: "Cultural sites and green spaces a few stops away, on or around metro line 8.",
        sites: [
          {
            id: "bercy",
            nameFr: "Parc de Bercy",
            nameEn: "Parc de Bercy",
            descFr: "L’un des plus beaux espaces verts de l’est parisien, aménagé sur l’ancien site des entrepôts de vin. Vastes pelouses, jardins thématiques, passerelles et bassins, à deux pas de Bercy Village.",
            descEn: "One of the loveliest green spaces in eastern Paris, laid out on the former wine warehouses. Wide lawns, themed gardens, footbridges and ponds, next to Bercy Village.",
            address: "128 Quai de Bercy, 75012 Paris",
            transitFr: "Métro ligne 8 : Charenton-Écoles → Bercy · 10–15 min",
            transitEn: "Metro line 8: Charenton-Écoles → Bercy · 10–15 min",
            priceFr: "Accès gratuit, 24h/24",
            priceEn: "Free, open 24/7",
            photo: "/paris/bercy.jpg",
            mapQuery: "Parc+de+Bercy+Paris"
          },
          {
            id: "vincennes",
            nameFr: "Château de Vincennes",
            nameEn: "Château de Vincennes",
            descFr: "L’un des plus importants châteaux médiévaux de France et ancienne résidence royale. Il possède le plus haut donjon fortifié d’Europe (52 m) et une chapelle royale.",
            descEn: "One of France’s foremost medieval castles and a former royal residence, home to Europe’s tallest fortified keep (52 m) and a royal chapel.",
            address: "Avenue de Paris, 94300 Vincennes",
            transitFr: "Métro ligne 1 : Château de Vincennes (terminus) · 15–20 min",
            transitEn: "Metro line 1: Château de Vincennes (terminus) · 15–20 min",
            priceFr: "11–13 €",
            priceEn: "€11–13",
            photo: "/paris/vincennes.jpg",
            mapQuery: "Château+de+Vincennes"
          },
          {
            id: "parc-floral",
            nameFr: "Parc Floral de Paris",
            nameEn: "Parc Floral de Paris",
            descFr: "Au cœur du bois de Vincennes, un magnifique jardin botanique réputé pour ses collections florales : plus de 3 000 espèces, fontaines et jardins thématiques.",
            descEn: "In the heart of the Bois de Vincennes, a magnificent botanical garden famed for its floral collections: over 3,000 species, fountains and themed gardens.",
            address: "Route de la Pyramide, 75012 Paris",
            transitFr: "Métro ligne 1 : Château de Vincennes, puis 10 min à pied · 20 min",
            transitEn: "Metro line 1: Château de Vincennes, then a 10-min walk · 20 min",
            priceFr: "3 €",
            priceEn: "€3",
            photo: "/paris/parc-floral.jpg",
            mapQuery: "Parc+Floral+de+Paris"
          },
          {
            id: "zoo",
            nameFr: "Parc Zoologique de Paris",
            nameEn: "Paris Zoological Park",
            descFr: "Le « Zoo de Vincennes » accueille plus de 2 000 animaux des cinq continents dans des biozones reconstituées. Son Grand Rocher, emblème du parc, est visible de loin.",
            descEn: "The \"Vincennes Zoo\" is home to over 2,000 animals from five continents across recreated biozones. Its Grand Rocher is the park’s landmark, visible from afar.",
            address: "Avenue Daumesnil, 75012 Paris",
            transitFr: "Métro ligne 8 : Charenton-Écoles → Porte Dorée · 15–20 min",
            transitEn: "Metro line 8: Charenton-Écoles → Porte Dorée · 15–20 min",
            priceFr: "22 €",
            priceEn: "€22",
            photo: "/paris/zoo.jpg",
            mapQuery: "Parc+Zoologique+de+Paris"
          },
          {
            id: "bois-vincennes",
            nameFr: "Bois de Vincennes",
            nameEn: "Bois de Vincennes",
            descFr: "Le plus grand espace vert de Paris (près de 1 000 hectares) : lacs, sentiers de promenade, jardins et vastes espaces naturels, idéaux pour les pique-niques et les sorties de groupe.",
            descEn: "Paris’s largest green space (nearly 1,000 hectares): lakes, walking trails, gardens and vast natural areas, perfect for picnics and group outings.",
            address: "Bois de Vincennes, Paris",
            transitFr: "Métro ligne 1 : Château de Vincennes · ~15 min",
            transitEn: "Metro line 1: Château de Vincennes · ~15 min",
            priceFr: "Accès gratuit",
            priceEn: "Free",
            photo: "/paris/bois-vincennes.jpg",
            mapQuery: "Bois+de+Vincennes"
          },
          {
            id: "aquarium",
            nameFr: "Aquarium Tropical – Porte Dorée",
            nameEn: "Tropical Aquarium – Porte Dorée",
            descFr: "Installé dans le prestigieux Palais de la Porte Dorée (1931), l’un des plus anciens aquariums de France : plus de 15 000 animaux aquatiques, poissons, coraux et tortues des régions tropicales.",
            descEn: "Set in the prestigious Palais de la Porte Dorée (1931), one of France’s oldest aquariums: over 15,000 aquatic animals — fish, corals and turtles from tropical regions.",
            address: "293 Avenue Daumesnil, 75012 Paris",
            transitFr: "Métro ligne 8 : Charenton-Écoles → Porte Dorée · ~15 min",
            transitEn: "Metro line 8: Charenton-Écoles → Porte Dorée · ~15 min",
            priceFr: "7–10 €",
            priceEn: "€7–10",
            photo: "/paris/aquarium.jpg",
            mapQuery: "Aquarium+tropical+Porte+Dorée+Paris"
          }
        ]
      },
      {
        id: "familles",
        titleFr: "En famille, avec les enfants",
        titleEn: "For families and children",
        descFr: "Des activités pensées pour les enfants et les parents, tout près de Charenton-le-Pont.",
        descEn: "Activities for children and parents, right next to Charenton-le-Pont.",
        sites: [
          {
            id: "smile-world",
            nameFr: "Smile World Bercy 2",
            nameEn: "Smile World Bercy 2",
            descFr: "Grand parc de loisirs intérieur (4 000 m²) : karting indoor, laser game, trampoline park, arcade et espace de restauration. Idéal les jours de pluie ou pour une sortie pleine d’énergie.",
            descEn: "Large indoor leisure park (4,000 m²): indoor karting, laser game, trampoline park, arcade and food court. Ideal on rainy days or for a high-energy outing.",
            address: "Centre commercial Bercy 2, Charenton-le-Pont",
            transitFr: "Facile en voiture (parking gratuit 3 h) et en transports · Ouvert 7j/7",
            transitEn: "Easy by car (free 3-hr parking) and public transport · Open daily",
            priceFr: "Selon l’activité",
            priceEn: "Varies by activity",
            photo: "",
            mapQuery: "Smile+World+Bercy+2+Charenton"
          },
          {
            id: "parentaise",
            nameFr: "La Parent’aise",
            nameEn: "La Parent’aise",
            descFr: "Lieu convivial dédié à la rencontre entre enfants de moins de 6 ans et parents : ateliers d’éveil sensoriel, parcours moteurs et moments de jeu dans un environnement sécurisé.",
            descEn: "A welcoming space for under-6s and their parents: sensory workshops, motor-skills courses and playtime in a safe environment.",
            address: "Charenton-le-Pont (adresse à confirmer auprès de la mairie)",
            transitFr: "Enfants de moins de 6 ans accompagnés de leurs parents",
            transitEn: "Children under 6 with their parents",
            priceFr: "",
            priceEn: "",
            photo: "",
            mapQuery: "Mairie+de+Charenton-le-Pont"
          },
          {
            id: "aires-jeux",
            nameFr: "Aires de jeux de Charenton",
            nameEn: "Charenton playgrounds",
            descFr: "Plusieurs aires de jeux en plein air réparties dans la ville : structures, toboggans, balançoires, city-stades, skate-parks et tables de ping-pong. Généralement en accès libre.",
            descEn: "Several outdoor playgrounds across town: play structures, slides, swings, mini-pitches, skate parks and ping-pong tables. Generally free to access.",
            address: "Diverses aires dans la commune (voir le site de la mairie)",
            transitFr: "Accès libre",
            transitEn: "Free access",
            priceFr: "Gratuit",
            priceEn: "Free",
            photo: "",
            mapQuery: "Charenton-le-Pont"
          }
        ]
      },
      {
        id: "monuments",
        titleFr: "Monuments emblématiques",
        titleEn: "Iconic landmarks",
        descFr: "Les icônes de la capitale, un peu plus éloignées, pour découvrir le Paris de carte postale.",
        descEn: "The capital’s icons, a little farther out, for the postcard Paris.",
        sites: [
          {
            id: "tour-eiffel",
            nameFr: "Tour Eiffel",
            nameEn: "Eiffel Tower",
            descFr: "Symbole universel de Paris. De jour comme de nuit, son architecture impressionnante attire des millions de visiteurs. Un passage obligé.",
            descEn: "The universal symbol of Paris. By day or night, its striking architecture draws millions of visitors. A must-see.",
            address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris",
            transitFr: "Métro ligne 6 : Bir-Hakeim · ligne 9 : Trocadéro · RER C : Champ de Mars – Tour Eiffel",
            transitEn: "Metro line 6: Bir-Hakeim · line 9: Trocadéro · RER C: Champ de Mars – Tour Eiffel",
            priceFr: "14,80–36,70 € adulte · 3,80–18,40 € jeune · parvis et jardins gratuits",
            priceEn: "€14.80–36.70 adult · €3.80–18.40 youth · esplanade and gardens free",
            photo: "/paris/tour-eiffel.jpg",
            mapQuery: "Tour+Eiffel+Paris"
          },
          {
            id: "louvre",
            nameFr: "Musée du Louvre",
            nameEn: "Louvre Museum",
            descFr: "Le plus grand musée d’art et d’antiquités du monde, ancienne résidence royale. La Joconde, la Vénus de Milo et la pyramide de verre, devenue une icône moderne.",
            descEn: "The world’s largest art and antiquities museum, a former royal palace. The Mona Lisa, the Venus de Milo and the glass pyramid, now a modern icon.",
            address: "Rue de Rivoli, 75001 Paris",
            transitFr: "Métro lignes 1 et 7 : Palais-Royal – Musée du Louvre · ligne 14 : Pyramides",
            transitEn: "Metro lines 1 & 7: Palais-Royal – Musée du Louvre · line 14: Pyramides",
            priceFr: "15 € · gratuit pour les moins de 18 ans et les moins de 26 ans résidents de l’UE",
            priceEn: "€15 · free for under-18s and EU residents under 26",
            photo: "/paris/louvre.jpg",
            mapQuery: "Musée+du+Louvre+Paris"
          },
          {
            id: "arc-triomphe",
            nameFr: "Arc de Triomphe",
            nameEn: "Arc de Triomphe",
            descFr: "Au centre de la place Charles-de-Gaulle, il rend hommage aux armées françaises. Du haut de sa terrasse, vue sur les Champs-Élysées et les douze avenues qui rayonnent.",
            descEn: "At the centre of Place Charles-de-Gaulle, it honours the French armies. From its terrace, sweeping views over the Champs-Élysées and the twelve radiating avenues.",
            address: "Place Charles de Gaulle, 75008 Paris",
            transitFr: "Métro lignes 1, 2, 6 : Charles de Gaulle – Étoile · RER A : Charles de Gaulle – Étoile",
            transitEn: "Metro lines 1, 2, 6: Charles de Gaulle – Étoile · RER A: Charles de Gaulle – Étoile",
            priceFr: "13 € · accès libre à la Tombe du Soldat inconnu",
            priceEn: "€13 · free access to the Tomb of the Unknown Soldier",
            photo: "/paris/arc-triomphe.jpg",
            mapQuery: "Arc+de+Triomphe+Paris"
          },
          {
            id: "notre-dame",
            nameFr: "Cathédrale Notre-Dame",
            nameEn: "Notre-Dame Cathedral",
            descFr: "Chef-d’œuvre de l’architecture gothique et l’un des monuments les plus visités de Paris. Symbole fort de l’histoire et de la spiritualité françaises.",
            descEn: "A masterpiece of Gothic architecture and one of the most visited monuments in Paris. A powerful symbol of French history and spirituality.",
            address: "Parvis Notre-Dame – Place Jean-Paul II, 75004 Paris",
            transitFr: "Métro ligne 4 : Cité ou Saint-Michel · RER B et C : Saint-Michel – Notre-Dame",
            transitEn: "Metro line 4: Cité or Saint-Michel · RER B & C: Saint-Michel – Notre-Dame",
            priceFr: "Accès à la cathédrale gratuit",
            priceEn: "Free entry to the cathedral",
            photo: "/paris/notre-dame.jpg",
            mapQuery: "Notre-Dame+de+Paris"
          }
        ]
      },
      {
        id: "souvenirs",
        titleFr: "Où rapporter un souvenir",
        titleEn: "Where to buy souvenirs",
        descFr: "Quelques adresses pour trouver des souvenirs authentiques et de qualité.",
        descEn: "A few places to find authentic, quality souvenirs.",
        sites: [
          {
            id: "galeries-lafayette",
            nameFr: "Galeries Lafayette Haussmann",
            nameEn: "Galeries Lafayette Haussmann",
            descFr: "Plus qu’un grand magasin, une institution parisienne coiffée d’une magnifique coupole. Produits de luxe, mode et un espace dédié aux souvenirs de Paris.",
            descEn: "More than a department store, a Parisian institution crowned by a magnificent dome. Luxury goods, fashion and a dedicated Paris souvenir area.",
            address: "40 Boulevard Haussmann, 75009 Paris",
            transitFr: "Métro lignes 7 et 9 : Chaussée d’Antin – La Fayette · ligne 3 : Opéra",
            transitEn: "Metro lines 7 & 9: Chaussée d’Antin – La Fayette · line 3: Opéra",
            priceFr: "Accès gratuit · achats payants · env. 9h30–20h30",
            priceEn: "Free entry · purchases apply · approx. 9:30am–8:30pm",
            photo: "/paris/galeries-lafayette.jpg",
            mapQuery: "Galeries+Lafayette+Haussmann+Paris"
          },
          {
            id: "rue-rivoli",
            nameFr: "Rue de Rivoli",
            nameEn: "Rue de Rivoli",
            descFr: "Longeant le jardin des Tuileries et le Louvre, elle est réputée pour ses boutiques de souvenirs : reproductions d’œuvres d’art et petits objets typiques de Paris.",
            descEn: "Running along the Tuileries garden and the Louvre, it is known for its souvenir shops: art reproductions and small, typically Parisian objects.",
            address: "Du Louvre à la Place de la Concorde, 75001 Paris",
            transitFr: "Métro ligne 1 : Tuileries, Palais-Royal – Musée du Louvre, Louvre – Rivoli",
            transitEn: "Metro line 1: Tuileries, Palais-Royal – Musée du Louvre, Louvre – Rivoli",
            priceFr: "Accès libre · achats payants",
            priceEn: "Free access · purchases apply",
            photo: "/paris/rue-rivoli.jpg",
            mapQuery: "Rue+de+Rivoli+Paris"
          },
          {
            id: "montmartre",
            nameFr: "Montmartre et la Place du Tertre",
            nameEn: "Montmartre & Place du Tertre",
            descFr: "Quartier pittoresque de la Basilique du Sacré-Cœur. Autour de la place du Tertre, les artistes proposent portraits, caricatures et tableaux : des souvenirs uniques dans une ambiance bohème.",
            descEn: "The picturesque district of the Sacré-Cœur Basilica. Around Place du Tertre, artists offer portraits, caricatures and paintings: unique souvenirs in a bohemian atmosphere.",
            address: "18e arrondissement de Paris",
            transitFr: "Métro ligne 2 : Anvers, Pigalle · ligne 12 : Abbesses · funiculaire depuis Anvers",
            transitEn: "Metro line 2: Anvers, Pigalle · line 12: Abbesses · funicular from Anvers",
            priceFr: "Accès libre · achats et funiculaire payants",
            priceEn: "Free access · purchases and funicular apply",
            photo: "/paris/montmartre.jpg",
            mapQuery: "Place+du+Tertre+Montmartre+Paris"
          }
        ]
      }
    ]
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
