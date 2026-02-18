-- Migration to make company_id and unit_id nullable in inspection_calls table
-- This allows using POI code instead of company/unit IDs
-- Run this on your database before testing the form submission

USE sarthidb;

ALTER TABLE inspection_calls 
  MODIFY COLUMN company_id INT NULL COMMENT 'Company ID from COMPANY_UNIT_MASTER (nullable - using POI code instead)',
  MODIFY COLUMN unit_id INT NULL COMMENT 'Unit ID from COMPANY_UNIT_MASTER (nullable - using POI code instead)';

-- Verify the change
DESCRIBE inspection_calls;

