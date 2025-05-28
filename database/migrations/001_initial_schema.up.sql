-- Migration initiale pour créer le schéma de base de données bancaire

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_deleted_at (deleted_at)
);

-- Table des comptes bancaires
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type ENUM('checking', 'savings', 'business') NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'EUR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_account_number (account_number),
    INDEX idx_deleted_at (deleted_at)
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    from_account_id BIGINT UNSIGNED,
    to_account_id BIGINT UNSIGNED,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type ENUM('deposit', 'withdrawal', 'transfer', 'payment') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    description TEXT,
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (from_account_id) REFERENCES accounts(id),
    FOREIGN KEY (to_account_id) REFERENCES accounts(id),
    INDEX idx_from_account_id (from_account_id),
    INDEX idx_to_account_id (to_account_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Table des sessions d'authentification
CREATE TABLE IF NOT EXISTS auth_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Données de test
INSERT INTO users (email, password, first_name, last_name, phone) VALUES
('john.doe@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1VLT.91AISANKe1xfF5PnlKQPtHRqsG', 'John', 'Doe', '0123456789'),
('jane.smith@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1VLT.91AISANKe1xfF5PnlKQPtHRqsG', 'Jane', 'Smith', '0987654321');

INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES
(1, 'ACC001234567890', 'checking', 1500.00),
(1, 'SAV001234567890', 'savings', 5000.00),
(2, 'ACC001234567891', 'checking', 2500.00);
