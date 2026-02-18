-- ============================================================
-- RITES ERC Database Dump
-- Import this file in MySQL Workbench
-- ============================================================

-- Create and use database
CREATE DATABASE IF NOT EXISTS rites_erc_inspection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rites_erc_inspection;

-- Create IC Number Sequences Table
CREATE TABLE IF NOT EXISTS ic_number_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_of_call VARCHAR(50) NOT NULL UNIQUE,
    prefix VARCHAR(20) NOT NULL,
    current_year INT NOT NULL,
    current_sequence INT NOT NULL DEFAULT 0,
    last_generated_ic VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ic_sequences_type (type_of_call)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial data
INSERT INTO ic_number_sequences (type_of_call, prefix, current_year, current_sequence, last_generated_ic)
VALUES 
    ('Raw Material', 'RM-IC', YEAR(CURDATE()), 0, NULL),
    ('Process', 'PROC-IC', YEAR(CURDATE()), 0, NULL),
    ('Final', 'FINAL-IC', YEAR(CURDATE()), 0, NULL)
ON DUPLICATE KEY UPDATE type_of_call = type_of_call;

-- Verify
SELECT 'Database setup complete!' AS Status;
SELECT * FROM ic_number_sequences;

