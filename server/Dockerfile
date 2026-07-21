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

EXPOSE 8080
VOLUME ["/data"]

CMD ["node", "src/index.js"]
