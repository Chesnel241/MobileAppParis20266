# Convention Paris 2026 — LWMF&D

Application mobile (iOS & Android) de la Convention Internationale **Life Word Mission France & Diaspora**,
Paris, 24–31 juillet 2026.

- **Frontend** : React 19 + Vite, empaqueté en app native avec [Capacitor](https://capacitorjs.com)
  (`appId: org.lwmfd.paris2026`).
- **Backend** (`server/`) : API Node/Express + SQLite pour la synchronisation temps réel entre
  participants, pasteurs et organisateurs. Déployable sur un VPS (voir [DEPLOY.md](DEPLOY.md)).

## Prérequis

**Node 22** (version épinglée dans `.nvmrc`, identique à la CI). Avec nvm : `nvm use`.

> ⚠ **Après chaque `git pull`**, relancez `npm install` (racine **et** `server/`) : de nouvelles
> dépendances peuvent avoir été ajoutées, sinon le build échoue avec une erreur de module introuvable.
>
> Si les tests backend échouent avec `ERR_DLOPEN_FAILED` / `NODE_MODULE_VERSION`, c'est que le module
> natif `better-sqlite3` a été compilé pour une autre version de Node. Corrigez avec :
> ```bash
> cd server && npm rebuild better-sqlite3
> ```

## Développement

```bash
npm install
npm run dev        # serveur de développement web
npm run lint       # oxlint
npm test           # tests unitaires
npm run check      # lint + tests + build (ce que vérifie la CI)
```

Le backend se lance séparément :

```bash
cd server && npm install && npm test && npm run dev
```

Pour connecter l'app au backend en local, créez `.env.local` :

```
VITE_API_URL=http://localhost:8080
```

Sans cette variable, l'app tourne en **mode local** (données par appareil, sans synchro).

## Authentification

- **Participant** : à la première ouverture, il crée son profil (nom, prénom, téléphone, pays de
  résidence). Aucun mot de passe. Le profil est conservé sur l'appareil et, si le serveur est configuré,
  enregistré côté serveur pour la synchronisation.
- **Organisateurs & pasteurs** : l'espace « Pasteur » (onglet Questions) et le tableau de bord
  « Organisateur » (onglet Plus) sont protégés par un **code administrateur commun**, vérifié
  **uniquement côté serveur** (`ADMIN_CODE`, minimum 16 caractères — le serveur refuse de démarrer
  en deçà). Ce code n'est **pas** embarqué dans l'application : il n'y a donc pas d'accès
  organisateur/pasteur si le serveur est injoignable.
  **Changez ces valeurs avant publication.**

## Synchronisation

Quand `VITE_API_URL` est renseigné :

- Les inscriptions participants remontent au serveur.
- Les questions posées apparaissent en temps quasi réel dans la file des pasteurs (rafraîchissement
  automatique toutes les 15 s), et le statut « assignée » redescend automatiquement vers le participant.
- Le tableau de bord organisateur affiche des statistiques réelles (inscrits, présents, questions,
  répartition par pays).
- Le **contenu éditable** (programme, séjour, Paris, audios, à propos, compte à rebours) et les
  **notifications** sont chargés depuis le serveur. Sans serveur, l'app utilise `src/data/defaultContent.js`.

## Panneau d'administration (contenu)

L'interface web d'administration est servie par le backend sur **`https://VOTRE_DOMAINE/admin`**.
Accès par le code administrateur. Les organisateurs y modifient sans re-publier l'app :

- **Programme** : jours, sessions (horaires, intervenants, lieux), compte à rebours.
- **Séjour** : hôtel, infos pratiques (WiFi, petit-déjeuner, navette…), lieux de rassemblement.
- **Découvrir Paris**, **Enseignements** (audios), **À propos** (dates, contact).
- **Notifications** : diffuser un message à tous les participants (apparaît dans la cloche de l'app).
- **Statistiques** : inscrits, présence, questions, répartition par pays.

Les changements sont visibles dans l'app au prochain lancement (ou dans les ~30 s pour les notifications).

## Build natif (Capacitor)

```bash
npm run sync           # build web + copie dans android/ et ios/
npm run open:android   # ouvre Android Studio
npm run open:ios       # ouvre Xcode (nécessite un Mac + Xcode)
```

## Icônes & écrans de démarrage

Générés à partir du logo HD LWMF&D (colombe sur globe) :

```bash
node scripts/generate-assets.mjs <logo-source.png>   # produit assets/icon.png et assets/splash.png
npx capacitor-assets generate --ios --android \
  --iconBackgroundColor '#0E1B38' --splashBackgroundColor '#0E1B38'
```

## Politique de confidentialité

Page bilingue (FR/EN) conforme RGPD : `public/privacy.html` (embarquée dans l'app) et servie par le
backend sur `/privacy.html`. **C'est cette URL publique qu'il faut indiquer dans les fiches des stores.**

## Checklist publication stores

### Commun
- [ ] Déployer le backend (voir [DEPLOY.md](DEPLOY.md)) et renseigner `.env.production` → `VITE_API_URL`
- [ ] Changer `ADMIN_CODE` (serveur `.env` + `src/data/constants.js`)
- [ ] Mettre en ligne la politique de confidentialité (URL publique `https://VOTRE_DOMAINE/privacy.html`)
- [ ] Remplacer les données d'exemple restantes (séjour, audios)

### App Store (iOS)
- [ ] Compte Apple Developer (99 $/an)
- [ ] Dans Xcode : équipe de signature, bundle id `org.lwmfd.paris2026`, version/build
- [ ] Archive → App Store Connect → fiche (captures, description, URL confidentialité) → soumission

### Play Store (Android)
- [ ] Compte Google Play Console (25 $ une fois)
- [ ] Keystore de signature (à générer et conserver précieusement)
- [ ] `Android Studio → Build → Generate Signed Bundle (AAB)`
- [ ] Fiche Play Console (captures, description, data safety, URL confidentialité) → soumission
