package database

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"banking-app/shared/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// parseDatabaseURL converts DATABASE_URL to MySQL DSN format
// Expected format: mysql://user:password@host:port/database
func parseDatabaseURL(databaseURL string) string {
	// Remove mysql:// prefix
	url := strings.TrimPrefix(databaseURL, "mysql://")
	
	// Split into credentials and host parts
	parts := strings.Split(url, "@")
	if len(parts) != 2 {
		log.Printf("Invalid DATABASE_URL format: %s", databaseURL)
		return ""
	}
	
	credentials := parts[0]
	hostAndDB := parts[1]
	
	// Extract user and password
	userPass := strings.Split(credentials, ":")
	if len(userPass) != 2 {
		log.Printf("Invalid credentials in DATABASE_URL: %s", databaseURL)
		return ""
	}
	user := userPass[0]
	password := userPass[1]
	
	// Extract host, port, and database
	hostPortDB := strings.Split(hostAndDB, "/")
	if len(hostPortDB) != 2 {
		log.Printf("Invalid host/database in DATABASE_URL: %s", databaseURL)
		return ""
	}
	hostPort := hostPortDB[0]
	database := hostPortDB[1]
	
	// Build MySQL DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		user, password, hostPort, database)
	
	return dsn
}

// ConnectDatabase établit la connexion à la base de données MySQL
func ConnectDatabase() error {
	var dsn string
	
	// Try DATABASE_URL first (Docker environment)
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		// Parse DATABASE_URL: mysql://user:password@host:port/database
		dsn = parseDatabaseURL(databaseURL)
	} else {
		// Fall back to individual environment variables
		dbHost := os.Getenv("DB_HOST")
		dbPort := os.Getenv("DB_PORT")
		dbUser := os.Getenv("DB_USER")
		dbPassword := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")

		if dbHost == "" {
			dbHost = "localhost"
		}
		if dbPort == "" {
			dbPort = "3306"
		}

		dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			dbUser, dbPassword, dbHost, dbPort, dbName)
	}

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return fmt.Errorf("erreur de connexion à la base de données: %v", err)
	}

	// Configuration de la pool de connexions
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("erreur de configuration de la pool: %v", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Connexion à la base de données établie avec succès")
	return nil
}

// MigrateDatabase effectue les migrations des modèles
func MigrateDatabase() error {
	if DB == nil {
		return fmt.Errorf("base de données non initialisée")
	}

	err := DB.AutoMigrate(
		&models.User{},
		&models.Account{},
		&models.Transaction{},
		&models.Notification{},
	)

	if err != nil {
		return fmt.Errorf("erreur de migration: %v", err)
	}

	log.Println("Migrations effectuées avec succès")
	return nil
}

// GetDB retourne l'instance de la base de données
func GetDB() *gorm.DB {
	return DB
}

// CloseDatabase ferme la connexion à la base de données
func CloseDatabase() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}
