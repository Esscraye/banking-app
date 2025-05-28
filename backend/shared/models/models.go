package models

import (
	"time"
	"gorm.io/gorm"
)

// User représente un utilisateur du système bancaire
type User struct {
	ID        uint           `json:"id" gorm:"primaryKey;type:bigint unsigned"`
	Email     string         `json:"email" gorm:"type:varchar(255);uniqueIndex;not null"`
	Password  string         `json:"-" gorm:"not null"`
	FirstName string         `json:"first_name" gorm:"not null"`
	LastName  string         `json:"last_name" gorm:"not null"`
	Phone     string         `json:"phone"`
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relations
	Accounts []Account `json:"accounts,omitempty" gorm:"foreignKey:UserID"`
}

// Account représente un compte bancaire
type Account struct {
	ID            uint           `json:"id" gorm:"primaryKey;type:bigint unsigned"`
	UserID        uint           `json:"user_id" gorm:"type:bigint unsigned;not null"`
	AccountNumber string         `json:"account_number" gorm:"type:varchar(20);uniqueIndex;not null"`
	AccountType   string         `json:"account_type" gorm:"not null"` // checking, savings, credit
	Balance       float64        `json:"balance" gorm:"type:decimal(15,2);default:0"`
	Currency      string         `json:"currency" gorm:"default:'EUR'"`
	Status        string         `json:"status" gorm:"default:'active'"` // active, frozen, closed
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relations
	User         User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Transactions []Transaction `json:"transactions,omitempty" gorm:"foreignKey:AccountID"`
}

// Transaction représente une transaction bancaire
type Transaction struct {
	ID              uint           `json:"id" gorm:"primaryKey;type:bigint unsigned"`
	AccountID       uint           `json:"account_id" gorm:"type:bigint unsigned;not null"`
	Type            string         `json:"type" gorm:"not null"` // debit, credit, transfer
	Amount          float64        `json:"amount" gorm:"type:decimal(15,2);not null"`
	Currency        string         `json:"currency" gorm:"default:'EUR'"`
	Description     string         `json:"description"`
	Reference       string         `json:"reference" gorm:"type:varchar(100);uniqueIndex"`
	Status          string         `json:"status" gorm:"default:'pending'"` // pending, completed, failed, cancelled
	ProcessedAt     *time.Time     `json:"processed_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Pour les transferts
	ToAccountID     *uint          `json:"to_account_id" gorm:"type:bigint unsigned"`
	
	// Relations
	Account   Account  `json:"account,omitempty" gorm:"foreignKey:AccountID"`
	ToAccount *Account `json:"to_account,omitempty" gorm:"foreignKey:ToAccountID"`
}

// Notification représente une notification utilisateur
type Notification struct {
	ID        uint           `json:"id" gorm:"primaryKey;type:bigint unsigned"`
	UserID    uint           `json:"user_id" gorm:"type:bigint unsigned;not null"`
	Type      string         `json:"type" gorm:"not null"` // email, sms, push
	Title     string         `json:"title" gorm:"not null"`
	Message   string         `json:"message" gorm:"not null"`
	Status    string         `json:"status" gorm:"default:'pending'"` // pending, sent, failed
	SentAt    *time.Time     `json:"sent_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relations
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// APIResponse structure standard pour les réponses API
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// LoginRequest structure pour la connexion
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse structure pour la réponse de connexion
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// CreateAccountRequest structure pour créer un compte
type CreateAccountRequest struct {
	AccountType string `json:"account_type" binding:"required"`
	Currency    string `json:"currency"`
}

// TransactionRequest structure pour créer une transaction
type TransactionRequest struct {
	Type        string  `json:"type" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Description string  `json:"description"`
	ToAccountID *uint   `json:"to_account_id"` // Pour les transferts
}
