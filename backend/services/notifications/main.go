package main

import (
	"log"
	"net/http"
	"os"
	"strconv"

	"banking-app/shared/database"
	"banking-app/shared/middleware"
	"banking-app/shared/models"

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
			"service": "notifications",
		})
	})

	// Protected routes
	r.Use(middleware.AuthMiddleware())

	// Routes
	notifications := r.Group("/api/notifications")
	{
		notifications.GET("/", getNotificationsHandler)
		notifications.POST("/", createNotificationHandler)
		notifications.GET("/:id", getNotificationHandler)
		notifications.PUT("/:id/read", markAsReadHandler)
		notifications.DELETE("/:id", deleteNotificationHandler)
	}

	// Démarrage du serveur
	port := os.Getenv("NOTIFICATIONS_SERVICE_PORT")
	if port == "" {
		port = "8083"
	}

	log.Printf("Service de notifications démarré sur le port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

// getNotificationsHandler récupère toutes les notifications de l'utilisateur
func getNotificationsHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	var notifications []models.Notification
	if err := database.GetDB().Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la récupération des notifications",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Notifications récupérées avec succès",
		Data:    notifications,
	})
}

// createNotificationHandler crée une nouvelle notification
func createNotificationHandler(c *gin.Context) {
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
		Type    string `json:"type" binding:"required"`
		Title   string `json:"title" binding:"required"`
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Données invalides",
			Error:   err.Error(),
		})
		return
	}

	// Valider le type de notification
	validTypes := []string{"email", "sms", "push", "system"}
	isValidType := false
	for _, validType := range validTypes {
		if request.Type == validType {
			isValidType = true
			break
		}
	}

	if !isValidType {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Type de notification invalide. Types valides: email, sms, push, system",
			Error:   "Bad Request",
		})
		return
	}

	// Créer la notification
	notification := models.Notification{
		UserID:  userID.(uint),
		Type:    request.Type,
		Title:   request.Title,
		Message: request.Message,
		Status:  "pending",
	}

	if err := database.GetDB().Create(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la création de la notification",
			Error:   "Internal Server Error",
		})
		return
	}

	// Simuler l'envoi de la notification (ici on la marque comme envoyée)
	go func() {
		// Dans un vrai système, ici on enverrait la notification via le service approprié
		// (service email, SMS, push notification, etc.)
		
		// Pour la simulation, on attend un peu puis on marque comme envoyée
		//time.Sleep(2 * time.Second)
		
		//now := time.Now()
		//database.GetDB().Model(&notification).Updates(models.Notification{
		//	Status: "sent",
		//	SentAt: &now,
		//})
	}()

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Notification créée avec succès",
		Data:    notification,
	})
}

// getNotificationHandler récupère une notification spécifique
func getNotificationHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	notificationID := c.Param("id")
	id, err := strconv.ParseUint(notificationID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "ID de notification invalide",
			Error:   "Bad Request",
		})
		return
	}

	var notification models.Notification
	if err := database.GetDB().Where("id = ? AND user_id = ?", id, userID).
		First(&notification).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Notification non trouvée",
			Error:   "Not Found",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Notification récupérée avec succès",
		Data:    notification,
	})
}

// markAsReadHandler marque une notification comme lue
func markAsReadHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	notificationID := c.Param("id")
	id, err := strconv.ParseUint(notificationID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "ID de notification invalide",
			Error:   "Bad Request",
		})
		return
	}

	// Vérifier que la notification existe et appartient à l'utilisateur
	var notification models.Notification
	if err := database.GetDB().Where("id = ? AND user_id = ?", id, userID).
		First(&notification).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Notification non trouvée",
			Error:   "Not Found",
		})
		return
	}

	// Marquer comme lue (pour cet exemple, on change le statut)
	notification.Status = "read"
	if err := database.GetDB().Save(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la mise à jour de la notification",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Notification marquée comme lue",
		Data:    notification,
	})
}

// deleteNotificationHandler supprime une notification
func deleteNotificationHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Utilisateur non authentifié",
			Error:   "Unauthorized",
		})
		return
	}

	notificationID := c.Param("id")
	id, err := strconv.ParseUint(notificationID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "ID de notification invalide",
			Error:   "Bad Request",
		})
		return
	}

	// Vérifier que la notification existe et appartient à l'utilisateur
	var notification models.Notification
	if err := database.GetDB().Where("id = ? AND user_id = ?", id, userID).
		First(&notification).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Notification non trouvée",
			Error:   "Not Found",
		})
		return
	}

	// Supprimer la notification
	if err := database.GetDB().Delete(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Erreur lors de la suppression de la notification",
			Error:   "Internal Server Error",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Notification supprimée avec succès",
	})
}

// Helper function pour créer des notifications système
func CreateSystemNotification(userID uint, title, message string) error {
	notification := models.Notification{
		UserID:  userID,
		Type:    "system",
		Title:   title,
		Message: message,
		Status:  "sent",
	}

	return database.GetDB().Create(&notification).Error
}
