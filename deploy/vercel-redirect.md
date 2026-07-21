# Redirection depuis dlwm-convention2026.fr vers l'admin de l'app mobile

L'objectif : que les organisateurs arrivent sur l'administration de l'application mobile
depuis votre domaine habituel, avec **leurs comptes Supabase existants**.

## 1. Ajouter la redirection

Dans le dépôt de votre site Vercel, éditez (ou créez) `vercel.json` :

```json
{
  "redirects": [
    {
      "source": "/logistique/mobile",
      "destination": "https://api.votre-domaine.fr/admin/",
      "permanent": false
    }
  ]
}
```

Puis redéployez le site. `https://dlwm-convention2026.fr/logistique/mobile` enverra
désormais vers l'administration de l'application mobile.

> `"permanent": false` (302) est volontaire : si l'URL de l'API change un jour, les
> navigateurs n'auront pas mis la redirection en cache définitivement.

### Variante Next.js

Si vous préférez le déclarer dans `next.config.js` :

```js
module.exports = {
  async redirects() {
    return [
      {
        source: '/logistique/mobile',
        destination: 'https://api.votre-domaine.fr/admin/',
        permanent: false,
      },
    ];
  },
};
```

## 2. Ajouter un lien dans votre espace `/logistique`

Pour que ce soit trouvable, ajoutez simplement un lien dans votre page logistique :

```html
<a href="/logistique/mobile">Administration de l'application mobile</a>
```

## 3. Pourquoi une redirection et pas une iframe

L'API renvoie l'en-tête `X-Frame-Options: DENY` et une CSP `frame-ancestors 'none'` :
l'administration **ne peut pas** être encapsulée dans une iframe. C'est une protection
volontaire contre le détournement de clic (clickjacking) sur des actions sensibles
(suppression de photos, assignation de logements). La redirection est la bonne approche.

## 4. Ce que voit l'organisateur

1. Il clique sur le lien depuis `/logistique`.
2. Il arrive sur l'administration mobile, qui lui demande **son e-mail et son mot de passe
   habituels** (le compte Supabase du site).
3. S'il figure parmi les administrateurs autorisés, sa session s'ouvre. Sinon, un message
   clair lui indique que son compte n'est pas autorisé pour l'application mobile.

> Il n'y a pas de session partagée automatique (SSO) entre les deux domaines : ce sont deux
> origines distinctes. L'organisateur saisit donc ses identifiants une fois sur l'admin
> mobile. Ce sont bien **les mêmes identifiants**, gérés au même endroit dans Supabase :
> révoquer un compte dans Supabase lui retire immédiatement l'accès aux deux.
