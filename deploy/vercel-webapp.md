# Publier l'application en version web (secours si les stores ne valident pas à temps)

L'application est une application web : elle peut être publiée sur votre domaine Vercel et
**installée depuis le navigateur** sur iPhone comme sur Android, sans aucune validation de store.

Même code, même backend, même contenu que les applications natives.

## 1. Construire

```bash
cd ~/paris-2026-app
VITE_API_URL=https://api.votre-domaine.fr \
RELEASE_CONFIRM_CONTENT=YES \
RELEASE_CONFIRM_PRIVACY=YES \
npm run build
```

Le dossier `dist/` contient l'application prête à publier.

## 2. Publier sur Vercel

Le plus simple, depuis le dossier du projet :

```bash
npx vercel --prod
```

Répondez « oui » pour lier au projet Vercel de votre choix. Réglages à indiquer :

- **Framework preset** : Vite
- **Build command** : laisser vide (le `dist/` est déjà construit) ou `npm run build:demo`
- **Output directory** : `dist`

### Variante : sous-chemin du site existant

Pour servir l'app sur `dlwm-convention2026.fr/app`, ajoutez dans le `vercel.json` de votre
site principal une réécriture vers le déploiement de l'app, ou publiez l'app comme projet
séparé sur un sous-domaine (`app.dlwm-convention2026.fr`) — c'est plus simple et plus robuste.

### Routage d'une application à page unique

Si vous publiez l'app comme projet Vercel autonome, ajoutez `vercel.json` à la racine :

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Sans cette règle, un rechargement sur une sous-page renverrait une erreur 404.

## 3. CORS : autoriser le domaine web

Le backend n'accepte que les origines déclarées. Ajoutez le domaine web dans le `.env` du
VPS, puis redémarrez :

```bash
CORS_ORIGINS=https://api.votre-domaine.fr,https://app.dlwm-convention2026.fr,capacitor://localhost,http://localhost
```

```bash
docker compose up -d
```

**Sans cette ligne, l'application web ne pourra pas joindre l'API.**

## 4. Comment les participants l'installent

Communiquez une seule adresse, par exemple `app.dlwm-convention2026.fr` :

- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil »
- **Android (Chrome)** : menu ⋮ → « Installer l'application » (ou bannière automatique)

L'application s'ouvre alors en plein écran, avec l'icône de la convention, comme une app native.

## Ce qui fonctionne — et ce qui diffère du natif

| Fonction | Version web installée |
|---|---|
| Programme, séjour, logements, carte GPS | ✅ identique |
| Questions aux pasteurs | ✅ identique |
| Pellicule : prise de photo + filigrane | ✅ l'appareil photo est accessible depuis le navigateur |
| Enseignements audio | ✅ identique |
| Notifications de l'organisation (cloche) | ✅ identique |
| Rappels de session en notification système | ⚠️ non disponible sur iOS installé depuis Safari |

C'est la seule différence fonctionnelle notable. Tout le reste est identique.
