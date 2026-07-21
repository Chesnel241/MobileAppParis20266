# Plan de mise en ligne — Convention Paris 2026

Objectif : application disponible pour l'ouverture, **vendredi 24 juillet à 16h00**.
Tout ce qui suit est à faire aujourd'hui. Durée totale estimée : **3 à 4 heures**,
dont ~1h30 de votre part et le reste en attente de validation.

---

## ⛔ À savoir avant de commencer

Le build destiné aux stores est **bloqué automatiquement** tant que le contenu réel n'est
pas saisi. Ce n'est pas un bug : c'est une protection contre la publication d'une app
contenant des données d'exemple.

Vérification faite à l'instant sur le contenu actuel, **8 blocages** :

| Blocage | Correction |
|---|---|
| Aucune session pour **d4, d5, d6, d7, d8** | Ajouter au moins **une session par jour** pour la semaine de formation (27–31 juillet) |
| Les **3 enseignements audio** n'ont pas de fichier | Téléverser les fichiers **ou supprimer les 3 entrées** |

Le préflight vérifie aussi, en direct sur votre API : `/api/health`, les en-têtes de
sécurité, la validité du contenu, l'absence de textes provisoires (« à confirmer »,
« à venir », « TBD »…) et l'accessibilité de `/privacy.html`.

**Conséquence sur l'ordre des opérations : le VPS doit être en ligne et le contenu
complet AVANT de pouvoir construire les applications.**

---

## Phase 1 — Mettre le VPS en ligne (45 min)

### 1.1 DNS
Chez votre registraire, créez un enregistrement **A** :
`api.dlwm-convention2026.fr` → adresse IP de votre VPS.

Vérifiez depuis votre Mac (attendez que ça réponde) :
```bash
dig +short api.dlwm-convention2026.fr
```

### 1.2 Préparer le serveur
```bash
ssh root@VOTRE_IP
curl -fsSL https://get.docker.com | sh
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
exit
```

### 1.3 Premier déploiement
```bash
cd ~/paris-2026-app
./scripts/deploy.sh root@VOTRE_IP /opt/paris2026
```
Le script s'arrête volontairement : il vient de créer `.env`.

### 1.4 Configurer `.env`
```bash
ssh root@VOTRE_IP
cd /opt/paris2026
openssl rand -base64 24     # ← copiez le résultat : c'est votre code admin de secours
nano .env
```

À renseigner :
```bash
DOMAIN=api.dlwm-convention2026.fr
ACME_EMAIL=votre@email.fr
ADMIN_CODE=<le résultat de openssl>          # 16 caractères minimum
CORS_ORIGINS=https://api.dlwm-convention2026.fr,capacitor://localhost,http://localhost

# Connexion par vos comptes Supabase existants (recommandé)
SUPABASE_URL=https://VOTRE-PROJET.supabase.co
SUPABASE_ANON_KEY=<clé anon publique — JAMAIS la clé service_role>
SUPABASE_ADMIN_EMAILS=vous@exemple.fr,autre-organisateur@exemple.fr
```

> Si vous ajoutez plus tard la version web sur un domaine, **ajoutez-le à `CORS_ORIGINS`**,
> sinon l'API refusera ses appels.

### 1.5 Lancer
```bash
./scripts/deploy.sh root@VOTRE_IP /opt/paris2026
```

### 1.6 Vérifier (3 contrôles)
```bash
curl https://api.dlwm-convention2026.fr/api/health      # {"ok":true,...}
```
Puis dans le navigateur :
- `https://api.dlwm-convention2026.fr/admin` → connexion avec votre compte Supabase
- `https://api.dlwm-convention2026.fr/privacy.html` → la politique s'affiche

✅ **Envoyez-moi le domaine à ce stade** : je vérifie tout avant que vous ne construisiez.

---

## Phase 2 — Saisir le contenu réel dans `/admin` (45 min)

C'est la phase qui débloque le build. Dans l'ordre :

### 2.1 Programme — **obligatoire**
- Vérifier les 3 jours de convention (24–26 juillet) déjà pré-remplis
- **Ajouter au moins une session pour chacun des 5 jours de formation** (27, 28, 29, 30, 31)
- Vérifier le compte à rebours : `2026-07-24T16:00+02:00`

### 2.2 Enseignements — **obligatoire**
Soit téléverser les 3 fichiers audio, soit **supprimer les 3 entrées** (vous les
ajouterez pendant la convention, l'app se met à jour toute seule).

### 2.3 Séjour
Hôtel réel, adresse, chambre, arrivée/départ, WiFi, petit-déjeuner, navette, réception.
⚠️ Remplacer les valeurs d'exemple (`Novotel Paris Est`, `mdp: paris2026`, `+33 1 23 45 67 89`).

### 2.4 Logements
Importer la liste des personnes prises en charge (format `Nom;Prénom;Téléphone;Pays;Adresse;Notes`).
La liaison avec les comptes se fera automatiquement à leur inscription.

### 2.5 À propos & Paris
Dates, contacts réels, sites touristiques. **Aucun texte du type « à confirmer » ou « à venir »**,
le préflight les rejette.

---

## Phase 3 — Construire et soumettre (1 h)

### 3.1 Vérification à blanc
```bash
cd ~/paris-2026-app
nvm use                      # Node 22
npm install && (cd server && npm install)
npm run check                # lint + tests + build
```

### 3.2 Build connecté aux stores
```bash
VITE_API_URL=https://api.dlwm-convention2026.fr \
RELEASE_CONFIRM_CONTENT=YES \
RELEASE_CONFIRM_PRIVACY=YES \
npm run sync
```
Si le préflight refuse, **il vous dit exactement quoi corriger** : retournez dans `/admin`.

### 3.3 Android — Play Store
```bash
keytool -genkey -v -keystore ~/paris2026-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias paris2026
npm run open:android
```
Android Studio → `Build ▸ Generate Signed App Bundle` → **Android App Bundle** → release.

Dans la Play Console :
1. **Test interne d'abord** (disponible en quelques minutes) → installez-le sur votre téléphone
2. Fiche : textes dans `store/STORE_LISTING.md`, icône `store/play-icon-512.png`,
   bandeau `store/play-feature-1024x500.png`
3. **Data safety** : voir `store/STORE_LISTING.md` (nom, téléphone, photos, contenu — **pas de localisation**)
4. Politique : `https://api.dlwm-convention2026.fr/privacy.html`
5. Promouvoir en production

### 3.4 iOS — App Store
```bash
npm run open:ios
```
Xcode → cible `App` ▸ *Signing & Capabilities* → votre Team.
Bundle : `org.lwmfd.paris2026`. Puis `Product ▸ Archive` → *Distribute App* → *Upload*.

Dans App Store Connect : App Privacy, URL de confidentialité, captures **6,7"** (1290×2796).

**Soumettez à TestFlight EN MÊME TEMPS que l'App Store.**

### 3.5 ⚡ Demande de revue accélérée — à faire immédiatement
`developer.apple.com/contact/app-store/?topic=expedite`

Motif : convention internationale, ouverture le **24/07 à 16h00**, application
indispensable aux participants (programme, hébergement, logistique). Gratuit,
souvent accordé en quelques heures.

---

## Phase 4 — Filet de sécurité web (20 min)

À faire **en parallèle**, pour garantir une solution le 24 quoi qu'il arrive :

```bash
VITE_API_URL=https://api.dlwm-convention2026.fr \
RELEASE_CONFIRM_CONTENT=YES \
RELEASE_CONFIRM_PRIVACY=YES \
npm run build
npx vercel --prod            # Framework: Vite, Output: dist
```

Puis **ajoutez le domaine web à `CORS_ORIGINS`** sur le VPS et relancez
`docker compose up -d`.

Les participants ouvrent l'adresse et font « Ajouter à l'écran d'accueil ».
Détails : `deploy/vercel-webapp.md`.

---

## Phase 5 — Veille avant le 24

- [ ] Sauvegarde automatique activée (cron du `DEPLOY.md` §5)
- [ ] Un test complet sur un vrai téléphone : inscription → question → photo → itinéraire
- [ ] Le lien d'installation communiqué aux participants
- [ ] Un organisateur sait se connecter à `/admin` et diffuser une notification

---

## Récapitulatif des chances

| Canal | Probabilité pour le 24 à 16h |
|---|---|
| Version web installable | **Garantie** dès le VPS en ligne |
| TestFlight (iOS) | Très probable |
| Play Store — test interne | Très probable |
| Play Store — production | Probable |
| App Store — public | Serré : réaliste **avec** la revue accélérée |

Vos participants auront l'application dans tous les cas. Reste à savoir par quel canal.
