# Déploiement — Convention Paris 2026

Ce guide couvre la mise en ligne du **backend de synchronisation** sur votre VPS Hetzner, puis la
génération des applications **iOS** et **Android** connectées à ce serveur.

L'architecture : l'app mobile (native, empaquetée avec Capacitor) parle à une petite API Node/SQLite
hébergée sur votre VPS, exposée en HTTPS via Caddy (certificat Let's Encrypt automatique).

```
  App iOS / Android  ──HTTPS──▶  Caddy (443)  ──▶  API Node (8080)  ──▶  SQLite (/data)
```

---

## 1. Prérequis

- Un VPS Hetzner (Ubuntu 22.04+ recommandé) avec accès SSH root.
- Un nom de domaine ou sous-domaine (ex. `api.convention-paris2026.org`) dont l'enregistrement DNS **A**
  pointe vers l'IP publique du VPS. **HTTPS est obligatoire** : iOS refuse les connexions HTTP en clair.

## 2. Installer Docker sur le VPS

```bash
ssh root@VOTRE_IP
curl -fsSL https://get.docker.com | sh
```

## 3. Ouvrir les ports HTTP/HTTPS

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 4. Copier le projet et configurer

Depuis votre Mac, envoyez les fichiers nécessaires (le dossier `server/`, `docker-compose.yml`,
`Caddyfile`, `deploy.env.example`) :

```bash
# Exemple avec rsync (exclut node_modules et données locales)
rsync -av --exclude node_modules --exclude 'server/data' \
  server docker-compose.yml Caddyfile deploy.env.example \
  root@VOTRE_IP:/opt/paris2026/
```

Sur le VPS :

```bash
cd /opt/paris2026
cp deploy.env.example .env
nano .env     # renseignez DOMAIN, ACME_EMAIL et surtout ADMIN_CODE
```

## 5. Lancer

```bash
docker compose up -d --build
```

Caddy obtient automatiquement le certificat HTTPS (quelques secondes). Vérifiez :

```bash
curl https://VOTRE_DOMAINE/api/health          # {"ok":true,...}
```

La politique de confidentialité est en ligne sur `https://VOTRE_DOMAINE/privacy.html`
(c'est l'URL à indiquer dans les fiches App Store et Play Store).

Le **panneau d'administration du contenu** est sur `https://VOTRE_DOMAINE/admin` (accès par le code
administrateur `ADMIN_CODE`). Les organisateurs y éditent programme, séjour, notifications, etc.,
sans re-publier l'application.

### Commandes utiles

```bash
docker compose logs -f api      # journaux de l'API
docker compose restart          # redémarrer
docker compose down             # arrêter
```

### Sauvegarde de la base

Les données sont dans le volume Docker `api_data`. Pour une sauvegarde :

```bash
docker run --rm -v paris2026_api_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/paris2026-backup-$(date +%F).tar.gz -C /data .
```

## 6. Connecter l'app au serveur et builder les stores

Sur votre Mac, dans le dossier du projet :

```bash
# 1. Renseigner l'URL de l'API pour le build de production
echo "VITE_API_URL=https://VOTRE_DOMAINE" > .env.production

# 2. Reconstruire le web + synchroniser dans les projets natifs
npm run sync

# 3. Ouvrir les projets natifs
npm run open:ios       # Xcode  (Mac + Xcode requis)
npm run open:android   # Android Studio
```

Puis suivez la checklist de publication du [README](README.md).

> Sans `.env.production`, l'app fonctionne en **mode local** (chaque appareil garde ses propres données,
> sans synchronisation). Avec l'URL renseignée, participants, pasteurs et organisateurs sont synchronisés
> en temps quasi réel (rafraîchissement automatique toutes les 15 secondes).

## 7. Sécurité — le code administrateur

Le code administrateur est vérifié **côté serveur** (variable `ADMIN_CODE` du `.env` sur le VPS).
Changez-le avant l'événement et communiquez-le uniquement aux organisateurs et pasteurs.

> Note : un code de secours identique existe aussi dans `src/data/constants.js` (`ADMIN_CODE`), utilisé
> uniquement si le serveur est momentanément injoignable. Alignez-le sur celui du serveur, ou laissez-le
> distinct si vous préférez qu'aucun accès admin ne soit possible hors ligne.
