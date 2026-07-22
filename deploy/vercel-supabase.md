# Déploiement Vercel + Supabase (sans VPS)

Architecture : **une seule application Vercel** sert la PWA, l'API et le panneau
d'administration ; **Supabase** stocke les données et les fichiers.

```
Vercel  ├── /              PWA participants
        ├── /admin         panneau d'administration
        ├── /privacy.html  politique de confidentialité
        └── /api/*         fonctions serverless  ──►  Supabase (Postgres + Storage)
```

Sécurité : le navigateur **ne touche jamais** les tables Supabase. Les fonctions
Vercel utilisent la clé `service_role` et restent le seul gardien. Toutes les tables
ont RLS activé **sans aucune policy** : anon et authenticated n'ont aucun accès.

---

## 1. Créer le projet Supabase (5 min)

1. Sur [supabase.com](https://supabase.com), créez un projet (région **Europe**, ex. Francfort — RGPD).
2. Ouvrez **SQL Editor**, collez tout le contenu de [`supabase/schema.sql`](../supabase/schema.sql), exécutez.
   Vous devez voir « Success ». Le script crée les 10 tables, active RLS et crée le bucket `media`.
3. Dans **Settings ▸ API**, notez :
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **secrète**, jamais dans le navigateur ni dans git

> Le schéma a été validé contre un vrai moteur Postgres (tests `tests/schema.test.mjs`) :
> il doit s'exécuter sans erreur, et il est ré-exécutable sans risque.

## 2. Générer les clés de notifications push

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

## 3. Déployer sur Vercel (10 min)

> ## ⛔ À LIRE AVANT DE TAPER LA COMMANDE
>
> L'application **doit avoir son PROPRE projet Vercel**, séparé du site de l'événement.
>
> Si vous liez ce dossier au projet du site (`diaspora-connect-paris`), le déploiement
> **remplace le site de la convention** par l'application. C'est déjà arrivé une fois :
> la réparation est le bouton **Instant Rollback** dans Vercel.
>
> Vérifiez avant de déployer que le dossier n'est lié à aucun projet :
> ```bash
> ls .vercel 2>/dev/null && echo "⚠️ déjà lié : faites  rm -rf .vercel" || echo "OK, non lié"
> ```

```bash
cd ~/paris-2026-app
npx vercel --prod
```

Répondez aux questions ainsi :

| Question du CLI | Réponse |
|---|---|
| *Set up and deploy?* | **Y** |
| *Link to existing project?* | **N** ← **le point critique** |
| *What's your project's name?* | `paris-2026-app` (un nom **différent** du site) |
| *In which directory is your code located?* | `./` |
| *Want to modify these settings?* | **N** (tout est dans `vercel.json`) |

Framework : **Other** (la configuration est déjà dans `vercel.json`).

Puis, dans **Settings ▸ Environment Variables** du projet Vercel :

| Variable | Valeur |
|---|---|
| `SUPABASE_URL` | l'URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | la clé service_role (**secrète**) |
| `SUPABASE_ANON_KEY` | la clé anon |
| `SUPABASE_ADMIN_EMAILS` | e-mails des organisateurs, séparés par des virgules |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | clés push + `mailto:sfdrm.lwm@gmail.com` |
| `VITE_API_URL` | `same-origin` |
| `ADMIN_CODE` *(optionnel)* | code de secours, 16 caractères minimum |

> `VITE_API_URL=same-origin` : l'app et l'API partagent le domaine, donc **aucun CORS
> à configurer**. C'est le principal avantage de tout héberger sur Vercel.
> Cette valeur est aussi figée dans `vercel.json`, et une page servie depuis un vrai
> domaine s'y rabat d'elle-même : un oubli ne peut plus produire une application
> déconnectée.

### ⚠️ Ne pas intervertir les deux clés Supabase

C'est l'erreur la plus coûteuse, parce qu'elle ne se voit pas :

| Variable | Clé attendue | Si on se trompe |
|---|---|---|
| `SUPABASE_ANON_KEY` | **anon public** / `sb_publishable_…` | la base entière est exposée au navigateur |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** / `sb_secret_…` | RLS bloque **toutes les écritures** : l'app s'affiche normalement, mais aucune inscription n'est enregistrée |

L'API refuse désormais de démarrer dans les deux cas. Après chaque changement de clé,
vérifiez que l'écriture fonctionne vraiment :

```bash
curl -s -X POST https://VOTRE-DOMAINE/api/participants -H 'Content-Type: application/json' -d '{"firstName":"Test","lastName":"Verification","phone":"+33600000099","country":"FR"}'
```

Réponse attendue : `{"id":…,"token":"…"}`. Si vous lisez `{"error":"server_error"}`,
la clé `service_role` n'est pas la bonne — `npx vercel logs VOTRE-DOMAINE` le confirme
(`violates row-level security policy`). Supprimez ensuite ce participant de test dans
Supabase (table `participants`).

Redéployez pour que les variables soient prises en compte (`npx vercel --prod`).

## 4. Brancher votre domaine

Deux possibilités :

**A. Sous-domaine** (le plus simple) : dans Vercel ▸ Domains, ajoutez
`app.dlwm-convention2026.fr`. C'est l'adresse à communiquer aux participants.

**B. Sous-chemin `/app`** : dans le `vercel.json` de votre site principal, ajoutez
une réécriture vers ce déploiement :

```json
{ "rewrites": [{ "source": "/app/:path*", "destination": "https://VOTRE-DEPLOIEMENT.vercel.app/:path*" }] }
```

Et sur votre page participants, le lien de téléchargement :

```html
<a href="/app">📲 Télécharger l'application de la convention</a>
```

Pour l'administration, depuis `/logistique` :

```html
<a href="https://app.dlwm-convention2026.fr/admin">Administration de l'application mobile</a>
```

## 5. Vérifier

```bash
curl https://VOTRE-DOMAINE/api/health          # {"ok":true,...}
curl https://VOTRE-DOMAINE/api/content         # le programme en JSON
```

Puis dans un navigateur :
- `/` → le guide d'installation s'affiche
- `/admin` → connexion avec un compte Supabase de la liste `SUPABASE_ADMIN_EMAILS`
- `/privacy.html` → la politique s'affiche

## 6. Saisir le contenu réel

Dans `/admin` : Programme (**au moins une session par jour**), Séjour, Logements
(import de la liste), À propos. Les enseignements audio sans fichier peuvent être
supprimés — ils se rajoutent pendant l'événement, l'app se met à jour seule.

---

## Points à connaître

- **Taille des fichiers** : les fonctions Vercel acceptent environ 4,5 Mo par requête.
  Les photos de la pellicule sont réduites à 1600 px côté téléphone (~300 Ko) : aucun
  souci. En revanche, **un enseignement audio volumineux peut être refusé** ; dans ce
  cas, téléversez-le directement dans le bucket `media` depuis l'interface Supabase
  (Storage) et collez l'URL publique dans le champ du panneau d'administration.
- **Métadonnées GPS des photos** : supprimées côté téléphone, le filigrane étant
  appliqué par un ré-encodage `canvas` qui efface l'EXIF au passage.
- **Limitation de débit** : assurée par la table `rate_limits` et la fonction
  `rl_hit` (le serverless n'a pas de mémoire partagée entre invocations).
- **Sauvegardes** : Supabase les gère (Settings ▸ Database ▸ Backups).
- **Le dossier `server/`** (Node/SQLite pour VPS) devient inutile avec cette
  architecture. Il reste dans le dépôt à titre de repli, mais n'est plus déployé.
