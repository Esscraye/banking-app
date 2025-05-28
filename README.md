# Banking Application - Mono-Repo

Application bancaire complète utilisant une architecture microservices avec DevOps.

## Architecture

- **Backend**: Services Go avec APIs RESTful
- **Frontend**: Application Next.js avec React
- **Base de données**: MySQL
- **Déploiement**: Docker + GitHub Actions + Docker Hub

## Structure du Projet

```
.
├── backend/                    # Services backend en Go
│   ├── services/              # Microservices
│   │   ├── accounts/          # Service de gestion des comptes
│   │   ├── transactions/      # Service de transactions
│   │   ├── auth/             # Service d'authentification
│   │   └── notifications/     # Service de notifications
│   ├── shared/               # Code partagé
│   └── tests/                # Tests d'intégration
├── frontend/                 # Application Next.js
├── database/                 # Scripts SQL et migrations
├── docker/                   # Configurations Docker
├── scripts/                  # Scripts de test et déploiement
├── .github/                  # GitHub Actions workflows
└── docs/                     # Documentation

```

## Démarrage Rapide

1. **Installation des dépendances**:
   ```bash
   make install
   ```

2. **Démarrage avec Docker**:
   ```bash
   make dev
   ```

3. **Tests**:
   ```bash
   make test
   ```

## Services

### Backend (Port 8080-8083)
- **Accounts Service** (8080): Gestion des comptes bancaires
- **Transactions Service** (8081): Gestion des transactions
- **Auth Service** (8082): Authentification et autorisation
- **Notifications Service** (8083): Notifications et alertes

### Frontend (Port 3000)
- Interface utilisateur Next.js avec React
- Authentification intégrée
- Dashboard bancaire moderne

### Base de Données (Port 3306)
- MySQL 8.0
- Schémas optimisés pour les données bancaires
- Migrations automatisées

## Développement

### Prérequis
- Go 1.21+
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- MySQL 8.0

### Installation rapide

1. **Cloner le projet**:
   ```bash
   git clone <repository-url>
   cd banking-app
   ```

2. **Configuration de l'environnement**:
   ```bash
   cp .env.example .env
   # Éditer .env avec vos configurations
   ```

3. **Installation des dépendances**:
   ```bash
   make install
   ```

4. **Démarrage en mode développement**:
   ```bash
   make dev
   ```

### Variables d'environnement
Copiez `.env.example` vers `.env` et configurez les variables nécessaires:

- `DATABASE_URL`: URL de connexion MySQL
- `JWT_SECRET`: Clé secrète pour les tokens JWT
- `REDIS_URL`: URL de connexion Redis
- `SMTP_*`: Configuration email pour les notifications

### Commandes disponibles

| Commande | Description |
|----------|-------------|
| `make help` | Affiche l'aide |
| `make install` | Installe toutes les dépendances |
| `make dev` | Lance l'environnement de développement |
| `make dev-full` | Lance l'application complète |
| `make test` | Lance tous les tests |
| `make build` | Build l'application |
| `make docker-up` | Lance avec Docker Compose |
| `make health` | Vérifie la santé des services |
| `make clean` | Nettoie les fichiers temporaires |

### Tests

#### Tests automatisés
```bash
# Tous les tests
make test

# Tests backend uniquement
make test-backend

# Tests frontend uniquement
make test-frontend

# Tests avec script personnalisé
./scripts/test.sh
```

#### Tests manuels
```bash
# Vérification de santé
make health

# Tests d'intégration
./scripts/test.sh integration

# Tests de sécurité
./scripts/test.sh security
```

## Déploiement

Le déploiement est automatisé via GitHub Actions:
- Tests automatiques sur chaque push
- Build et push des images Docker
- Déploiement automatique en production

## Licence

MIT License
