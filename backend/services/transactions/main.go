package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

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
			"status":  "healthy",
			"service": "transactions",
		})
	})

	// Protected routes
	r.Use(middleware.AuthMiddleware())

	// Routes
	transactions := r.Group("/api/transactions")
	{
		transactions.GET("/", getTransactionsHandler)
		transactions.POST("/", createTransactionHandler)
		transactions.GET("/:id", getTransactionHandler)
		transactions.GET("/account/:accountId", getAccountTransactionsHandler)
		transactions.POST("/transfer", transferHandler)
	}

	// Démarrage du serveur
	port := os.Getenv("TRANSACTIONS_SERVICE_PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("Service de transactions démarré sur le port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

// getTransactionsHandler récupère toutes les transactions de l'utilisateur
func getTransactionsHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	var transactions []models.Transaction
	if err := database.GetDB().
		Joins("JOIN accounts ON transactions.account_id = accounts.id").
		Where("accounts.user_id = ?", userID).
		Preload("Account").
		Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la récupération des transactions",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Transactions récupérées avec succès",
		Data:    transactions,
	})
}

// createTransactionHandler crée une nouvelle transaction
func createTransactionHandler(c *gin.Context) {
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
		AccountID   uint    `json:"account_id" binding:"required"`
		Type        string  `json:"type" binding:"required"`
		Amount      float64 `json:"amount" binding:"required,gt=0"`
		Description string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Données invalides",
			Error:   err.Error(),
		})
		return
	}

	// Valider le type de transaction
	if !utils.ValidateTransactionType(request.Type) {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Type de transaction invalide. Types valides: debit, credit",
			Error:   "Bad Request",
		})
		return
	}

	// Vérifier que le compte appartient à l'utilisateur
	var account models.Account
	if err := database.GetDB().Where("id = ? AND user_id = ?", request.AccountID, userID).
		First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Compte non trouvé",
			Error:   "Not Found",
		})
		return
	}

	// Vérifier que le compte est actif
	if account.Status != "active" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Le compte n'est pas actif",
			Error:   "Bad Request",
		})
		return
	}

	// Pour les débits, vérifier que le solde est suffisant
	if request.Type == "debit" && account.Balance < request.Amount {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Solde insuffisant",
			Error:   "Bad Request",
		})
		return
	}

	// Générer une référence unique
	reference, err := utils.GenerateTransactionReference()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la génération de la référence",
			Error:   "Internal Server Error",
		})
		return
	}

	// Démarrer une transaction de base de données
	tx := database.GetDB().Begin()

	// Créer la transaction
	transaction := models.Transaction{
		AccountID:   request.AccountID,
		Type:        request.Type,
		Amount:      request.Amount,
		Currency:    account.Currency,
		Description: request.Description,
		Reference:   reference,
		Status:      "completed",
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la création de la transaction",
			Error:   "Internal Server Error",
		})
		return
	}

	// Mettre à jour le solde du compte
	var newBalance float64
	if request.Type == "credit" {
		newBalance = account.Balance + request.Amount
	} else {
		newBalance = account.Balance - request.Amount
	}

	if err := tx.Model(&account).Update("balance", newBalance).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la mise à jour du solde",
			Error:   "Internal Server Error",
		})
		return
	}

	// Marquer la transaction comme traitée
	now := time.Now()
	transaction.ProcessedAt = &now

	if err := tx.Save(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la finalisation de la transaction",
			Error:   "Internal Server Error",
		})
		return
	}

	// Confirmer la transaction
	tx.Commit()

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Transaction créée avec succès",
		Data:    transaction,
	})
}

// getTransactionHandler récupère une transaction spécifique
func getTransactionHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	transactionID := c.Param("id")
	id, err := strconv.ParseUint(transactionID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "ID de transaction invalide",
			Error:   "Bad Request",
		})
		return
	}

	var transaction models.Transaction
	if err := database.GetDB().
		Joins("JOIN accounts ON transactions.account_id = accounts.id").
		Where("transactions.id = ? AND accounts.user_id = ?", id, userID).
		Preload("Account").
		First(&transaction).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Transaction non trouvée",
			Error:   "Not Found",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Transaction récupérée avec succès",
		Data:    transaction,
	})
}

// getAccountTransactionsHandler récupère les transactions d'un compte
func getAccountTransactionsHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	accountID := c.Param("accountId")
	id, err := strconv.ParseUint(accountID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "ID de compte invalide",
			Error:   "Bad Request",
		})
		return
	}

	// Vérifier que le compte appartient à l'utilisateur
	var account models.Account
	if err := database.GetDB().Where("id = ? AND user_id = ?", id, userID).
		First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Compte non trouvé",
			Error:   "Not Found",
		})
		return
	}

	var transactions []models.Transaction
	if err := database.GetDB().Where("account_id = ?", id).
		Order("created_at DESC").
		Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la récupération des transactions",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Transactions du compte récupérées avec succès",
		Data:    transactions,
	})
}

// transferHandler gère les transferts entre comptes
func transferHandler(c *gin.Context) {
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
		FromAccountID uint    `json:"from_account_id" binding:"required"`
		ToAccountID   uint    `json:"to_account_id" binding:"required"`
		Amount        float64 `json:"amount" binding:"required,gt=0"`
		Description   string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Données invalides",
			Error:   err.Error(),
		})
		return
	}

	// Vérifier que les comptes sont différents
	if request.FromAccountID == request.ToAccountID {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Impossible de transférer vers le même compte",
			Error:   "Bad Request",
		})
		return
	}

	// Vérifier que le compte source appartient à l'utilisateur
	var fromAccount models.Account
	if err := database.GetDB().Where("id = ? AND user_id = ?", request.FromAccountID, userID).
		First(&fromAccount).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Compte source non trouvé",
			Error:   "Not Found",
		})
		return
	}

	// Vérifier que le compte destination existe
	var toAccount models.Account
	if err := database.GetDB().Where("id = ?", request.ToAccountID).
		First(&toAccount).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Compte destination non trouvé",
			Error:   "Not Found",
		})
		return
	}

	// Vérifications
	if fromAccount.Status != "active" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Le compte source n'est pas actif",
			Error:   "Bad Request",
		})
		return
	}

	if toAccount.Status != "active" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Le compte destination n'est pas actif",
			Error:   "Bad Request",
		})
		return
	}

	if fromAccount.Balance < request.Amount {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Solde insuffisant",
			Error:   "Bad Request",
		})
		return
	}

	// Générer une référence unique
	reference, err := utils.GenerateTransactionReference()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la génération de la référence",
			Error:   "Internal Server Error",
		})
		return
	}

	// Démarrer une transaction de base de données
	tx := database.GetDB().Begin()

	now := time.Now()

	// Créer la transaction de débit
	debitTransaction := models.Transaction{
		AccountID:   request.FromAccountID,
		Type:        "transfer",
		Amount:      request.Amount,
		Currency:    fromAccount.Currency,
		Description: request.Description,
		Reference:   reference + "-OUT",
		Status:      "completed",
		ToAccountID: &request.ToAccountID,
		ProcessedAt: &now,
	}

	if err := tx.Create(&debitTransaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la création de la transaction de débit",
			Error:   "Internal Server Error",
		})
		return
	}

	// Créer la transaction de crédit
	creditTransaction := models.Transaction{
		AccountID:   request.ToAccountID,
		Type:        "transfer",
		Amount:      request.Amount,
		Currency:    toAccount.Currency,
		Description: request.Description,
		Reference:   reference + "-IN",
		Status:      "completed",
		ProcessedAt: &now,
	}

	if err := tx.Create(&creditTransaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la création de la transaction de crédit",
			Error:   "Internal Server Error",
		})
		return
	}

	// Mettre à jour les soldes
	if err := tx.Model(&fromAccount).Update("balance", fromAccount.Balance-request.Amount).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la mise à jour du solde source",
			Error:   "Internal Server Error",
		})
		return
	}

	if err := tx.Model(&toAccount).Update("balance", toAccount.Balance+request.Amount).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la mise à jour du solde destination",
			Error:   "Internal Server Error",
		})
		return
	}

	// Confirmer la transaction
	tx.Commit()

	transferResult := map[string]interface{}{
		"transfer_reference": reference,
		"debit_transaction":  debitTransaction,
		"credit_transaction": creditTransaction,
		"amount":             request.Amount,
		"from_account_id":    request.FromAccountID,
		"to_account_id":      request.ToAccountID,
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Transfert effectué avec succès",
		Data:    transferResult,
	})
}
