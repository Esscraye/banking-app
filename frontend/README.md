# Banking Application Frontend

Interface utilisateur de l'application bancaire construite avec [Next.js](https://nextjs.org) et TypeScript. Ce frontend communique avec une architecture microservices backend pour fournir une expérience bancaire complète.

## Architecture

Cette application frontend fait partie d'un système bancaire distribué composé de :

- **Frontend** (Next.js) - Interface utilisateur (port 3000)
- **Auth Service** - Authentification et autorisation (port 8082)
- **Accounts Service** - Gestion des comptes bancaires (port 8080)
- **Transactions Service** - Traitement des transactions (port 8081)
- **Notifications Service** - Gestion des notifications (port 8083)

## Fonctionnalités

- 🔐 Authentification sécurisée avec JWT
- 💰 Gestion des comptes bancaires
- 💸 Historique et traitement des transactions
- 🔔 Notifications en temps réel
- 📱 Interface responsive et moderne
- 🛡️ Validation côté client et serveur

## Prérequis

- Node.js 18+ 
- npm/yarn/pnpm
- Backend microservices en cours d'exécution

## Installation et Configuration

1. **Installation des dépendances**
```bash
npm install
# ou
yarn install
```

2. **Configuration de l'environnement**
```bash
cp .env.example .env.local
```

Configurer les variables d'environnement :
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_AUTH_URL=http://localhost:8082
NEXT_PUBLIC_TRANSACTIONS_URL=http://localhost:8081
NEXT_PUBLIC_NOTIFICATIONS_URL=http://localhost:8083
```

## Démarrage

### Développement

```bash
npm run dev
# ou
yarn dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

### Production

```bash
npm run build
npm start
```

### Avec Docker

```bash
# Depuis la racine du projet
docker-compose up frontend
```

## Structure du Projet

```
frontend/
├── app/                    # Pages et layouts Next.js 13+
├── components/             # Composants React réutilisables
├── lib/                    # Utilitaires et configurations
├── public/                 # Assets statiques
├── styles/                 # Styles CSS/SCSS
└── types/                  # Définitions TypeScript
```

## API Integration

Le frontend communique avec les microservices via des appels REST :

- **Authentification** : JWT tokens stockés en localStorage
- **Gestion d'état** : React Context + useState/useEffect
- **Validation** : Zod schemas pour la validation des formulaires
- **Styling** : Tailwind CSS pour un design moderne

## Scripts Disponibles

```bash
npm run dev          # Démarrage en mode développement
npm run build        # Build de production
npm run start        # Démarrage en mode production
npm run lint         # Linting du code
npm run type-check   # Vérification TypeScript
```

## Tests

```bash
npm run test         # Tests unitaires
npm run test:e2e     # Tests end-to-end
npm run test:watch   # Tests en mode watch
```

## Déploiement

### Avec Docker Compose (Recommandé)

```bash
# Depuis la racine du projet
make up              # Démarre tous les services
make down            # Arrête tous les services
```

### Manuel

```bash
npm run build
npm start
```

## Technologies Utilisées

- **Framework** : Next.js 14
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **Validation** : Zod
- **HTTP Client** : Fetch API
- **State Management** : React Context
- **Testing** : Jest + Testing Library
