#!/bin/bash

# Script pour générer un PDF combiné de toute la documentation
# Prend en compte les emojis et convertit les diagrammes Mermaid

set -e

# Configuration
DOCS_DIR="docs"
OUTPUT_DIR="output"
TEMP_DIR="temp_docs"
PDF_NAME="Banking_Application_Documentation.pdf"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Génération du PDF de documentation${NC}"
echo -e "${YELLOW}====================================${NC}"

# Créer les dossiers nécessaires
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo -e "${GREEN}📁 Nettoyage et préparation des dossiers...${NC}"
rm -rf "$TEMP_DIR"/*
rm -f "$OUTPUT_DIR/$PDF_NAME"

# Fonction pour extraire et convertir les diagrammes Mermaid
extract_mermaid() {
    local file="$1"
    local temp_file="$2"
    local file_basename=$(basename "$file" .md)
    
    echo -e "${YELLOW}🔍 Traitement des diagrammes Mermaid dans $file...${NC}"
    
    # Créer une version temporaire du fichier
    cp "$file" "$temp_file"
    
    # Compteur pour les diagrammes
    local mermaid_count=0
    
    # Créer un fichier de sortie
    local output_file="$temp_file.processed"
    > "$output_file"
    
    # Lire le fichier ligne par ligne
    local in_mermaid=false
    local mermaid_content=""
    
    while IFS= read -r line; do
        if [[ "$line" == '```mermaid' ]]; then
            in_mermaid=true
            mermaid_count=$((mermaid_count + 1))
            mermaid_content=""
        elif [[ "$line" == '```' ]] && [ "$in_mermaid" = true ]; then
            # Fin du bloc mermaid, traiter le diagramme
            local img_name="${file_basename}_diagram_${mermaid_count}.png"
            local img_path="$TEMP_DIR/$img_name"
            local mermaid_file="$TEMP_DIR/temp_mermaid_$mermaid_count.mmd"
            
            echo -e "${BLUE}  📊 Conversion du diagramme $mermaid_count...${NC}"
            
            # Écrire le contenu mermaid dans un fichier temporaire
            echo "$mermaid_content" > "$mermaid_file"
            
            # Convertir avec mermaid-cli
            if mmdc -i "$mermaid_file" -o "$img_path" -t neutral -w 800 -H 600 -b white 2>/dev/null; then
                echo -e "${GREEN}  ✅ Diagramme $mermaid_count converti avec succès${NC}"
                # Ajouter la référence à l'image
                echo "![Diagramme $mermaid_count]($img_name)" >> "$output_file"
            else
                echo -e "${RED}  ❌ Erreur lors de la conversion du diagramme $mermaid_count${NC}"
                # En cas d'erreur, garder le bloc mermaid original
                echo '```mermaid' >> "$output_file"
                echo "$mermaid_content" >> "$output_file"
                echo '```' >> "$output_file"
            fi
            
            # Nettoyer
            rm -f "$mermaid_file"
            in_mermaid=false
        elif [ "$in_mermaid" = true ]; then
            # Accumuler le contenu du diagramme
            if [ -n "$mermaid_content" ]; then
                mermaid_content="$mermaid_content"$'\n'"$line"
            else
                mermaid_content="$line"
            fi
        else
            # Ligne normale, la copier
            echo "$line" >> "$output_file"
        fi
    done < "$temp_file"
    
    # Remplacer le fichier temporaire par la version traitée
    mv "$output_file" "$temp_file"
    
    if [ $mermaid_count -gt 0 ]; then
        echo -e "${GREEN}  ✅ $mermaid_count diagramme(s) traité(s) dans $file${NC}"
    fi
}

# Ordre des fichiers pour la documentation complète
FILES=(
    "docs/README.md"
    "docs/01-devops-microservices.md"
    "docs/02-architecture-projet.md"
    "docs/03-avantages-inconvenients.md"
    "docs/04-synthese-executive.md"
)

echo -e "${GREEN}📄 Traitement des fichiers markdown...${NC}"

# Traiter chaque fichier
COMBINED_FILE="$TEMP_DIR/combined_docs.md"

# Créer un en-tête pour le document combiné
cat > "$COMBINED_FILE" << 'EOF'
# Documentation Banking Application - Complète

*Architecture Microservices et Pratiques DevOps*

---

EOF

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${BLUE}📝 Traitement de $file...${NC}"
        
        # Créer un fichier temporaire pour ce document
        temp_file="$TEMP_DIR/$(basename "$file")"
        
        # Extraire et convertir les diagrammes Mermaid
        extract_mermaid "$file" "$temp_file"
        
        # Ajouter une séparation propre entre les documents
        if [ "$file" != "${FILES[0]}" ]; then
            echo "---" >> "$COMBINED_FILE"
            echo "" >> "$COMBINED_FILE"
        fi
        
        # Ajouter le contenu du fichier traité
        cat "$temp_file" >> "$COMBINED_FILE"
        echo "" >> "$COMBINED_FILE"
        echo "" >> "$COMBINED_FILE"
    else
        echo -e "${RED}❌ Fichier non trouvé: $file${NC}"
    fi
done

echo -e "${GREEN}📄 Fichier markdown combiné généré avec succès !${NC}"
echo -e "${BLUE}📍 Fichier: $(pwd)/$COMBINED_FILE${NC}"

# Afficher la taille du fichier
size=$(du -h "$COMBINED_FILE" | cut -f1)
echo -e "${YELLOW}📊 Taille: $size${NC}"

# Compter les lignes
lines=$(wc -l < "$COMBINED_FILE")
echo -e "${YELLOW}📄 Lignes: $lines${NC}"

echo -e "${GREEN}🎉 Génération terminée avec succès !${NC}"
echo -e "${BLUE}📖 Fichier markdown prêt: $COMBINED_FILE${NC}"
