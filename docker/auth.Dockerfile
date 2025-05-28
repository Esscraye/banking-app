# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copier go mod file
COPY go.mod ./

# Télécharger les dépendances
RUN go mod download

# Copier le code source
COPY . ./

# Build le service d'authentification
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o auth-service ./services/auth

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

# Copier le binaire depuis le build stage
COPY --from=builder /app/auth-service .

# Exposer le port
EXPOSE 8082

# Commande par défaut
CMD ["./auth-service"]
