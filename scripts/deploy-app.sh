#!/usr/bin/env bash
# Déploie l'application dans SON PROPRE projet Vercel, jamais dans celui du site.
#
# Ce script existe parce que « npx vercel --prod » pose la question
# « Link to existing project ? » : répondre oui lie le dossier au projet du site
# de l'événement et REMPLACE le site. Ici, le projet est créé et lié
# automatiquement, sans question piège, et un contrôle bloque tout déploiement
# vers un projet interdit.
#
# Usage :  ./scripts/deploy-app.sh [nom-du-projet]
set -euo pipefail

APP_PROJECT="${1:-paris-2026-app}"

# Projets à ne JAMAIS écraser (site de l'événement).
FORBIDDEN=("diaspora-connect-paris")

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }

linked_project() {
  [ -f .vercel/project.json ] || return 0
  node -e "try{console.log(require('./.vercel/project.json').projectName||'')}catch{console.log('')}"
}

# Avant le déploiement : si le dossier pointe sur le site, on délie automatiquement
# (aucune action manuelle à faire, et le site ne peut pas être écrasé).
unlink_if_forbidden() {
  local current; current="$(linked_project)"
  for bad in "${FORBIDDEN[@]}"; do
    if [ "$current" = "$bad" ]; then
      red "⚠️  Ce dossier était lié à « $bad » (le SITE de l'événement)."
      echo "    Lien supprimé automatiquement : le site ne sera pas touché."
      rm -rf .vercel
      return 0
    fi
  done
}

# Juste avant de pousser : contrôle final, cette fois bloquant.
assert_not_forbidden() {
  local current; current="$(linked_project)"
  for bad in "${FORBIDDEN[@]}"; do
    if [ "$current" = "$bad" ]; then
      red "⛔ ARRÊT : lien vers « $bad » détecté avant déploiement. Rien n'a été déployé."
      exit 1
    fi
  done
}

bold "▶ Vérification du lien Vercel"
unlink_if_forbidden

# 1) Repartir d'un lien propre si le dossier pointe ailleurs que sur notre projet.
current="$(linked_project)"
if [ -n "$current" ] && [ "$current" != "$APP_PROJECT" ]; then
  echo "  lien actuel : $current → on le remplace par $APP_PROJECT"
  rm -rf .vercel
fi

# 2) Créer le projet s'il n'existe pas (sans effet s'il existe déjà).
bold "▶ Création / vérification du projet « $APP_PROJECT »"
npx vercel project add "$APP_PROJECT" 2>/dev/null || echo "  (le projet existe déjà)"

# 3) Lier ce dossier à CE projet, sans question interactive.
bold "▶ Liaison du dossier au projet « $APP_PROJECT »"
npx vercel link --yes --project "$APP_PROJECT"

# 4) Dernier contrôle avant de pousser quoi que ce soit.
linked="$(linked_project)"
assert_not_forbidden
if [ "$linked" != "$APP_PROJECT" ]; then
  red "⛔ ARRÊT : le dossier est lié à « $linked » et non à « $APP_PROJECT »."
  exit 1
fi
green "  ✓ lié à $linked"

# 5) Déploiement en production.
bold "▶ Déploiement"
npx vercel --prod

echo
green "✅ Application déployée dans le projet « $APP_PROJECT »."
echo "   Le site de l'événement n'a pas été touché."
echo
bold "Étapes suivantes :"
echo "  1. Vercel ▸ projet $APP_PROJECT ▸ Settings ▸ Environment Variables"
echo "     (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY,"
echo "      SUPABASE_ADMIN_EMAILS, VAPID_*, VITE_API_URL=same-origin)"
echo "  2. Redéployer :  ./scripts/deploy-app.sh"
echo "  3. Domains ▸ ajouter  app.dlwm-convention2026.fr"
