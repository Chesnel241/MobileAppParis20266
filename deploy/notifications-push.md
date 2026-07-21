# Notifications push — mise en service et limites

L'application envoie de vraies notifications système (bannière + son), même
application fermée, via le standard **Web Push**.

## ⚠️ La règle à connaître avant de communiquer

| Plateforme | Notifications push |
|---|---|
| **Android** (Chrome, Edge, Firefox…) | ✅ fonctionne, installée ou non |
| **iPhone / iPad** | ✅ **uniquement si l'app est ajoutée à l'écran d'accueil** (iOS 16.4+) |
| iPhone, app ouverte dans un onglet Safari | ❌ **aucune notification possible** |

C'est une limitation d'Apple, pas de l'application. **Votre communication doit donc
insister sur l'installation** :

> « Ouvrez le lien, puis appuyez sur **Partager ▸ Sur l'écran d'accueil**.
> C'est indispensable pour recevoir les informations de dernière minute. »

L'app détecte la situation : sur iPhone non installé, elle affiche l'explication
au lieu d'un bouton qui ne fonctionnerait pas.

## 1. Générer les clés (une seule fois)

```bash
cd server
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Reportez le résultat dans le `.env` du VPS :

```bash
VAPID_PUBLIC_KEY=BN...      # publique : transmise à l'app, c'est normal
VAPID_PRIVATE_KEY=...       # SECRÈTE : ne jamais la publier ni la committer
VAPID_SUBJECT=mailto:sfdrm.lwm@gmail.com
```

Puis redémarrez :
```bash
docker compose up -d
```

Au démarrage, le journal confirme : `[PUSH] notifications push activées`.
Sans clés, l'app fonctionne normalement mais sans push (le bouton n'apparaît pas).

> ⚠️ Ne régénérez **jamais** les clés après le lancement : tous les abonnements
> existants deviendraient invalides et les participants devraient se réabonner.

## 2. Côté participant

1. Il ouvre l'application et crée son profil.
2. Il touche la **cloche** en haut à droite.
3. Il appuie sur **« 🔔 Activer les notifications »** et accepte la demande du système.

Le bouton doit être touché par l'utilisateur : ni iOS ni Android n'autorisent une
demande automatique au chargement.

## 3. Côté organisateur

Dans `/admin ▸ Notifications`, écrivez le message et envoyez : il est enregistré
**et** poussé immédiatement sur tous les appareils abonnés. La réponse indique
combien d'envois ont abouti (`push.sent`).

## 4. Fonctionnement et robustesse

- Les abonnements devenus invalides (app désinstallée, permission retirée) sont
  **supprimés automatiquement** à la première diffusion qui échoue (404/410).
- Une panne du service de push **n'empêche jamais** l'enregistrement de la
  notification : elle reste visible dans la cloche de l'app.
- Les messages sont envoyés dans la langue choisie par chaque participant.

## 5. Si un participant ne reçoit rien

1. L'app est-elle bien **installée sur l'écran d'accueil** (obligatoire sur iPhone) ?
2. iOS est-il en **16.4 ou plus** ? (Réglages ▸ Général ▸ Informations)
3. Les notifications sont-elles autorisées dans les réglages du téléphone ?
4. Le **mode concentration / Ne pas déranger** est-il actif ?
5. En dernier recours : désinstaller l'icône, rouvrir le lien, réinstaller, réactiver.

## 6. Filet de sécurité

Même sans push, l'application **se rafraîchit toute seule au maximum toutes les
30 secondes**, et immédiatement dès que le participant la rouvre. Une information
diffusée est donc visible dans la cloche même si la notification système n'arrive pas.
