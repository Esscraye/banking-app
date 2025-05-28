#!/bin/bash

# Script de déploiement pour l'application bancaire
set -e

echo "🚀 Script de déploiement de l'application bancaire"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"docker.io"}
IMAGE_PREFIX=${IMAGE_PREFIX:-"banking-app"}
ENVIRONMENT=${ENVIRONMENT:-"staging"}
VERSION=${VERSION:-"latest"}

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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Vérification des prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier la connexion à Docker Hub
    if ! docker info &> /dev/null; then
        error "Docker daemon n'est pas accessible"
        exit 1
    fi
    
    log "✅ Tous les prérequis sont satisfaits"
}

# Build des images Docker
build_images() {
    log "Build des images Docker..."
    
    services=("auth" "accounts" "transactions" "notifications" "frontend")
    
    for service in "${services[@]}"; do
        log "Build de l'image $service..."
        
        docker build \
            -f docker/${service}.Dockerfile \
            -t ${DOCKER_REGISTRY}/${IMAGE_PREFIX}-${service}:${VERSION} \
            -t ${DOCKER_REGISTRY}/${IMAGE_PREFIX}-${service}:latest \
            .
        
        log "✅ Image $service buildée"
    done
}

# Push des images vers le registry
push_images() {
    log "Push des images vers le registry..."
    
    # Connexion au registry si nécessaire
    if [ ! -z "$DOCKER_USERNAME" ] && [ ! -z "$DOCKER_PASSWORD" ]; then
        echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
    fi
    
    services=("auth" "accounts" "transactions" "notifications" "frontend")
    
    for service in "${services[@]}"; do
        log "Push de l'image $service..."
        
        docker push ${DOCKER_REGISTRY}/${IMAGE_PREFIX}-${service}:${VERSION}
        docker push ${DOCKER_REGISTRY}/${IMAGE_PREFIX}-${service}:latest
        
        log "✅ Image $service pushée"
    done
}

# Déploiement sur l'environnement de staging
deploy_staging() {
    log "Déploiement sur l'environnement de staging..."
    
    # Arrêter les services existants
    docker-compose down 2>/dev/null || true
    
    # Nettoyer les volumes orphelins
    docker system prune -f
    
    # Démarrer les nouveaux services
    export IMAGE_TAG=${VERSION}
    docker-compose up -d --remove-orphans
    
    # Attendre que les services soient prêts
    wait_for_services
    
    # Tests de santé
    health_check
    
    log "✅ Déploiement staging terminé"
}

# Déploiement sur l'environnement de production
deploy_production() {
    log "Déploiement sur l'environnement de production..."
    
    # Confirmation de sécurité
    if [ "$ENVIRONMENT" = "production" ]; then
        read -p "Êtes-vous sûr de vouloir déployer en production? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Déploiement annulé"
            exit 0
        fi
    fi
    
    # Sauvegarde de la base de données
    backup_database
    
    # Déploiement blue-green (simulation)
    log "Déploiement blue-green..."
    
    # Créer un nouveau stack
    export IMAGE_TAG=${VERSION}
    export COMPOSE_PROJECT_NAME="banking-app-green"
    docker-compose -p banking-app-green up -d
    
    # Attendre que les nouveaux services soient prêts
    wait_for_services "green"
    
    # Tests de santé sur le nouveau stack
    health_check "green"
    
    # Switch du trafic (simulation avec nginx ou load balancer)
    switch_traffic
    
    # Arrêter l'ancien stack après vérification
    sleep 30
    docker-compose -p banking-app-blue down 2>/dev/null || true
    
    # Renommer le stack green en blue pour le prochain déploiement
    docker-compose -p banking-app-blue down 2>/dev/null || true
    export COMPOSE_PROJECT_NAME="banking-app-blue"
    
    log "✅ Déploiement production terminé"
}

# Attendre que les services soient prêts
wait_for_services() {
    local env_suffix=${1:-""}
    log "Attente du démarrage des services..."
    
    local services=(
        "http://localhost:8082/health"
        "http://localhost:8080/health"
        "http://localhost:8081/health"
        "http://localhost:8083/health"
        "http://localhost:3000"
    )
    
    for service in "${services[@]}"; do
        local timeout=120
        local count=0
        
        while ! curl -f "$service" &>/dev/null; do
            sleep 2
            count=$((count + 2))
            if [ $count -ge $timeout ]; then
                error "Timeout: Service $service n'a pas démarré"
                docker-compose logs
                exit 1
            fi
            
            if [ $((count % 10)) -eq 0 ]; then
                info "Attente du service $service... (${count}s)"
            fi
        done
        
        log "✅ Service $service est prêt"
    done
}

# Tests de santé des services
health_check() {
    local env_suffix=${1:-""}
    log "Vérification de la santé des services..."
    
    # Test des endpoints de santé
    local endpoints=(
        "http://localhost:8082/health"
        "http://localhost:8080/health"
        "http://localhost:8081/health"
        "http://localhost:8083/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
        if [ "$response" -eq 200 ]; then
            log "✅ $endpoint: OK"
        else
            error "$endpoint: KO (HTTP $response)"
            exit 1
        fi
    done
    
    # Test basique de l'interface
    frontend_response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
    if [ "$frontend_response" -eq 200 ]; then
        log "✅ Frontend: OK"
    else
        error "Frontend: KO (HTTP $frontend_response)"
        exit 1
    fi
    
    log "✅ Tous les services sont en bonne santé"
}

# Sauvegarde de la base de données
backup_database() {
    log "Sauvegarde de la base de données..."
    
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker ps | grep -q banking-mysql; then
        docker exec banking-mysql mysqldump \
            -u banking_user \
            -pbanking_password \
            banking_db > "backups/$backup_file"
        
        log "✅ Sauvegarde créée: backups/$backup_file"
    else
        warning "Conteneur MySQL non trouvé, sauvegarde ignorée"
    fi
}

# Switch du trafic (simulation)
switch_traffic() {
    log "Switch du trafic vers le nouveau déploiement..."
    
    # En production, ceci serait fait via un load balancer (nginx, HAProxy, etc.)
    # ou un service mesh (Istio, Linkerd)
    
    # Simulation du switch
    sleep 5
    
    log "✅ Trafic switché vers le nouveau déploiement"
}

# Rollback en cas de problème
rollback() {
    log "Rollback vers la version précédente..."
    
    # Arrêter la nouvelle version
    docker-compose -p banking-app-green down 2>/dev/null || true
    
    # Redémarrer l'ancienne version
    docker-compose -p banking-app-blue up -d 2>/dev/null || true
    
    # Restaurer le switch de trafic
    switch_traffic
    
    log "✅ Rollback terminé"
}

# Nettoyage après déploiement
cleanup() {
    log "Nettoyage post-déploiement..."
    
    # Supprimer les images non utilisées
    docker image prune -f
    
    # Supprimer les volumes orphelins
    docker volume prune -f
    
    log "✅ Nettoyage terminé"
}

# Monitoring post-déploiement
post_deployment_monitoring() {
    log "Surveillance post-déploiement..."
    
    # Surveiller pendant 5 minutes
    for i in {1..10}; do
        sleep 30
        health_check
        log "Check $i/10 OK"
    done
    
    log "✅ Surveillance terminée, déploiement stable"
}

# Affichage de l'aide
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  build     Build les images Docker"
    echo "  push      Push les images vers le registry"
    echo "  staging   Déploie sur l'environnement de staging"
    echo "  prod      Déploie sur l'environnement de production"
    echo "  rollback  Effectue un rollback"
    echo "  health    Vérifie la santé des services"
    echo "  help      Affiche cette aide"
    echo ""
    echo "Environment variables:"
    echo "  DOCKER_REGISTRY   Registry Docker (défaut: docker.io)"
    echo "  IMAGE_PREFIX      Préfixe des images (défaut: banking-app)"
    echo "  VERSION           Version à déployer (défaut: latest)"
    echo "  ENVIRONMENT       Environnement cible (défaut: staging)"
    echo ""
}

# Fonction principale
main() {
    local command=${1:-"help"}
    
    case $command in
        "build")
            check_prerequisites
            build_images
            ;;
        "push")
            check_prerequisites
            push_images
            ;;
        "staging")
            check_prerequisites
            build_images
            push_images
            deploy_staging
            post_deployment_monitoring
            cleanup
            ;;
        "prod"|"production")
            export ENVIRONMENT="production"
            check_prerequisites
            build_images
            push_images
            deploy_production
            post_deployment_monitoring
            cleanup
            ;;
        "rollback")
            rollback
            ;;
        "health")
            health_check
            ;;
        "help"|*)
            show_help
            ;;
    esac
    
    log "🎉 Opération terminée avec succès!"
}

# Gestion des erreurs
trap 'error "Script interrompu"; exit 1' INT TERM

# Création du dossier de sauvegarde si nécessaire
mkdir -p backups

# Exécution
main "$@"
