import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Chemin de déploiement. L'application est servie sous un sous-chemin du site de
// l'événement (https://dlwm-convention2026.fr/app/), d'où la base configurable.
// Doit commencer ET finir par « / ».
const base = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
