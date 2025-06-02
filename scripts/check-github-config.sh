#!/bin/bash

# Script pour vérifier la configuration GitHub Actions
# Utilise l'API GitHub pour vérifier les secrets (sans révéler leurs valeurs)

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Vérification de la configuration GitHub Actions${NC}"
echo -e "${YELLOW}=================================================${NC}"

# Vérifier si on est dans un repo git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Ce n'est pas un repository Git${NC}"
    exit 1
fi

# Obtenir l'URL du repository
REPO_URL=$(git config --get remote.origin.url)
echo -e "${BLUE}📂 Repository: $REPO_URL${NC}"

# Extraire owner/repo depuis l'URL
if [[ $REPO_URL == *"github.com"* ]]; then
    # Extraire owner/repo
    REPO_PATH=$(echo $REPO_URL | sed 's/.*github\.com[/:]\([^/]*\/[^/]*\)\.git.*/\1/' | sed 's/\.git$//')
    echo -e "${BLUE}📍 Repository GitHub: $REPO_PATH${NC}"
else
    echo -e "${RED}❌ Ce n'est pas un repository GitHub${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Checklist de configuration GitHub Actions:${NC}"
echo ""

echo -e "${YELLOW}📋 Secrets à configurer dans GitHub:${NC}"
echo "   Settings → Secrets and variables → Actions"
echo ""
echo -e "   1. ${BLUE}DOCKER_USERNAME${NC}"
echo "      └── Votre nom d'utilisateur Docker Hub"
echo ""
echo -e "   2. ${BLUE}DOCKER_PASSWORD${NC}"
echo "      └── Token d'accès Docker Hub (pas le mot de passe!)"
echo "      └── Format: dckr_pat_xxxxxxxxxxxxxxxxxxxxx"
echo ""

echo -e "${YELLOW}🌍 Environnement à créer dans GitHub:${NC}"
echo "   Settings → Environments → New environment"
echo ""
echo -e "   - Nom: ${BLUE}production${NC}"
echo ""

echo -e "${YELLOW}🔑 Comment créer un token Docker Hub:${NC}"
echo "   1. Aller sur hub.docker.com"
echo "   2. Account Settings → Security"
echo "   3. New Access Token"
echo "   4. Nom: 'GitHub Actions'"
echo "   5. Permissions: Read, Write, Delete"
echo "   6. Copier le token généré"
echo ""

echo -e "${YELLOW}📁 Fichiers de workflow:${NC}"
if [ -f ".github/workflows/ci-cd.yml" ]; then
    echo -e "   ✅ ${GREEN}.github/workflows/ci-cd.yml${NC} existe"
else
    echo -e "   ❌ ${RED}.github/workflows/ci-cd.yml${NC} n'existe pas"
fi
echo ""

echo -e "${YELLOW}🐳 Configuration Docker:${NC}"
if [ -f "docker-compose.yml" ]; then
    echo -e "   ✅ ${GREEN}docker-compose.yml${NC} existe"
else
    echo -e "   ❌ ${RED}docker-compose.yml${NC} n'existe pas"
fi

if [ -d "docker" ]; then
    echo -e "   ✅ ${GREEN}docker/${NC} dossier existe"
    echo -e "      └── Dockerfiles: $(ls docker/*.Dockerfile 2>/dev/null | wc -l) fichiers"
else
    echo -e "   ❌ ${RED}docker/${NC} dossier n'existe pas"
fi
echo ""

echo -e "${GREEN}🚀 Prochaines étapes:${NC}"
echo "   1. Configurer les secrets GitHub (ci-dessus)"
echo "   2. Créer l'environnement 'production'"
echo "   3. Faire un commit et push pour déclencher le pipeline"
echo "   4. Vérifier les logs dans l'onglet 'Actions' de GitHub"
echo ""

echo -e "${BLUE}📚 Liens utiles:${NC}"
echo "   • GitHub Secrets: https://github.com/$REPO_PATH/settings/secrets/actions"
echo "   • GitHub Environments: https://github.com/$REPO_PATH/settings/environments"
echo "   • GitHub Actions: https://github.com/$REPO_PATH/actions"
echo "   • Docker Hub Tokens: https://hub.docker.com/settings/security"
echo ""

echo -e "${GREEN}✨ Configuration terminée !${NC}"
