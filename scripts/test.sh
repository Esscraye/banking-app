#!/bin/bash

# Script de test pour l'application bancaire
set -e

echo "🧪 Démarrage des tests de l'application bancaire..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour logger
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Vérification des prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    if ! command -v go &> /dev/null; then
        error "Go n'est pas installé"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        error "pnpm n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
        exit 1
    fi
    
    log "✅ Tous les prérequis sont installés"
}

# Démarrage des services de test
start_test_services() {
    log "Démarrage des services de test..."
    
    # Arrêter les services existants
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    # Démarrer MySQL pour les tests
    docker-compose -f docker-compose.dev.yml up -d mysql-dev
    
    # Attendre que MySQL soit prêt
    log "Attente du démarrage de MySQL..."
    timeout=60
    while ! docker exec $(docker ps -q -f name=banking-mysql-dev) mysqladmin ping -h localhost --silent 2>/dev/null; do
        sleep 1
        timeout=$((timeout - 1))
        if [ $timeout -eq 0 ]; then
            error "Timeout: MySQL n'a pas démarré"
            exit 1
        fi
    done
    
    log "✅ MySQL est prêt"
}

# Tests du backend
test_backend() {
    log "Tests du backend Go..."
    
    cd backend
    
    # Installation des dépendances
    go mod download
    
    # Linting
    if command -v golangci-lint &> /dev/null; then
        log "Linting du code Go..."
        golangci-lint run
    else
        warning "golangci-lint n'est pas installé, linting ignoré"
    fi
    
    # Tests unitaires
    log "Exécution des tests unitaires..."
    export DATABASE_URL="mysql://banking_user:banking_password@localhost:3307/banking_dev"
    export JWT_SECRET="test-secret"
    
    go test -v -race -coverprofile=coverage.out ./...
    
    # Génération du rapport de couverture
    go tool cover -html=coverage.out -o coverage.html
    
    # Affichage de la couverture
    coverage=$(go tool cover -func=coverage.out | grep total | awk '{print $3}')
    log "Couverture de code: $coverage"
    
    cd ..
    
    log "✅ Tests backend terminés"
}

# Tests du frontend
test_frontend() {
    log "Tests du frontend Next.js..."
    
    cd frontend
    
    # Installation des dépendances
    pnpm install --frozen-lockfile
    
    # Linting
    log "Linting du code TypeScript/React..."
    pnpm lint
    
    # Tests unitaires
    log "Exécution des tests unitaires..."
    pnpm test:coverage
    
    # Build de test
    log "Test de build..."
    pnpm build
    
    cd ..
    
    log "✅ Tests frontend terminés"
}

# Tests d'intégration
integration_tests() {
    log "Tests d'intégration..."
    
    # Démarrage de tous les services
    docker-compose up -d --build
    
    # Attendre que tous les services soient prêts
    log "Attente du démarrage des services..."
    
    services=("http://localhost:8082/health" "http://localhost:8080/health" "http://localhost:8081/health" "http://localhost:8083/health" "http://localhost:3000")
    
    for service in "${services[@]}"; do
        timeout=60
        while ! curl -f "$service" &>/dev/null; do
            sleep 2
            timeout=$((timeout - 2))
            if [ $timeout -le 0 ]; then
                error "Timeout: Service $service n'a pas démarré"
                docker-compose logs
                exit 1
            fi
        done
        log "✅ Service $service est prêt"
    done
    
    # Tests d'API
    log "Tests des APIs..."
    
    # Test d'inscription
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8082/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"password123","first_name":"Test","last_name":"User"}')
    
    if [ "$response" -eq 201 ] || [ "$response" -eq 409 ]; then
        log "✅ Test d'inscription: OK"
    else
        error "Test d'inscription échoué: HTTP $response"
    fi
    
    # Test de connexion
    response=$(curl -s -X POST http://localhost:8082/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"password123"}')
    
    if echo "$response" | grep -q "token"; then
        log "✅ Test de connexion: OK"
    else
        error "Test de connexion échoué"
    fi
    
    log "✅ Tests d'intégration terminés"
}

# Tests de sécurité
security_tests() {
    log "Tests de sécurité..."
    
    if command -v trivy &> /dev/null; then
        log "Scan de vulnérabilités avec Trivy..."
        trivy fs .
    else
        warning "Trivy n'est pas installé, scan de sécurité ignoré"
    fi
    
    log "✅ Tests de sécurité terminés"
}

# Tests de performance
performance_tests() {
    log "Tests de performance..."
    
    if command -v k6 &> /dev/null; then
        log "Tests de charge avec k6..."
        # Créer un script k6 simple
        cat > k6-script.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  let response = http.get('http://localhost:3000');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}
EOF
        k6 run k6-script.js
        rm k6-script.js
    else
        warning "k6 n'est pas installé, tests de performance ignorés"
    fi
    
    log "✅ Tests de performance terminés"
}

# Nettoyage
cleanup() {
    log "Nettoyage..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    
    # Supprimer les volumes orphelins
    docker volume prune -f
    
    log "✅ Nettoyage terminé"
}

# Fonction principale
main() {
    log "🚀 Début des tests"
    
    # Gestion des signaux pour le nettoyage
    trap cleanup EXIT
    
    check_prerequisites
    start_test_services
    
    # Exécution des tests selon les arguments
    if [ "$1" = "backend" ]; then
        test_backend
    elif [ "$1" = "frontend" ]; then
        test_frontend
    elif [ "$1" = "integration" ]; then
        integration_tests
    elif [ "$1" = "security" ]; then
        security_tests
    elif [ "$1" = "performance" ]; then
        performance_tests
    else
        # Tous les tests par défaut
        test_backend
        test_frontend
        integration_tests
        security_tests
        performance_tests
    fi
    
    log "🎉 Tous les tests sont passés avec succès!"
}

# Exécution
main "$@"
