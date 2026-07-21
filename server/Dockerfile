# API de synchronisation Convention Paris 2026
FROM node:20-bookworm-slim

WORKDIR /app

# Dépendances (better-sqlite3 nécessite les outils de build lors de l'install)
COPY package.json package-lock.json* ./
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && npm install --omit=dev \
  && apt-get purge -y python3 make g++ \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

COPY src ./src
COPY public ./public

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/data/paris2026.db
# Fichiers téléversés (photos, audios) sur le volume persistant /data
ENV UPLOADS_DIR=/data/uploads

EXPOSE 8080
VOLUME ["/data"]

# Vérification de santé (Node 20 fournit fetch nativement)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
