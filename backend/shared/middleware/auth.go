package middleware

import (
	"net/http"
	"os"
	"strings"

	"banking-app/shared/database"
	"banking-app/shared/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware vérifie le token JWT
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Message: "Token d'authentification requis",
				Error:   "Unauthorized",
			})
			c.Abort()
			return
		}

		// Extraire le token du header "Bearer {token}"
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Message: "Format de token invalide",
				Error:   "Unauthorized",
			})
			c.Abort()
			return
		}

		// Vérifier le token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Message: "Token invalide",
				Error:   "Unauthorized",
			})
			c.Abort()
			return
		}

		// Extraire les claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			userID, ok := claims["user_id"].(float64)
			if !ok {
				c.JSON(http.StatusUnauthorized, models.APIResponse{
					Success: false,
					Message: "Claims de token invalides",
					Error:   "Unauthorized",
				})
				c.Abort()
				return
			}

			// Vérifier que l'utilisateur existe toujours
			var user models.User
			if err := database.GetDB().First(&user, uint(userID)).Error; err != nil {
				c.JSON(http.StatusUnauthorized, models.APIResponse{
					Success: false,
					Message: "Utilisateur non trouvé",
					Error:   "Unauthorized",
				})
				c.Abort()
				return
			}

			// Ajouter l'utilisateur au contexte
			c.Set("user", user)
			c.Set("user_id", uint(userID))
		} else {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Message: "Claims de token invalides",
				Error:   "Unauthorized",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
