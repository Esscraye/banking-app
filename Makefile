# Banking Application Makefile
.PHONY: help install dev test build clean docker-build docker-up docker-down migrate lint format

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
GO_FILES = $(shell find backend -name "*.go")
FRONTEND_DIR = frontend
BACKEND_DIR = backend

# Default target
help: ## Affiche l'aide
	@echo "Commandes disponibles:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation
install: ## Installe toutes les dépendances
	@echo "📦 Installation des dépendances..."
	@cd $(BACKEND_DIR) && go mod download
	@cd $(FRONTEND_DIR) && pnpm install

# Développement
dev: ## Lance l'environnement de développement
	@echo "🚀 Démarrage de l'environnement de développement..."
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "✅ Base de données démarrée"
	@echo "🔗 MySQL accessible sur localhost:3307"
	@echo "🔗 Redis accessible sur localhost:6379"

dev-full: ## Lance l'application complète en mode développement
	@echo "🚀 Démarrage de l'application complète..."
	$(DOCKER_COMPOSE) up --build

# Tests
test: test-backend test-frontend ## Lance tous les tests

test-backend: ## Lance les tests du backend
	@echo "🧪 Tests du backend..."
	@cd $(BACKEND_DIR) && go test -v -race -coverprofile=coverage.out ./...
	@cd $(BACKEND_DIR) && go tool cover -html=coverage.out -o coverage.html
	@echo "📊 Rapport de couverture généré: backend/coverage.html"

test-frontend: ## Lance les tests du frontend
	@echo "🧪 Tests du frontend..."
	@cd $(FRONTEND_DIR) && pnpm test:coverage

# Build
build: build-backend build-frontend ## Build toute l'application

build-backend: ## Build le backend
	@echo "🔨 Build du backend..."
	@cd $(BACKEND_DIR) && go build -o bin/ ./services/...

build-frontend: ## Build le frontend
	@echo "🔨 Build du frontend..."
	@cd $(FRONTEND_DIR) && pnpm build

# Docker
docker-build: ## Build toutes les images Docker
	@echo "🐳 Build des images Docker..."
	docker build -f docker/auth.Dockerfile -t banking-app-auth .
	docker build -f docker/accounts.Dockerfile -t banking-app-accounts .
	docker build -f docker/transactions.Dockerfile -t banking-app-transactions .
	docker build -f docker/notifications.Dockerfile -t banking-app-notifications .
	docker build -f docker/frontend.Dockerfile -t banking-app-frontend .

docker-up: ## Lance tous les services avec Docker Compose
	@echo "🐳 Démarrage des services..."
	$(DOCKER_COMPOSE) up -d
	@echo "✅ Services démarrés"
	@echo "🔗 Frontend: http://localhost:3000"
	@echo "🔗 Auth Service: http://localhost:8082"
	@echo "🔗 Accounts Service: http://localhost:8080"
	@echo "🔗 Transactions Service: http://localhost:8081"
	@echo "🔗 Notifications Service: http://localhost:8083"

docker-down: ## Arrête tous les services Docker
	@echo "🛑 Arrêt des services..."
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE_DEV) down

docker-logs: ## Affiche les logs des services
	$(DOCKER_COMPOSE) logs -f

# Base de données
migrate-up: ## Applique les migrations de base de données
	@echo "📊 Application des migrations..."
	@cd $(BACKEND_DIR) && go run shared/database/migrate.go up

migrate-down: ## Rollback des migrations de base de données
	@echo "📊 Rollback des migrations..."
	@cd $(BACKEND_DIR) && go run shared/database/migrate.go down

migrate-create: ## Crée une nouvelle migration (usage: make migrate-create NAME=nom_migration)
	@echo "📊 Création d'une nouvelle migration: $(NAME)"
	@cd database/migrations && touch $(shell date +%Y%m%d%H%M%S)_$(NAME).up.sql
	@cd database/migrations && touch $(shell date +%Y%m%d%H%M%S)_$(NAME).down.sql

# Code quality
lint: lint-backend lint-frontend ## Lance le linting sur tout le code

lint-backend: ## Lance le linting sur le backend
	@echo "🔍 Linting du backend..."
	@cd $(BACKEND_DIR) && golangci-lint run

lint-frontend: ## Lance le linting sur le frontend
	@echo "🔍 Linting du frontend..."
	@cd $(FRONTEND_DIR) && pnpm lint

format: format-backend format-frontend ## Formate tout le code

format-backend: ## Formate le code backend
	@echo "✨ Formatage du backend..."
	@cd $(BACKEND_DIR) && go fmt ./...
	@cd $(BACKEND_DIR) && goimports -w .

format-frontend: ## Formate le code frontend
	@echo "✨ Formatage du frontend..."
	@cd $(FRONTEND_DIR) && pnpm format

# Nettoyage
clean: ## Nettoie les fichiers temporaires et les containers
	@echo "🧹 Nettoyage..."
	@cd $(BACKEND_DIR) && go clean
	@cd $(BACKEND_DIR) && rm -rf bin/ coverage.out coverage.html
	@cd $(FRONTEND_DIR) && rm -rf .next/ dist/ coverage/
	docker system prune -f
	docker volume prune -f

# Production
deploy-staging: ## Deploy sur l'environnement de staging
	@echo "🚀 Déploiement sur staging..."
	# Commandes de déploiement staging

deploy-production: ## Deploy sur l'environnement de production
	@echo "🚀 Déploiement sur production..."
	# Commandes de déploiement production

# Monitoring
logs: ## Affiche les logs en temps réel
	$(DOCKER_COMPOSE) logs -f

status: ## Affiche le statut des services
	$(DOCKER_COMPOSE) ps

health: ## Vérifie la santé des services
	@echo "🏥 Vérification de la santé des services..."
	@curl -f http://localhost:8082/health && echo "✅ Auth Service OK" || echo "❌ Auth Service KO"
	@curl -f http://localhost:8080/health && echo "✅ Accounts Service OK" || echo "❌ Accounts Service KO"
	@curl -f http://localhost:8081/health && echo "✅ Transactions Service OK" || echo "❌ Transactions Service KO"
	@curl -f http://localhost:8083/health && echo "✅ Notifications Service OK" || echo "❌ Notifications Service KO"
	@curl -f http://localhost:3000 && echo "✅ Frontend OK" || echo "❌ Frontend KO"

# Debug
debug-backend: ## Lance le backend en mode debug
	@echo "🐛 Mode debug backend..."
	@cd $(BACKEND_DIR) && dlv debug

debug-db: ## Se connecte à la base de données
	docker exec -it banking-mysql mysql -u banking_user -pbanking_password banking_db

# Backup
backup-db: ## Sauvegarde la base de données
	@echo "💾 Sauvegarde de la base de données..."
	docker exec banking-mysql mysqldump -u banking_user -pbanking_password banking_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db: ## Restaure la base de données (usage: make restore-db FILE=backup.sql)
	@echo "🔄 Restauration de la base de données..."
	docker exec -i banking-mysql mysql -u banking_user -pbanking_password banking_db < $(FILE)
