-- ============================================================
-- RITES ERC Inspection System - Local MySQL Setup
-- For MySQL Workbench (Local Development)
-- ============================================================

-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS sarthidb
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Step 2: Use the database
USE sarthidb;

-- Step 3: Create IC Number Sequences Table
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

-- Step 4: Initialize IC Number Sequences
INSERT INTO ic_number_sequences (type_of_call, prefix, current_year, current_sequence, last_generated_ic)
VALUES 
    ('Raw Material', 'RM-IC', YEAR(CURDATE()), 0, NULL),
    ('Process', 'PROC-IC', YEAR(CURDATE()), 0, NULL),
    ('Final', 'FINAL-IC', YEAR(CURDATE()), 0, NULL)
ON DUPLICATE KEY UPDATE 
    current_year = YEAR(CURDATE()),
    type_of_call = type_of_call;

-- Step 5: Verify Installation
SELECT 
    '✅ Database Created: sarthidb' AS status
UNION ALL
SELECT 
    CONCAT('✅ IC Sequences Table Created with ', COUNT(*), ' sequences') AS status
FROM ic_number_sequences;

-- Step 6: Show all sequences
SELECT 
    id,
    type_of_call AS 'Type',
    prefix AS 'Prefix',
    current_year AS 'Year',
    current_sequence AS 'Sequence',
    last_generated_ic AS 'Last IC Number',
    created_at AS 'Created'
FROM ic_number_sequences
ORDER BY id;

-- ============================================================
-- Expected Output:
-- ============================================================
-- Row 1: Raw Material  | RM-IC     | 2025 | 0 | NULL
-- Row 2: Process       | PROC-IC   | 2025 | 0 | NULL
-- Row 3: Final         | FINAL-IC  | 2025 | 0 | NULL
-- ============================================================

-- ============================================================
-- NOTES:
-- ============================================================
-- 1. Make sure MySQL server is running on localhost:3306
-- 2. Default username: root
-- 3. Default password: root (or your MySQL root password)
-- 4. Run this script in MySQL Workbench
-- 5. After running, start Spring Boot backend
-- ============================================================

