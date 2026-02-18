-- ============================================================
-- RITES ERC Inspection System - Database Initialization
-- Azure MySQL Database: sarthidb
-- Server: sarthibackenddb.mysql.database.azure.com
-- ============================================================

-- Use the database
USE sarthidb;

-- ============================================================
-- Create IC Number Sequences Table
-- ============================================================

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

-- ============================================================
-- Initialize IC Number Sequences
-- ============================================================

INSERT INTO ic_number_sequences (type_of_call, prefix, current_year, current_sequence, last_generated_ic)
VALUES 
    ('Raw Material', 'RM-IC', YEAR(CURDATE()), 0, NULL),
    ('Process', 'PROC-IC', YEAR(CURDATE()), 0, NULL),
    ('Final', 'FINAL-IC', YEAR(CURDATE()), 0, NULL)
ON DUPLICATE KEY UPDATE 
    current_year = YEAR(CURDATE()),
    type_of_call = type_of_call;

-- ============================================================
-- Verify Installation
-- ============================================================

SELECT 
    '✅ IC Number Sequences Table Created' AS status,
    COUNT(*) AS total_sequences
FROM ic_number_sequences;

SELECT 
    type_of_call,
    prefix,
    current_year,
    current_sequence,
    last_generated_ic,
    created_at
FROM ic_number_sequences
ORDER BY id;

-- ============================================================
-- Expected Output:
-- ============================================================
-- Row 1: Raw Material  | RM-IC     | 2025 | 0 | NULL
-- Row 2: Process       | PROC-IC   | 2025 | 0 | NULL
-- Row 3: Final         | FINAL-IC  | 2025 | 0 | NULL
-- ============================================================

