#!/usr/bin/env bash
# Déploiement du backend Convention Paris 2026 sur le VPS Hetzner.
# Usage :  ./scripts/deploy.sh user@IP_DU_VPS  [chemin_distant]
# Exemple : ./scripts/deploy.sh root@203.0.113.10 /opt/paris2026
#
# Prérequis sur le VPS : Docker installé, ports 80/443 ouverts, DNS pointant dessus.
# Le fichier .env (DOMAIN, ACME_EMAIL, ADMIN_CODE…) doit exister dans le dossier distant,
# ou être créé à partir de deploy.env.example lors du premier déploiement.
set -euo pipefail

REMOTE="${1:?Usage: ./scripts/deploy.sh user@host [remote_path]}"
REMOTE_PATH="${2:-/opt/paris2026}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "▶ Déploiement vers ${REMOTE}:${REMOTE_PATH}"

# 1) Synchronisation des fichiers nécessaires (exclut node_modules, données, secrets)
ssh "$REMOTE" "mkdir -p ${REMOTE_PATH}"
rsync -az --delete \
  --exclude 'node_modules' \
  --exclude 'data' \
  --exclude '.env' \
  --exclude '*.log' \
  "$ROOT/server" "$ROOT/docker-compose.yml" "$ROOT/Caddyfile" "$ROOT/deploy.env.example" \
  "$REMOTE:${REMOTE_PATH}/"

# 2) Premier déploiement : créer .env s'il n'existe pas encore
ssh "$REMOTE" "cd ${REMOTE_PATH} && [ -f .env ] || { cp deploy.env.example .env; echo '⚠  .env créé depuis l’exemple — éditez-le (DOMAIN, ACME_EMAIL, ADMIN_CODE) puis relancez.'; exit 1; }"

# 3) Build + (re)démarrage
ssh "$REMOTE" "cd ${REMOTE_PATH} && docker compose up -d --build"

# 4) Vérification santé
echo "▶ Attente du démarrage…"
sleep 5
ssh "$REMOTE" "cd ${REMOTE_PATH} && docker compose ps"
echo "✅ Déploiement terminé. Vérifiez : https://VOTRE_DOMAINE/api/health  et  https://VOTRE_DOMAINE/admin"
