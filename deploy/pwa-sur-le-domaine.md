# Tout accessible sous dlwm-convention2026.fr

Objectif : les participants téléchargent l'app depuis le site, sont guidés pour
l'installer, puis y accèdent — le tout sous votre domaine, avec des chemins.

```
https://dlwm-convention2026.fr/            → votre site événement (Vercel)
https://dlwm-convention2026.fr/app         → l'application PWA (guide → onboarding → app)
https://dlwm-convention2026.fr/logistique/mobile → redirige vers l'admin mobile
https://api.dlwm-convention2026.fr         → l'API (VPS) : données, push, /admin, /privacy.html
```

## 1. Construire l'app pour le sous-chemin /app

```bash
cd ~/paris-2026-app
VITE_BASE_PATH=/app/ \
VITE_API_URL=https://api.dlwm-convention2026.fr \
RELEASE_CONFIRM_CONTENT=YES \
RELEASE_CONFIRM_PRIVACY=YES \
npm run build
```

Le dossier `dist/` contient l'app avec tous ses chemins préfixés par `/app/`.

## 2. Servir l'app depuis votre site Vercel

Copiez le contenu de `dist/` dans le dossier **`public/app/`** de votre site
(les fichiers de `public/` sont servis tels quels par Vercel/Next.js) :

```bash
rm -rf /chemin/vers/votre-site/public/app
cp -r dist /chemin/vers/votre-site/public/app
```

Puis fusionnez `deploy/vercel.json.example` dans le `vercel.json` de votre site
(réécriture SPA de `/app/*`, redirection `/logistique/mobile`, en-têtes du service
worker) et redéployez.

> Alternative : publier l'app comme **projet Vercel distinct** sur un sous-domaine
> (`app.dlwm-convention2026.fr`). Dans ce cas, construisez avec `VITE_BASE_PATH=/`
> et ajoutez ce sous-domaine à `CORS_ORIGINS`. Plus simple à opérer, mais l'URL
> n'est pas un sous-chemin de votre domaine principal.

## 3. Autoriser l'app à joindre l'API (CORS)

L'app (`dlwm-convention2026.fr`) et l'API (`api.dlwm-convention2026.fr`) sont deux
origines distinctes. Ajoutez le domaine du site dans le `.env` du VPS :

```bash
CORS_ORIGINS=https://api.dlwm-convention2026.fr,https://dlwm-convention2026.fr,capacitor://localhost,http://localhost
```

```bash
docker compose up -d
```

**Sans cette ligne, l'app affichée mais incapable de charger les données.**

## 4. Le lien « Télécharger l'application » sur le site

Sur votre page participants, un simple lien suffit :

```html
<a href="/app">📲 Télécharger l'application de la convention</a>
```

## 5. Le parcours vécu par le participant

1. Il clique sur le lien → arrive sur **`/app`**.
2. L'app détecte son téléphone et affiche le **guide d'installation adapté**
   (iPhone/Safari, Android, ou « ouvrez dans Safari » s'il est venu depuis WhatsApp).
3. **Tant que l'app n'est pas installée, il n'avance pas** : des flèches et des
   étapes numérotées le guident vers le bon bouton.
4. Une fois ajoutée à l'écran d'accueil, il ouvre l'app depuis sa nouvelle icône :
   il passe alors à la **création de profil**, puis à l'application.
5. Dans la cloche, il **active les notifications** (obligatoire sur iPhone que
   l'app soit installée — c'est justement garanti par l'étape précédente).

> Filet de sécurité : si au bout de 25 secondes le participant est bloqué (appareil
> incompatible, cas rare), un lien discret « je n'y arrive pas » lui permet de
> continuer sans installer — mais sans notifications. C'est un choix délibéré pour
> ne jamais enfermer quelqu'un dehors ; dites-moi si vous préférez un blocage total.

## 6. Vérifier après déploiement

- `https://dlwm-convention2026.fr/app` → le guide s'affiche
- Depuis un téléphone, installer puis rouvrir → l'app entre directement
- Recharger sur une sous-page (ex. après navigation) → pas de 404 (grâce à la réécriture SPA)
- `https://dlwm-convention2026.fr/logistique/mobile` → l'admin mobile
