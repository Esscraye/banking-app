package main

import (
	"log"
	"net/http"
	"os"
	"strconv"

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

	// Configuration Gin
	if os.Getenv("ENVIRONMENT") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Middleware
	r.Use(middleware.CORSMiddleware())

	// Health check endpoint (no auth required)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"service": "accounts",
		})
	})

	// Protected routes
	r.Use(middleware.AuthMiddleware())

	// Routes
	accounts := r.Group("/api/accounts")
	{
		accounts.GET("/", getAccountsHandler)
		accounts.POST("/", createAccountHandler)
		accounts.GET("/:id", getAccountHandler)
		accounts.PUT("/:id", updateAccountHandler)
		accounts.DELETE("/:id", deleteAccountHandler)
		accounts.GET("/:id/balance", getBalanceHandler)
	}

	// Démarrage du serveur
	port := os.Getenv("ACCOUNTS_SERVICE_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Service de gestion des comptes démarré sur le port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

// getAccountsHandler récupère tous les comptes de l'utilisateur connecté
func getAccountsHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	var accounts []models.Account
	if err := database.GetDB().Where("user_id = ?", userID).Find(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la récupération des comptes",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Comptes récupérés avec succès",
		Data:    accounts,
	})
}

// createAccountHandler crée un nouveau compte
func createAccountHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	var request models.CreateAccountRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Données invalides",
			Error:   err.Error(),
		})
		return
	}

	// Valider le type de compte
	if !utils.ValidateAccountType(request.AccountType) {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Type de compte invalide. Types valides: checking, savings, credit",
			Error:   "Bad Request",
		})
		return
	}

	// Définir la devise par défaut
	if request.Currency == "" {
		request.Currency = "EUR"
	}

	// Générer un numéro de compte unique
	accountNumber, err := utils.GenerateAccountNumber(request.AccountType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la génération du numéro de compte",
			Error:   "Internal Server Error",
		})
		return
	}

	// Créer le compte
	account := models.Account{
		UserID:        userID.(uint),
		AccountNumber: accountNumber,
		AccountType:   request.AccountType,
		Balance:       0.0,
		Currency:      request.Currency,
		Status:        "active",
	}

	if err := database.GetDB().Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la création du compte",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Compte créé avec succès",
		Data:    account,
	})
}

// getAccountHandler récupère un compte spécifique
func getAccountHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	accountID := c.Param("id")
	id, err := strconv.ParseUint(accountID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "ID de compte invalide",
			Error:   "Bad Request",
		})
		return
	}

	var account models.Account
	if err := database.GetDB().Where("id = ? AND user_id = ?", id, userID).
		Preload("Transactions").First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Compte non trouvé",
			Error:   "Not Found",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Compte récupéré avec succès",
		Data:    account,
	})
}

// updateAccountHandler met à jour un compte
func updateAccountHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	accountID := c.Param("id")
	id, err := strconv.ParseUint(accountID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "ID de compte invalide",
			Error:   "Bad Request",
		})
		return
	}

	var request struct {
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Données invalides",
			Error:   err.Error(),
		})
		return
	}

	// Valider le statut
	validStatuses := []string{"active", "frozen", "closed"}
	isValidStatus := false
	for _, status := range validStatuses {
		if request.Status == status {
			isValidStatus = true
			break
		}
	}

	if !isValidStatus {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Statut invalide. Statuts valides: active, frozen, closed",
			Error:   "Bad Request",
		})
		return
	}

	// Mettre à jour le compte
	var account models.Account
	if err := database.GetDB().Where("id = ? AND user_id = ?", id, userID).First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Compte non trouvé",
			Error:   "Not Found",
		})
		return
	}

	account.Status = request.Status
	if err := database.GetDB().Save(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la mise à jour du compte",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Compte mis à jour avec succès",
		Data:    account,
	})
}

// deleteAccountHandler supprime un compte
func deleteAccountHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	accountID := c.Param("id")
	id, err := strconv.ParseUint(accountID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "ID de compte invalide",
			Error:   "Bad Request",
		})
		return
	}

	// Vérifier que le compte existe et appartient à l'utilisateur
	var account models.Account
	if err := database.GetDB().Where("id = ? AND user_id = ?", id, userID).First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Compte non trouvé",
			Error:   "Not Found",
		})
		return
	}

	// Vérifier que le solde est nul
	if account.Balance != 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Impossible de supprimer un compte avec un solde non nul",
			Error:   "Bad Request",
		})
		return
	}

	// Supprimer le compte (soft delete)
	if err := database.GetDB().Delete(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la suppression du compte",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Compte supprimé avec succès",
	})
}

// getBalanceHandler récupère le solde d'un compte
func getBalanceHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	accountID := c.Param("id")
	id, err := strconv.ParseUint(accountID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "ID de compte invalide",
			Error:   "Bad Request",
		})
		return
	}

	var account models.Account
	if err := database.GetDB().Select("id, balance, currency").
		Where("id = ? AND user_id = ?", id, userID).First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Compte non trouvé",
			Error:   "Not Found",
		})
		return
	}

	balanceInfo := map[string]interface{}{
		"account_id": account.ID,
		"balance":    account.Balance,
		"currency":   account.Currency,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Solde récupéré avec succès",
		Data:    balanceInfo,
	})
}
