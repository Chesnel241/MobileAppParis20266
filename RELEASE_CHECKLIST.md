# Checklist de mise en production

Un build destiné aux stores doit être produit avec `npm run sync`, jamais avec
`npm run sync:demo`. Le préflight bloque automatiquement une API absente, locale,
non HTTPS, indisponible, mal sécurisée ou alimentée par un programme incomplet.

## Décisions métier à valider

- programme réel des huit jours, horaires en heure de Paris et intervenants ;
- adresses exactes de tous les lieux, chambre, Wi-Fi, navettes et contacts ;
- médias réellement publiables et droits associés ;
- responsable de traitement, base légale et durée de conservation ;
- réponses App Store / Play Console sur la collecte des données ;
- politique de modération et personnes habilitées à l'administration ;
- procédure de récupération d'un compte après changement de téléphone.

## Contrôles techniques avant chaque version

1. Déployer et sauvegarder l'API et sa base SQLite.
2. Compléter le contenu dans `/admin`; approuver les photos de test puis les supprimer.
3. Exécuter `npm run check` et `cd server && npm test` avec Node 22.
4. Exécuter le build connecté :

   ```sh
   VITE_API_URL=https://api.votre-domaine.fr \
   RELEASE_CONFIRM_CONTENT=YES \
   RELEASE_CONFIRM_PRIVACY=YES \
   npm run sync
   ```

5. Tester sur au moins un appareil iOS et Android réels : inscription, relance,
   réseau coupé, questions, suppression du compte, photo/modération, rappels,
   liens GPS, rotation, grandes tailles de texte et lecteurs d'écran.
6. Incrémenter `versionCode` Android et `CURRENT_PROJECT_VERSION` iOS.
7. Générer et signer un AAB Android et une archive iOS avec les comptes de
   l'organisation. Ne jamais committer les clés, certificats ou profils.
8. Passer d'abord par les pistes de test Play et TestFlight, puis surveiller les
   crashs, sauvegardes, capacité disque, certificats TLS et disponibilité API.
