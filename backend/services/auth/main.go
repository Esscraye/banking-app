package main

import (
	"log"
	"net/http"
	"os"

	"banking-app/shared/database"
	"banking-app/shared/middleware"
	"banking-app/shared/models"
	"banking-app/shared/utils"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Charger les variables d'environnement
	if err := godotenv.Load("../../../.env"); err != nil {
		log.Println("Aucun fichier .env trouvé")
	}

	// Connexion à la base de données
	if err := database.ConnectDatabase(); err != nil {
		log.Fatal("Erreur de connexion à la base de données:", err)
	}

	// Migrations
	if err := database.MigrateDatabase(); err != nil {
		log.Fatal("Erreur de migration:", err)
	}

	// Configuration Gin
	if os.Getenv("ENVIRONMENT") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Middleware
	r.Use(middleware.CORSMiddleware())

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "auth",
		})
	})

	// Routes publiques
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", registerHandler)
		auth.POST("/login", loginHandler)
	}

	// Routes protégées
	protected := r.Group("/api/auth")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/profile", getProfileHandler)
		protected.PUT("/profile", updateProfileHandler)
		protected.POST("/change-password", changePasswordHandler)
	}

	// Démarrage du serveur
	port := os.Getenv("AUTH_SERVICE_PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("Service d'authentification démarré sur le port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

// registerHandler gère l'inscription d'un nouvel utilisateur
func registerHandler(c *gin.Context) {
	var request struct {
		Email     string `json:"email" binding:"required,email"`
		Password  string `json:"password" binding:"required,min=6"`
		FirstName string `json:"first_name" binding:"required"`
		LastName  string `json:"last_name" binding:"required"`
		Phone     string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Données invalides",
			Error:   err.Error(),
		})
		return
	}

	// Vérifier si l'utilisateur existe déjà
	var existingUser models.User
	if err := database.GetDB().Where("email = ?", request.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, models.APIResponse{
			Success: false,
			Message: "Un utilisateur avec cet email existe déjà",
			Error:   "Conflict",
		})
		return
	}

	// Hacher le mot de passe
	hashedPassword, err := utils.HashPassword(request.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors du hachage du mot de passe",
			Error:   "Internal Server Error",
		})
		return
	}

	// Créer l'utilisateur
	user := models.User{
		Email:     request.Email,
		Password:  hashedPassword,
		FirstName: request.FirstName,
		LastName:  request.LastName,
		Phone:     request.Phone,
		IsActive:  true,
	}

	if err := database.GetDB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la création de l'utilisateur",
			Error:   "Internal Server Error",
		})
		return
	}

	// Générer le token JWT
	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la génération du token",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Utilisateur créé avec succès",
		Data: models.LoginResponse{
			Token: token,
			User:  user,
		},
	})
}

// loginHandler gère la connexion d'un utilisateur
func loginHandler(c *gin.Context) {
	var request models.LoginRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Données invalides",
			Error:   err.Error(),
		})
		return
	}

	// Rechercher l'utilisateur
	var user models.User
	if err := database.GetDB().Where("email = ?", request.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Email ou mot de passe incorrect",
			Error:   "Unauthorized",
		})
		return
	}

	// Vérifier le mot de passe
	if !utils.CheckPasswordHash(request.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Email ou mot de passe incorrect",
			Error:   "Unauthorized",
		})
		return
	}

	// Vérifier si l'utilisateur est actif
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Compte désactivé",
			Error:   "Unauthorized",
		})
		return
	}

	// Générer le token JWT
	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la génération du token",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Connexion réussie",
		Data: models.LoginResponse{
			Token: token,
			User:  user,
		},
	})
}

// getProfileHandler récupère le profil de l'utilisateur connecté
func getProfileHandler(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Profil récupéré avec succès",
		Data:    user,
	})
}

// updateProfileHandler met à jour le profil de l'utilisateur
func updateProfileHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	var request struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Phone     string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Données invalides",
			Error:   err.Error(),
		})
		return
	}

	// Mettre à jour l'utilisateur
	var user models.User
	if err := database.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Utilisateur non trouvé",
			Error:   "Not Found",
		})
		return
	}

	user.FirstName = request.FirstName
	user.LastName = request.LastName
	user.Phone = request.Phone

	if err := database.GetDB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la mise à jour",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Profil mis à jour avec succès",
		Data:    user,
	})
}

// changePasswordHandler change le mot de passe de l'utilisateur
func changePasswordHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	var request struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Données invalides",
			Error:   err.Error(),
		})
		return
	}

	// Récupérer l'utilisateur
	var user models.User
	if err := database.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Utilisateur non trouvé",
			Error:   "Not Found",
		})
		return
	}

	// Vérifier le mot de passe actuel
	if !utils.CheckPasswordHash(request.CurrentPassword, user.Password) {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Mot de passe actuel incorrect",
			Error:   "Unauthorized",
		})
		return
	}

	// Hacher le nouveau mot de passe
	hashedPassword, err := utils.HashPassword(request.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors du hachage du mot de passe",
			Error:   "Internal Server Error",
		})
		return
	}

	// Mettre à jour le mot de passe
	user.Password = hashedPassword
	if err := database.GetDB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la mise à jour du mot de passe",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Mot de passe modifié avec succès",
	})
}
