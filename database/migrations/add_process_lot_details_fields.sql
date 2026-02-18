-- ============================================================
-- MIGRATION: Add declared_lot_size and tentative_start_date to process_lot_details
-- ============================================================
-- Description: Add two new required fields to process_lot_details table
--   - declared_lot_size: Declared lot size in number of ERCs
--   - tentative_start_date: Tentative date of start of production
-- Created: 2025-01-21
-- ============================================================

-- Add declared_lot_size column
ALTER TABLE process_lot_details 
ADD COLUMN declared_lot_size INT NOT NULL DEFAULT 0 
COMMENT 'Declared lot size in number of ERCs' 
AFTER rejection_reason;

-- Add tentative_start_date column
ALTER TABLE process_lot_details 
ADD COLUMN tentative_start_date DATE NOT NULL DEFAULT CURDATE() 
COMMENT 'Tentative date of start of production' 
AFTER declared_lot_size;

-- Create index on tentative_start_date for query optimization
CREATE INDEX idx_tentative_start_date ON process_lot_details(tentative_start_date);

