# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copier go mod file
COPY go.mod ./

# Télécharger les dépendances
RUN go mod download

# Copier le code source
COPY . ./

# Build le service des transactions
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o transactions-service ./services/transactions

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

# Copier le binaire depuis le build stage
COPY --from=builder /app/transactions-service .

# Exposer le port
EXPOSE 8081

# Commande par défaut
CMD ["./transactions-service"]
