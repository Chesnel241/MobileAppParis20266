# Restaurer le site de l'événement après un déploiement accidentel

**Ce qui s'est passé** : `npx vercel --prod` lancé depuis le dossier de l'application
s'est lié au projet Vercel **du site de l'événement** (`diaspora-connect-paris`).
La production de ce projet — donc `www.dlwm-convention2026.fr` — sert désormais
l'application au lieu du site.

Aucune donnée n'est perdue : sur Vercel, chaque déploiement est conservé.

---

## 1. Remettre le site en ligne (30 secondes)

Dans le tableau de bord Vercel, sur le projet **`diaspora-connect-paris`** :

1. Ouvrez l'onglet **Deployments**.
2. Repérez le dernier déploiement **du site** (avant celui intitulé
   « Migration vers Vercel Functions + Supabase »).
3. Bouton **⋯** ▸ **Promote to Production** — ou le bouton **Instant Rollback**
   visible sur la page du déploiement actuel.

Vérifiez ensuite `https://www.dlwm-convention2026.fr` : le site doit être revenu.

## 2. Vérifier que rien d'autre n'a bougé

Dans **Settings** du projet du site :

- **Git** : le dépôt connecté doit toujours être celui du **site**, pas
  `MobileAppParis20266`. S'il a changé, reconnectez le bon dépôt.
- **Domains** : `dlwm-convention2026.fr` et `www.…` doivent rester sur ce projet.
- **Environment Variables** : les variables ajoutées pour l'application
  (`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_*`, `VITE_API_URL`…) n'ont rien à faire ici.
  Supprimez-les de ce projet — elles iront dans le projet de l'application.

## 3. Déployer l'application dans SON PROPRE projet

Le dossier local a déjà été délié (`.vercel` supprimé). Depuis le dossier de l'app :

```bash
cd ~/paris-2026-app
ls .vercel 2>/dev/null && echo "⚠️ encore lié : rm -rf .vercel" || echo "OK, non lié"
npx vercel --prod
```

Réponses attendues :

| Question | Réponse |
|---|---|
| *Set up and deploy?* | **Y** |
| *Link to existing project?* | **N** ← **surtout pas Y** |
| *Project name* | `paris-2026-app` |
| *Directory* | `./` |
| *Modify settings?* | **N** |

Puis, dans le **nouveau** projet : Settings ▸ Environment Variables (voir
[vercel-supabase.md](vercel-supabase.md) §3), et redéployez.

## 4. Relier les deux, proprement

L'application vit sur son propre domaine, le site garde le sien :

1. Dans le **nouveau** projet ▸ **Domains** : ajoutez `app.dlwm-convention2026.fr`.
2. Chez votre registraire : un enregistrement **CNAME** `app` → `cname.vercel-dns.com`.
3. Sur le **site**, ajoutez simplement le lien de téléchargement :

```html
<a href="https://app.dlwm-convention2026.fr">📲 Télécharger l'application</a>
```

Variante « sous-chemin » si vous tenez à `dlwm-convention2026.fr/app` — dans le
`vercel.json` **du site** (et non de l'app) :

```json
{
  "rewrites": [
    { "source": "/app", "destination": "https://app.dlwm-convention2026.fr" },
    { "source": "/app/:path*", "destination": "https://app.dlwm-convention2026.fr/:path*" }
  ]
}
```

## Règle à retenir

> **Un projet Vercel = un site.** Le site de l'événement et l'application sont deux
> projets distincts. Ne liez jamais le dossier de l'application au projet du site.
