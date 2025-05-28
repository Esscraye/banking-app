package utils

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword hache un mot de passe
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// CheckPasswordHash vérifie si un mot de passe correspond au hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateJWT génère un token JWT pour un utilisateur
func GenerateJWT(userID uint) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 jours
		"iat":     time.Now().Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	return tokenString, err
}

// GenerateTransactionReference génère une référence unique pour une transaction
func GenerateTransactionReference() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return "TXN-" + hex.EncodeToString(bytes), nil
}

// GenerateAccountNumber génère un numéro de compte unique
func GenerateAccountNumber(accountType string) (string, error) {
	bytes := make([]byte, 8)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	var prefix string
	switch accountType {
	case "checking":
		prefix = "ACC"
	case "savings":
		prefix = "SAV"
	case "credit":
		prefix = "CRD"
	default:
		prefix = "ACC"
	}

	return prefix + hex.EncodeToString(bytes)[:12], nil
}

// ValidateAccountType valide le type de compte
func ValidateAccountType(accountType string) bool {
	validTypes := []string{"checking", "savings", "credit"}
	for _, validType := range validTypes {
		if accountType == validType {
			return true
		}
	}
	return false
}

// ValidateTransactionType valide le type de transaction
func ValidateTransactionType(transactionType string) bool {
	validTypes := []string{"debit", "credit", "transfer"}
	for _, validType := range validTypes {
		if transactionType == validType {
			return true
		}
	}
	return false
}
