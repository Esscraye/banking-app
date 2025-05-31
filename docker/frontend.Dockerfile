# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Installer pnpm
RUN npm install -g pnpm

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . ./

# Build l'application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Installer pnpm
RUN npm install -g pnpm

# Copier package.json
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Installer uniquement les dépendances de production
RUN pnpm install --prod --frozen-lockfile

# Copier les fichiers buildés
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Changer la propriété des fichiers
USER nextjs

# Exposer le port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Commande par défaut
CMD ["pnpm", "start"]
